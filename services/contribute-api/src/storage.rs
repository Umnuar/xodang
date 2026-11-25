use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ContributionRecord {
    pub id: String,
    #[serde(rename = "type")]
    pub kind: String,
    pub vietnamese: String,
    pub xodang: String,
    #[serde(rename = "readingContent")]
    pub reading_content: String,
    pub filename: String,
    #[serde(rename = "mimeType")]
    pub mime_type: String,
    pub size: usize,
    pub stored_path: String,
    pub sync_status: String,
    pub attempts: u32,
    pub last_error: Option<String>,
    pub created_at_ms: u128,
    pub updated_at_ms: u128,
}

pub struct LocalStore {
    base_dir: PathBuf,
    io_lock: Mutex<()>,
}

pub fn now_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}

impl LocalStore {
    pub fn new(base_dir: PathBuf) -> Self {
        Self {
            base_dir,
            io_lock: Mutex::new(()),
        }
    }

    pub fn uploads_dir(&self) -> PathBuf {
        self.base_dir.join("uploads")
    }

    pub fn journal_path(&self) -> PathBuf {
        self.base_dir.join("contributions.jsonl")
    }

    pub async fn save_upload(
        &self,
        record: &ContributionRecord,
        audio_bytes: &[u8],
    ) -> Result<(), String> {
        let _guard = self.io_lock.lock().await;
        let uploads = self.uploads_dir();
        fs::create_dir_all(&uploads)
            .map_err(|err| format!("Failed to create uploads dir: {err}"))?;

        let target_file = PathBuf::from(&record.stored_path);
        fs::write(&target_file, audio_bytes)
            .map_err(|err| format!("Failed to write upload backup: {err}"))?;

        let line = serde_json::to_string(record)
            .map_err(|err| format!("Failed to serialize metadata: {err}"))?;
        let mut file = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(self.journal_path())
            .map_err(|err| format!("Failed to open metadata journal: {err}"))?;
        writeln!(file, "{line}")
            .map_err(|err| format!("Failed to append metadata journal: {err}"))?;
        Ok(())
    }

    pub async fn update_status(
        &self,
        id: &str,
        sync_status: &str,
        attempts: u32,
        last_error: Option<String>,
    ) -> Result<(), String> {
        let _guard = self.io_lock.lock().await;
        let journal = self.journal_path();
        if !journal.exists() {
            return Ok(());
        }
        let raw = fs::read_to_string(&journal)
            .map_err(|err| format!("Failed to read metadata journal: {err}"))?;
        let mut out = String::with_capacity(raw.len());
        let ts = now_millis();

        for line in raw.lines() {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }
            if let Ok(mut rec) = serde_json::from_str::<ContributionRecord>(trimmed) {
                if rec.id == id {
                    rec.sync_status = sync_status.to_string();
                    rec.attempts = attempts;
                    rec.last_error = last_error.clone();
                    rec.updated_at_ms = ts;
                }
                if let Ok(serialized) = serde_json::to_string(&rec) {
                    out.push_str(&serialized);
                    out.push('\n');
                }
            }
        }

        let tmp = self.base_dir.join(".contributions.jsonl.tmp");
        fs::write(&tmp, out).map_err(|err| format!("Failed to write temp journal: {err}"))?;
        fs::rename(&tmp, &journal)
            .map_err(|err| format!("Failed to update metadata journal: {err}"))?;
        Ok(())
    }

    pub async fn count_queued(&self) -> Result<usize, String> {
        let _guard = self.io_lock.lock().await;
        let journal = self.journal_path();
        if !journal.exists() {
            return Ok(0);
        }
        let raw = fs::read_to_string(&journal)
            .map_err(|err| format!("Failed to read metadata journal: {err}"))?;
        let mut queued = 0;
        for line in raw.lines() {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }
            if let Ok(rec) = serde_json::from_str::<ContributionRecord>(trimmed) {
                if rec.sync_status == "queued" || rec.sync_status == "failed" {
                    queued += 1;
                }
            }
        }
        Ok(queued)
    }
}
