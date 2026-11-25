use std::env;
use std::ffi::OsString;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};
use std::thread;
use std::time::Instant;

#[derive(Debug, Clone, PartialEq, Eq)]
struct CliArgs {
    input: PathBuf,
    output_dir: Option<PathBuf>,
    keep_backup: Option<PathBuf>,
    bitrate: String,
    loudnorm: bool,
    dry_run: bool,
    sample: Option<usize>,
    jobs: usize,
}

#[derive(Debug, Clone, PartialEq)]
struct ProbeInfo {
    codec: String,
    duration: f64,
}

enum FileOutcome {
    DryRun { old_size: u64 },
    Optimized { old_size: u64, new_size: u64 },
    Skipped { old_size: u64, reason: String },
}

fn default_jobs() -> usize {
    thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(4)
        .max(1)
}

fn parse_args<I>(args: I) -> Result<CliArgs, String>
where
    I: IntoIterator<Item = String>,
{
    let mut cfg = CliArgs {
        input: PathBuf::from("public/audio"),
        output_dir: None,
        keep_backup: None,
        bitrate: String::from("24k"),
        loudnorm: true,
        dry_run: false,
        sample: None,
        jobs: default_jobs(),
    };

    let mut iter = args.into_iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--input" => {
                let val = iter.next().ok_or("--input requires a directory path")?;
                cfg.input = PathBuf::from(val);
            }
            "--output-dir" => {
                let val = iter
                    .next()
                    .ok_or("--output-dir requires a directory path")?;
                cfg.output_dir = Some(PathBuf::from(val));
            }
            "--keep-backup" => {
                let val = iter
                    .next()
                    .ok_or("--keep-backup requires a directory path")?;
                cfg.keep_backup = Some(PathBuf::from(val));
            }
            "--bitrate" => {
                let val = iter
                    .next()
                    .ok_or("--bitrate requires a value such as 24k or 32k")?;
                cfg.bitrate = val;
            }
            "--no-loudnorm" => cfg.loudnorm = false,
            "--loudnorm" => cfg.loudnorm = true,
            "--dry-run" => cfg.dry_run = true,
            "--sample" => {
                let val = iter.next().ok_or("--sample requires a positive integer")?;
                let parsed = val
                    .parse::<usize>()
                    .map_err(|_| format!("Invalid --sample value: {val}"))?;
                if parsed == 0 {
                    return Err(String::from("--sample must be greater than 0"));
                }
                cfg.sample = Some(parsed);
            }
            "--jobs" => {
                let val = iter.next().ok_or("--jobs requires a positive integer")?;
                let parsed = val
                    .parse::<usize>()
                    .map_err(|_| format!("Invalid --jobs value: {val}"))?;
                cfg.jobs = parsed.max(1);
            }
            other => return Err(format!("Unknown argument: {other}")),
        }
    }

    Ok(cfg)
}

fn is_target_webm(path: &Path) -> bool {
    let ext_match = path
        .extension()
        .and_then(|s| s.to_str())
        .map(|s| s.eq_ignore_ascii_case("webm"))
        .unwrap_or(false);
    if !ext_match {
        return false;
    }
    let name_match = path
        .file_name()
        .and_then(|s| s.to_str())
        .map(|s| !s.contains(".opt.tmp."))
        .unwrap_or(false);
    name_match
}

fn collect_webm_files(dir: &Path, sample: Option<usize>) -> Result<Vec<PathBuf>, String> {
    let entries = fs::read_dir(dir)
        .map_err(|err| format!("Cannot read input directory {}: {err}", dir.display()))?;
    let mut files = Vec::new();
    for entry_res in entries {
        let entry = entry_res.map_err(|err| format!("Cannot inspect entry: {err}"))?;
        let path = entry.path();
        if path.is_file() && is_target_webm(&path) {
            files.push(path);
        }
    }
    files.sort();
    if let Some(limit) = sample {
        files.truncate(limit);
    }
    Ok(files)
}

fn parse_ffprobe_output(stdout: &str) -> Result<ProbeInfo, String> {
    let lines: Vec<&str> = stdout
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .collect();
    if lines.is_empty() {
        return Err(String::from("Empty ffprobe output"));
    }

    let (codec_raw, duration_raw) = if lines.len() >= 2 {
        (
            lines[0].split(',').next().unwrap_or("").trim(),
            lines[1].split(',').next().unwrap_or("").trim(),
        )
    } else {
        let parts: Vec<&str> = lines[0].split(',').map(str::trim).collect();
        if parts.len() < 2 {
            return Err(format!("Malformed ffprobe line: {}", lines[0]));
        }
        (parts[0], parts[1])
    };

    if codec_raw.is_empty() {
        return Err(String::from("Missing audio codec in ffprobe output"));
    }
    let duration = duration_raw
        .parse::<f64>()
        .map_err(|_| format!("Invalid duration in ffprobe output: {duration_raw}"))?;
    if !duration.is_finite() || duration <= 0.0 {
        return Err(format!("Non-positive duration: {duration}"));
    }

    Ok(ProbeInfo {
        codec: codec_raw.to_ascii_lowercase(),
        duration,
    })
}

fn is_duration_valid(old_duration: f64, new_duration: f64) -> bool {
    if !new_duration.is_finite() || new_duration <= 0.05 {
        return false;
    }
    let tolerance = (old_duration * 0.25).max(0.5);
    (new_duration - old_duration).abs() <= tolerance
}

fn should_replace_file(old_size: u64, new_size: u64) -> bool {
    new_size > 0 && new_size < old_size
}

fn temp_output_path(dest_dir: &Path, file_name: &str) -> PathBuf {
    dest_dir.join(format!(".{file_name}.opt.tmp.webm"))
}

fn build_ffmpeg_args(input: &Path, output: &Path, bitrate: &str, loudnorm: bool) -> Vec<OsString> {
    let mut args = vec![
        OsString::from("-v"),
        OsString::from("error"),
        OsString::from("-y"),
        OsString::from("-i"),
        input.as_os_str().to_os_string(),
        OsString::from("-vn"),
        OsString::from("-ac"),
        OsString::from("1"),
        OsString::from("-c:a"),
        OsString::from("libopus"),
        OsString::from("-b:a"),
        OsString::from(bitrate),
        OsString::from("-vbr"),
        OsString::from("on"),
        OsString::from("-application"),
        OsString::from("voip"),
    ];
    if loudnorm {
        args.push(OsString::from("-af"));
        args.push(OsString::from("loudnorm=I=-16:TP=-1.5:LRA=11"));
    }
    args.push(OsString::from("-f"));
    args.push(OsString::from("webm"));
    args.push(output.as_os_str().to_os_string());
    args
}

fn probe_audio(path: &Path) -> Result<ProbeInfo, String> {
    let output = Command::new("ffprobe")
        .args([
            "-v",
            "error",
            "-select_streams",
            "a:0",
            "-show_entries",
            "stream=codec_name:format=duration",
            "-of",
            "csv=p=0",
        ])
        .arg(path)
        .output()
        .map_err(|err| format!("Failed to launch ffprobe: {err}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("ffprobe failed: {}", stderr.trim()));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    parse_ffprobe_output(&stdout)
}

fn process_single_file(path: &Path, cfg: &CliArgs) -> Result<FileOutcome, String> {
    let meta = fs::metadata(path)
        .map_err(|err| format!("Failed to read metadata for {}: {err}", path.display()))?;
    let old_size = meta.len();
    if old_size == 0 {
        return Err(format!("Zero-byte input file: {}", path.display()));
    }

    let old_probe = probe_audio(path)?;
    if cfg.dry_run {
        return Ok(FileOutcome::DryRun { old_size });
    }

    let file_name = path
        .file_name()
        .and_then(|s| s.to_str())
        .ok_or_else(|| format!("Invalid UTF-8 file name: {}", path.display()))?;
    let dest_dir = match &cfg.output_dir {
        Some(dir) => dir.as_path(),
        None => path.parent().unwrap_or_else(|| Path::new(".")),
    };
    let dest_path = dest_dir.join(file_name);
    let tmp_path = temp_output_path(dest_dir, file_name);

    let ffmpeg_args = build_ffmpeg_args(path, &tmp_path, &cfg.bitrate, cfg.loudnorm);
    let status = Command::new("ffmpeg")
        .args(&ffmpeg_args)
        .output()
        .map_err(|err| format!("Failed to launch ffmpeg: {err}"))?;

    if !status.status.success() {
        let _ = fs::remove_file(&tmp_path);
        let stderr = String::from_utf8_lossy(&status.stderr);
        return Err(format!("ffmpeg error on {file_name}: {}", stderr.trim()));
    }

    let new_size = match fs::metadata(&tmp_path) {
        Ok(m) => m.len(),
        Err(err) => {
            let _ = fs::remove_file(&tmp_path);
            return Err(format!("Missing transcoded output for {file_name}: {err}"));
        }
    };

    let new_probe = match probe_audio(&tmp_path) {
        Ok(p) => p,
        Err(err) => {
            let _ = fs::remove_file(&tmp_path);
            return Err(format!("Output validation failed for {file_name}: {err}"));
        }
    };

    if new_probe.codec != "opus" {
        let _ = fs::remove_file(&tmp_path);
        return Err(format!(
            "Unexpected output codec {} for {file_name}",
            new_probe.codec
        ));
    }

    if !is_duration_valid(old_probe.duration, new_probe.duration) {
        let _ = fs::remove_file(&tmp_path);
        return Err(format!(
            "Duration mismatch for {file_name}: old={:.3}s new={:.3}s",
            old_probe.duration, new_probe.duration
        ));
    }

    if !should_replace_file(old_size, new_size) {
        let _ = fs::remove_file(&tmp_path);
        return Ok(FileOutcome::Skipped {
            old_size,
            reason: format!("output ({new_size} B) >= input ({old_size} B)"),
        });
    }

    if let Some(backup_dir) = &cfg.keep_backup {
        let backup_dest = backup_dir.join(file_name);
        fs::copy(path, &backup_dest).map_err(|err| {
            let _ = fs::remove_file(&tmp_path);
            format!("Failed to copy backup for {file_name}: {err}")
        })?;
    }

    fs::rename(&tmp_path, &dest_path).map_err(|err| {
        let _ = fs::remove_file(&tmp_path);
        format!("Failed to replace {file_name}: {err}")
    })?;

    Ok(FileOutcome::Optimized { old_size, new_size })
}

fn format_mb(bytes: u64) -> f64 {
    bytes as f64 / (1024.0 * 1024.0)
}

fn run() -> Result<(), String> {
    let cfg = parse_args(env::args().skip(1))?;
    if !cfg.dry_run {
        if let Some(dir) = &cfg.output_dir {
            fs::create_dir_all(dir)
                .map_err(|err| format!("Failed to create output dir {}: {err}", dir.display()))?;
        }
        if let Some(dir) = &cfg.keep_backup {
            fs::create_dir_all(dir)
                .map_err(|err| format!("Failed to create backup dir {}: {err}", dir.display()))?;
        }
    }

    let files = collect_webm_files(&cfg.input, cfg.sample)?;
    let total = files.len();
    if total == 0 {
        println!("No .webm files found in {}", cfg.input.display());
        return Ok(());
    }

    let start = Instant::now();
    let cursor = AtomicUsize::new(0);
    let optimized_count = AtomicUsize::new(0);
    let skipped_count = AtomicUsize::new(0);
    let failed_count = AtomicUsize::new(0);
    let total_before = AtomicU64::new(0);
    let total_after = AtomicU64::new(0);
    let worker_count = cfg.jobs.min(total);

    thread::scope(|scope| {
        for _ in 0..worker_count {
            scope.spawn(|| loop {
                let idx = cursor.fetch_add(1, Ordering::Relaxed);
                if idx >= files.len() {
                    break;
                }
                let path = &files[idx];
                match process_single_file(path, &cfg) {
                    Ok(FileOutcome::DryRun { old_size }) => {
                        total_before.fetch_add(old_size, Ordering::Relaxed);
                        total_after.fetch_add(old_size, Ordering::Relaxed);
                        optimized_count.fetch_add(1, Ordering::Relaxed);
                    }
                    Ok(FileOutcome::Optimized { old_size, new_size }) => {
                        total_before.fetch_add(old_size, Ordering::Relaxed);
                        total_after.fetch_add(new_size, Ordering::Relaxed);
                        optimized_count.fetch_add(1, Ordering::Relaxed);
                    }
                    Ok(FileOutcome::Skipped { old_size, reason }) => {
                        total_before.fetch_add(old_size, Ordering::Relaxed);
                        total_after.fetch_add(old_size, Ordering::Relaxed);
                        skipped_count.fetch_add(1, Ordering::Relaxed);
                        eprintln!("[SKIP] {}: {reason}", path.display());
                    }
                    Err(err) => {
                        let fallback_size = fs::metadata(path).map(|m| m.len()).unwrap_or(0);
                        total_before.fetch_add(fallback_size, Ordering::Relaxed);
                        total_after.fetch_add(fallback_size, Ordering::Relaxed);
                        failed_count.fetch_add(1, Ordering::Relaxed);
                        eprintln!("[FAIL] {}: {err}", path.display());
                    }
                }
            });
        }
    });

    let before_bytes = total_before.load(Ordering::Relaxed);
    let after_bytes = total_after.load(Ordering::Relaxed);
    let saved_bytes = before_bytes.saturating_sub(after_bytes);
    let saved_pct = if before_bytes > 0 {
        (saved_bytes as f64 / before_bytes as f64) * 100.0
    } else {
        0.0
    };
    let elapsed = start.elapsed().as_secs_f64();

    println!(
        "Scanned: {} | {}: {} | Skipped: {} | Failed: {} | Before: {} B ({:.2} MB) | After: {} B ({:.2} MB) | Saved: {} B ({:.2}%) | Time: {:.2}s",
        total,
        if cfg.dry_run { "Eligible" } else { "Optimized" },
        optimized_count.load(Ordering::Relaxed),
        skipped_count.load(Ordering::Relaxed),
        failed_count.load(Ordering::Relaxed),
        before_bytes,
        format_mb(before_bytes),
        after_bytes,
        format_mb(after_bytes),
        saved_bytes,
        saved_pct,
        elapsed
    );

    if failed_count.load(Ordering::Relaxed) > 0 {
        return Err(String::from("One or more audio files failed optimization"));
    }

    Ok(())
}

fn main() {
    if let Err(err) = run() {
        eprintln!("Error: {err}");
        std::process::exit(1);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn filters_only_regular_webm_files() {
        assert!(is_target_webm(Path::new("public/audio/1abc.webm")));
        assert!(is_target_webm(Path::new("public/audio/1ABC.WEBM")));
        assert!(!is_target_webm(Path::new("public/audio/coi.mp3")));
        assert!(!is_target_webm(Path::new("public/audio/README.md")));
        assert!(!is_target_webm(Path::new(
            "public/audio/.1abc.webm.opt.tmp.webm"
        )));
    }

    #[test]
    fn parses_ffprobe_multiline_and_singleline_outputs() {
        let multi = "opus\n3.059892\n";
        let parsed = parse_ffprobe_output(multi).expect("should parse multiline");
        assert_eq!(parsed.codec, "opus");
        assert!((parsed.duration - 3.059892).abs() < 1e-6);

        let single = "opus,0.719052";
        let parsed_single = parse_ffprobe_output(single).expect("should parse csv line");
        assert_eq!(parsed_single.codec, "opus");
        assert!((parsed_single.duration - 0.719052).abs() < 1e-6);

        assert!(parse_ffprobe_output("").is_err());
        assert!(parse_ffprobe_output("opus\nN/A\n").is_err());
        assert!(parse_ffprobe_output("opus\n0.0\n").is_err());
    }

    #[test]
    fn validates_duration_with_opus_padding_tolerance() {
        assert!(is_duration_valid(0.719, 0.788));
        assert!(is_duration_valid(3.060, 3.208));
        assert!(!is_duration_valid(3.060, 0.01));
        assert!(!is_duration_valid(3.060, 0.5));
        assert!(!is_duration_valid(2.0, f64::NAN));
    }

    #[test]
    fn replaces_only_when_compressed_file_is_smaller_and_non_empty() {
        assert!(should_replace_file(50_528, 10_433));
        assert!(!should_replace_file(50_528, 50_528));
        assert!(!should_replace_file(10_000, 12_000));
        assert!(!should_replace_file(10_000, 0));
    }

    #[test]
    fn parses_cli_flags_and_rejects_invalid_values() {
        let defaults = parse_args(Vec::<String>::new()).expect("defaults");
        assert_eq!(defaults.input, PathBuf::from("public/audio"));
        assert_eq!(defaults.bitrate, "24k");
        assert!(defaults.loudnorm);
        assert!(!defaults.dry_run);
        assert_eq!(defaults.sample, None);

        let custom = parse_args([
            "--input".to_string(),
            "custom/dir".to_string(),
            "--bitrate".to_string(),
            "32k".to_string(),
            "--no-loudnorm".to_string(),
            "--dry-run".to_string(),
            "--sample".to_string(),
            "10".to_string(),
            "--jobs".to_string(),
            "2".to_string(),
        ])
        .expect("custom flags");
        assert_eq!(custom.input, PathBuf::from("custom/dir"));
        assert_eq!(custom.bitrate, "32k");
        assert!(!custom.loudnorm);
        assert!(custom.dry_run);
        assert_eq!(custom.sample, Some(10));
        assert_eq!(custom.jobs, 2);

        assert!(parse_args(["--sample".to_string(), "0".to_string()]).is_err());
        assert!(parse_args(["--unknown".to_string()]).is_err());
    }

    #[test]
    fn collects_only_sorted_webm_files_with_sample_limit() {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let temp_dir = env::temp_dir().join(format!("audio_opt_test_{unique}"));
        fs::create_dir_all(&temp_dir).unwrap();
        fs::write(temp_dir.join("b.webm"), b"1").unwrap();
        fs::write(temp_dir.join("a.webm"), b"1").unwrap();
        fs::write(temp_dir.join("ignore.mp3"), b"1").unwrap();
        fs::write(temp_dir.join("README.md"), b"1").unwrap();
        fs::write(temp_dir.join(".hidden.webm.opt.tmp.webm"), b"1").unwrap();

        let collected = collect_webm_files(&temp_dir, Some(1)).unwrap();
        assert_eq!(collected.len(), 1);
        assert_eq!(collected[0].file_name().unwrap(), "a.webm");

        let all = collect_webm_files(&temp_dir, None).unwrap();
        assert_eq!(all.len(), 2);

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
