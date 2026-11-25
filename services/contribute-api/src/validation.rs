pub const DEFAULT_MAX_UPLOAD_BYTES: usize = 10 * 1024 * 1024;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DetectedAudio {
    pub extension: &'static str,
    pub mime_type: &'static str,
}

pub fn detect_audio_format(bytes: &[u8]) -> Option<DetectedAudio> {
    if bytes.len() < 4 {
        return None;
    }
    if bytes.starts_with(&[0x1A, 0x45, 0xDF, 0xA3]) {
        return Some(DetectedAudio {
            extension: "webm",
            mime_type: "audio/webm",
        });
    }
    if bytes.starts_with(b"OggS") {
        return Some(DetectedAudio {
            extension: "ogg",
            mime_type: "audio/ogg",
        });
    }
    if bytes.starts_with(b"fLaC") {
        return Some(DetectedAudio {
            extension: "flac",
            mime_type: "audio/flac",
        });
    }
    if bytes.len() >= 12 && &bytes[0..4] == b"RIFF" && &bytes[8..12] == b"WAVE" {
        return Some(DetectedAudio {
            extension: "wav",
            mime_type: "audio/wav",
        });
    }
    if bytes.len() >= 8 && &bytes[4..8] == b"ftyp" {
        return Some(DetectedAudio {
            extension: "m4a",
            mime_type: "audio/mp4",
        });
    }
    if bytes.starts_with(b"ID3") || (bytes[0] == 0xFF && (bytes[1] & 0xE0) == 0xE0) {
        return Some(DetectedAudio {
            extension: "mp3",
            mime_type: "audio/mpeg",
        });
    }
    None
}

fn fold_vietnamese_char(c: char) -> char {
    match c {
        'à' | 'á' | 'ạ' | 'ả' | 'ã' | 'â' | 'ầ' | 'ấ' | 'ậ' | 'ẩ' | 'ẫ' | 'ă' | 'ằ' | 'ắ' | 'ặ'
        | 'ẳ' | 'ẵ' => 'a',
        'À' | 'Á' | 'Ạ' | 'Ả' | 'Ã' | 'Â' | 'Ầ' | 'Ấ' | 'Ậ' | 'Ẩ' | 'Ẫ' | 'Ă' | 'Ằ' | 'Ắ' | 'Ặ'
        | 'Ẳ' | 'Ẵ' => 'a',
        'è' | 'é' | 'ẹ' | 'ẻ' | 'ẽ' | 'ê' | 'ề' | 'ế' | 'ệ' | 'ể' | 'ễ' => 'e',
        'È' | 'É' | 'Ẹ' | 'Ẻ' | 'Ẽ' | 'Ê' | 'Ề' | 'Ế' | 'Ệ' | 'Ể' | 'Ễ' => 'e',
        'ì' | 'í' | 'ị' | 'ỉ' | 'ĩ' | 'Ì' | 'Í' | 'Ị' | 'Ỉ' | 'Ĩ' => 'i',
        'ò' | 'ó' | 'ọ' | 'ỏ' | 'õ' | 'ô' | 'ồ' | 'ố' | 'ộ' | 'ổ' | 'ỗ' | 'ơ' | 'ờ' | 'ớ' | 'ợ'
        | 'ở' | 'ỡ' => 'o',
        'Ò' | 'Ó' | 'Ọ' | 'Ỏ' | 'Õ' | 'Ô' | 'Ồ' | 'Ố' | 'Ộ' | 'Ổ' | 'Ỗ' | 'Ơ' | 'Ờ' | 'Ớ' | 'Ợ'
        | 'Ở' | 'Ỡ' => 'o',
        'ù' | 'ú' | 'ụ' | 'ủ' | 'ũ' | 'ư' | 'ừ' | 'ứ' | 'ự' | 'ử' | 'ữ' => 'u',
        'Ù' | 'Ú' | 'Ụ' | 'Ủ' | 'Ũ' | 'Ư' | 'Ừ' | 'Ứ' | 'Ự' | 'Ử' | 'Ữ' => 'u',
        'ỳ' | 'ý' | 'ỵ' | 'ỷ' | 'ỹ' | 'Ỳ' | 'Ý' | 'Ỵ' | 'Ỷ' | 'Ỹ' => 'y',
        'đ' | 'Đ' => 'd',
        _ if c.is_ascii_alphanumeric() => c.to_ascii_lowercase(),
        _ => '_',
    }
}

pub fn sanitize_filename(raw: &str) -> String {
    let base = raw.rsplit(['/', '\\']).next().unwrap_or("");
    let stem = match base.rfind('.') {
        Some(idx) if idx > 0 => &base[..idx],
        _ => base,
    };
    let mapped: String = stem.chars().map(fold_vietnamese_char).take(30).collect();
    let trimmed = mapped.trim_matches('_');
    if trimmed.is_empty() {
        String::from("audio")
    } else {
        trimmed.to_string()
    }
}

pub fn validate_contribution_fields(
    kind: &str,
    vietnamese: &str,
    xodang: &str,
) -> Result<(), &'static str> {
    match kind.trim() {
        "vocab" => {
            if vietnamese.trim().is_empty() || xodang.trim().is_empty() {
                Err("Missing vietnamese or xodang field for vocab contribution")
            } else {
                Ok(())
            }
        }
        "voice" => Ok(()),
        _ => Err("Invalid contribution type; expected 'vocab' or 'voice'"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_valid_audio_magic_bytes_and_rejects_spoofed_files() {
        assert_eq!(
            detect_audio_format(&[0x1A, 0x45, 0xDF, 0xA3, 0x9F]),
            Some(DetectedAudio {
                extension: "webm",
                mime_type: "audio/webm"
            })
        );
        assert_eq!(
            detect_audio_format(b"\x00\x00\x00\x18ftypM4A "),
            Some(DetectedAudio {
                extension: "m4a",
                mime_type: "audio/mp4"
            })
        );
        assert_eq!(
            detect_audio_format(b"OggS\x00\x02"),
            Some(DetectedAudio {
                extension: "ogg",
                mime_type: "audio/ogg"
            })
        );
        assert_eq!(
            detect_audio_format(b"ID3\x03\x00\x00"),
            Some(DetectedAudio {
                extension: "mp3",
                mime_type: "audio/mpeg"
            })
        );
        assert_eq!(
            detect_audio_format(b"RIFF\x24\x00\x00\x00WAVEfmt "),
            Some(DetectedAudio {
                extension: "wav",
                mime_type: "audio/wav"
            })
        );
        assert_eq!(
            detect_audio_format(b"fLaC\x00\x00\x00\x22"),
            Some(DetectedAudio {
                extension: "flac",
                mime_type: "audio/flac"
            })
        );
        assert!(detect_audio_format(b"<script>alert(1)</script>").is_none());
        assert!(detect_audio_format(b"MZ\x90\x00\x03\x00").is_none());
        assert!(detect_audio_format(b"abc").is_none());
    }

    #[test]
    fn sanitizes_traversal_and_vietnamese_filenames() {
        assert_eq!(sanitize_filename("../../etc/passwd"), "passwd");
        assert_eq!(sanitize_filename("..\\..\\evil.exe"), "evil");
        assert_eq!(sanitize_filename("Tiếng Xơ Đăng.webm"), "tieng_xo_dang");
        assert_eq!(sanitize_filename("Bơ rơ ha"), "bo_ro_ha");
        assert_eq!(sanitize_filename("...///"), "audio");
    }

    #[test]
    fn validates_vocab_and_voice_fields() {
        assert!(validate_contribution_fields("vocab", "Nhà", "Hnam").is_ok());
        assert!(validate_contribution_fields("vocab", " ", "Hnam").is_err());
        assert!(validate_contribution_fields("vocab", "Nhà", "").is_err());
        assert!(validate_contribution_fields("voice", "", "").is_ok());
        assert!(validate_contribution_fields("other", "a", "b").is_err());
    }
}
