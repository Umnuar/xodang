use crate::storage::ContributionRecord;
use serde::Serialize;
use std::env;
use std::fs;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::process::Command;

const BASE64_TABLE: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

#[derive(Serialize)]
struct AppsScriptPayload<'a> {
    #[serde(rename = "type")]
    kind: &'a str,
    vietnamese: &'a str,
    xodang: &'a str,
    #[serde(rename = "readingContent")]
    reading_content: &'a str,
    #[serde(rename = "audioData")]
    audio_data: String,
    #[serde(rename = "mimeType")]
    mime_type: &'a str,
    filename: &'a str,
}

pub fn encode_base64(input: &[u8]) -> String {
    if input.is_empty() {
        return String::new();
    }
    let out_len = input.len().div_ceil(3) * 4;
    let mut out = String::with_capacity(out_len);
    for chunk in input.chunks(3) {
        let b0 = chunk[0];
        let b1 = if chunk.len() > 1 { chunk[1] } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] } else { 0 };

        let i0 = (b0 >> 2) as usize;
        let i1 = (((b0 & 0x03) << 4) | (b1 >> 4)) as usize;
        let i2 = (((b1 & 0x0F) << 2) | (b2 >> 6)) as usize;
        let i3 = (b2 & 0x3F) as usize;

        out.push(BASE64_TABLE[i0] as char);
        out.push(BASE64_TABLE[i1] as char);
        out.push(if chunk.len() > 1 {
            BASE64_TABLE[i2] as char
        } else {
            '='
        });
        out.push(if chunk.len() > 2 {
            BASE64_TABLE[i3] as char
        } else {
            '='
        });
    }
    out
}

pub async fn maybe_transcode_opus(
    bytes: Vec<u8>,
    orig_ext: &str,
    orig_mime: &str,
    enabled: bool,
) -> (Vec<u8>, &'static str, &'static str) {
    let fallback_ext = match orig_ext {
        "webm" => "webm",
        "m4a" => "m4a",
        "ogg" => "ogg",
        "mp3" => "mp3",
        "wav" => "wav",
        "flac" => "flac",
        _ => "webm",
    };
    let fallback_mime = match orig_mime {
        "audio/webm" => "audio/webm",
        "audio/mp4" => "audio/mp4",
        "audio/ogg" => "audio/ogg",
        "audio/mpeg" => "audio/mpeg",
        "audio/wav" => "audio/wav",
        "audio/flac" => "audio/flac",
        _ => "audio/webm",
    };

    if !enabled {
        return (bytes, fallback_ext, fallback_mime);
    }

    let unique = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let tmp_dir = env::temp_dir();
    let in_path = tmp_dir.join(format!("capi_in_{unique}.{fallback_ext}"));
    let out_path = tmp_dir.join(format!("capi_out_{unique}.webm"));

    if fs::write(&in_path, &bytes).is_err() {
        return (bytes, fallback_ext, fallback_mime);
    }

    let status = Command::new("ffmpeg")
        .args([
            "-v",
            "error",
            "-y",
            "-i",
        ])
        .arg(&in_path)
        .args([
            "-vn",
            "-ac",
            "1",
            "-c:a",
            "libopus",
            "-b:a",
            "24k",
            "-vbr",
            "on",
            "-application",
            "voip",
            "-f",
            "webm",
        ])
        .arg(&out_path)
        .status()
        .await;

    let transcoded = match status {
        Ok(s) if s.success() => fs::read(&out_path).ok(),
        _ => None,
    };

    let _ = fs::remove_file(&in_path);
    let _ = fs::remove_file(&out_path);

    match transcoded {
        Some(new_bytes) if !new_bytes.is_empty() && new_bytes.len() < bytes.len() => {
            (new_bytes, "webm", "audio/webm")
        }
        _ => (bytes, fallback_ext, fallback_mime),
    }
}

pub async fn forward_to_apps_script(
    client: &reqwest::Client,
    webhook_url: &str,
    record: &ContributionRecord,
    bytes: &[u8],
    max_attempts: u32,
    base_delay_ms: u64,
) -> (Result<(), String>, u32) {
    let payload = AppsScriptPayload {
        kind: &record.kind,
        vietnamese: &record.vietnamese,
        xodang: &record.xodang,
        reading_content: &record.reading_content,
        audio_data: encode_base64(bytes),
        mime_type: &record.mime_type,
        filename: &record.filename,
    };
    let body = match serde_json::to_string(&payload) {
        Ok(s) => s,
        Err(err) => return (Err(format!("Failed to serialize webhook payload: {err}")), 0),
    };

    let total_attempts = max_attempts.max(1);
    let mut last_err = String::from("Unknown forwarding error");

    for attempt in 1..=total_attempts {
        let resp = client
            .post(webhook_url)
            .header("Content-Type", "text/plain;charset=utf-8")
            .body(body.clone())
            .send()
            .await;

        match resp {
            Ok(res) => {
                let status = res.status();
                if status.is_success() {
                    let text = res.text().await.unwrap_or_default();
                    if let Ok(val) = serde_json::from_str::<serde_json::Value>(&text) {
                        let is_err = val.get("success").and_then(|v| v.as_bool()) == Some(false)
                            || val.get("result").and_then(|v| v.as_str()) == Some("error");
                        if is_err {
                            last_err = format!("Apps Script returned error payload: {text}");
                        } else {
                            return (Ok(()), attempt);
                        }
                    } else {
                        return (Ok(()), attempt);
                    }
                } else {
                    last_err = format!("Upstream HTTP {status}");
                    if status.is_client_error() && status.as_u16() != 429 {
                        return (Err(last_err), attempt);
                    }
                }
            }
            Err(err) => {
                last_err = format!("Upstream network error: {err}");
            }
        }

        if attempt < total_attempts && base_delay_ms > 0 {
            let wait = base_delay_ms.saturating_mul(1u64 << (attempt - 1));
            tokio::time::sleep(Duration::from_millis(wait)).await;
        }
    }

    (Err(last_err), total_attempts)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encodes_rfc4648_base64_vectors() {
        assert_eq!(encode_base64(b""), "");
        assert_eq!(encode_base64(b"f"), "Zg==");
        assert_eq!(encode_base64(b"fo"), "Zm8=");
        assert_eq!(encode_base64(b"foo"), "Zm9v");
        assert_eq!(encode_base64(b"foob"), "Zm9vYg==");
        assert_eq!(encode_base64(b"fooba"), "Zm9vYmE=");
        assert_eq!(encode_base64(b"foobar"), "Zm9vYmFy");
    }
}
