pub mod forwarder;
pub mod storage;
pub mod validation;

use crate::forwarder::{forward_to_apps_script, maybe_transcode_opus};
use crate::storage::{now_millis, ContributionRecord, LocalStore};
use crate::validation::{
    detect_audio_format, sanitize_filename, validate_contribution_fields, DEFAULT_MAX_UPLOAD_BYTES,
};
use axum::extract::{DefaultBodyLimit, Multipart, State};
use axum::http::{header, HeaderMap, HeaderValue, Method, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Serialize;
use std::collections::{HashMap, VecDeque};
use std::env;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tower_http::cors::{AllowOrigin, Any, CorsLayer};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ForwardMode {
    Async,
    Sync,
}

#[derive(Debug, Clone)]
pub struct AppConfig {
    pub port: u16,
    pub allowed_origins: Vec<String>,
    pub data_dir: PathBuf,
    pub max_upload_bytes: usize,
    pub apps_script_webhook_url: Option<String>,
    pub forward_mode: ForwardMode,
    pub transcode_before_forward: bool,
    pub rate_limit_per_min: usize,
    pub forward_max_attempts: u32,
    pub forward_retry_base_ms: u64,
}

impl AppConfig {
    pub fn from_env() -> Self {
        let port = env::var("PORT")
            .ok()
            .and_then(|v| v.parse::<u16>().ok())
            .unwrap_or(8080);

        let allowed_origins = env::var("ALLOWED_ORIGINS")
            .unwrap_or_else(|_| String::from("*"))
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();

        let data_dir = env::var("DATA_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("./data"));

        let max_upload_bytes = env::var("MAX_UPLOAD_BYTES")
            .ok()
            .and_then(|v| v.parse::<usize>().ok())
            .filter(|&v| v > 0)
            .unwrap_or(DEFAULT_MAX_UPLOAD_BYTES);

        let apps_script_webhook_url = env::var("APPS_SCRIPT_WEBHOOK_URL")
            .ok()
            .map(|v| v.trim().to_string())
            .filter(|v| !v.is_empty());

        let forward_mode = match env::var("FORWARD_MODE").as_deref() {
            Ok("sync") | Ok("SYNC") => ForwardMode::Sync,
            _ => ForwardMode::Async,
        };

        let transcode_before_forward = matches!(
            env::var("TRANSCODE_BEFORE_FORWARD").as_deref(),
            Ok("true") | Ok("1") | Ok("TRUE")
        );

        let rate_limit_per_min = env::var("RATE_LIMIT_PER_MIN")
            .ok()
            .and_then(|v| v.parse::<usize>().ok())
            .unwrap_or(60);

        let forward_max_attempts = env::var("FORWARD_MAX_ATTEMPTS")
            .ok()
            .and_then(|v| v.parse::<u32>().ok())
            .filter(|&v| v > 0)
            .unwrap_or(3);

        let forward_retry_base_ms = env::var("FORWARD_RETRY_BASE_MS")
            .ok()
            .and_then(|v| v.parse::<u64>().ok())
            .unwrap_or(500);

        Self {
            port,
            allowed_origins,
            data_dir,
            max_upload_bytes,
            apps_script_webhook_url,
            forward_mode,
            transcode_before_forward,
            rate_limit_per_min,
            forward_max_attempts,
            forward_retry_base_ms,
        }
    }
}

pub struct RateLimiter {
    limit_per_min: usize,
    buckets: Mutex<HashMap<String, VecDeque<Instant>>>,
}

impl RateLimiter {
    pub fn new(limit_per_min: usize) -> Self {
        Self {
            limit_per_min,
            buckets: Mutex::new(HashMap::new()),
        }
    }

    pub fn allow(&self, key: &str) -> bool {
        if self.limit_per_min == 0 {
            return true;
        }
        let now = Instant::now();
        let window = Duration::from_secs(60);
        let mut guard = match self.buckets.lock() {
            Ok(g) => g,
            Err(poisoned) => poisoned.into_inner(),
        };
        let entries = guard.entry(key.to_string()).or_default();
        while let Some(&front) = entries.front() {
            if now.duration_since(front) > window {
                entries.pop_front();
            } else {
                break;
            }
        }
        if entries.len() >= self.limit_per_min {
            return false;
        }
        entries.push_back(now);
        true
    }
}

pub struct AppState {
    pub config: AppConfig,
    pub store: LocalStore,
    pub http_client: reqwest::Client,
    pub limiter: RateLimiter,
    pub id_counter: AtomicU64,
}

impl AppState {
    pub fn new(config: AppConfig) -> Self {
        let http_client = reqwest::Client::builder()
            .timeout(Duration::from_secs(20))
            .build()
            .unwrap_or_else(|_| reqwest::Client::new());
        Self::with_http_client(config, http_client)
    }

    pub fn with_http_client(config: AppConfig, http_client: reqwest::Client) -> Self {
        let store = LocalStore::new(config.data_dir.clone());
        let limiter = RateLimiter::new(config.rate_limit_per_min);
        Self {
            config,
            store,
            http_client,
            limiter,
            id_counter: AtomicU64::new(1),
        }
    }

    fn next_id(&self) -> String {
        let seq = self.id_counter.fetch_add(1, Ordering::Relaxed);
        format!("{}_{}", now_millis(), seq)
    }
}

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    queued: usize,
}

#[derive(Serialize)]
struct ErrorResponse {
    success: bool,
    message: String,
}

#[derive(Serialize)]
struct ContributionResponse {
    success: bool,
    id: String,
    filename: String,
    size: usize,
    #[serde(rename = "syncStatus")]
    sync_status: String,
    message: String,
}

fn json_error(status: StatusCode, message: impl Into<String>) -> Response {
    (
        status,
        Json(ErrorResponse {
            success: false,
            message: message.into(),
        }),
    )
        .into_response()
}

fn extract_client_key(headers: &HeaderMap) -> String {
    if let Some(val) = headers
        .get("x-forwarded-for")
        .or_else(|| headers.get("x-real-ip"))
        .and_then(|h| h.to_str().ok())
    {
        if let Some(first) = val.split(',').next().map(str::trim).filter(|s| !s.is_empty()) {
            return first.to_string();
        }
    }
    String::from("local")
}

async fn health_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let queued = state.store.count_queued().await.unwrap_or(0);
    (
        StatusCode::OK,
        Json(HealthResponse {
            status: "ok",
            queued,
        }),
    )
}

async fn create_contribution_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    mut multipart: Multipart,
) -> Response {
    let client_key = extract_client_key(&headers);
    if !state.limiter.allow(&client_key) {
        return json_error(
            StatusCode::TOO_MANY_REQUESTS,
            "Quá nhiều yêu cầu từ địa chỉ này. Vui lòng thử lại sau ít phút.",
        );
    }

    let mut kind = String::from("vocab");
    let mut vietnamese = String::new();
    let mut xodang = String::new();
    let mut reading_content = String::new();
    let mut raw_filename = String::new();
    let mut audio_bytes: Option<Vec<u8>> = None;

    loop {
        let next_field = match multipart.next_field().await {
            Ok(opt) => opt,
            Err(err) => {
                let msg = err.to_string();
                let status = if msg.to_ascii_lowercase().contains("limit") {
                    StatusCode::PAYLOAD_TOO_LARGE
                } else {
                    StatusCode::BAD_REQUEST
                };
                return json_error(status, format!("Dữ liệu tải lên không hợp lệ: {msg}"));
            }
        };

        let Some(mut field) = next_field else {
            break;
        };

        let field_name = field.name().unwrap_or("").to_string();
        if field_name == "audio" {
            if raw_filename.is_empty() {
                if let Some(name) = field.file_name() {
                    raw_filename = name.to_string();
                }
            }
            let mut buf = Vec::new();
            loop {
                match field.chunk().await {
                    Ok(Some(chunk)) => {
                        if buf.len().saturating_add(chunk.len()) > state.config.max_upload_bytes {
                            return json_error(
                                StatusCode::PAYLOAD_TOO_LARGE,
                                format!(
                                    "File âm thanh vượt quá giới hạn {} bytes.",
                                    state.config.max_upload_bytes
                                ),
                            );
                        }
                        buf.extend_from_slice(&chunk);
                    }
                    Ok(None) => break,
                    Err(err) => {
                        let msg = err.to_string();
                        let status = if msg.to_ascii_lowercase().contains("limit") {
                            StatusCode::PAYLOAD_TOO_LARGE
                        } else {
                            StatusCode::BAD_REQUEST
                        };
                        return json_error(status, format!("Không thể đọc dữ liệu audio: {msg}"));
                    }
                }
            }
            audio_bytes = Some(buf);
        } else {
            let text = match field.text().await {
                Ok(t) => t,
                Err(err) => {
                    return json_error(
                        StatusCode::BAD_REQUEST,
                        format!("Không thể đọc trường {field_name}: {err}"),
                    );
                }
            };
            match field_name.as_str() {
                "type" => kind = text,
                "vietnamese" => vietnamese = text,
                "xodang" => xodang = text,
                "readingContent" => reading_content = text,
                "filename" => raw_filename = text,
                _ => {}
            }
        }
    }

    if let Err(err) = validate_contribution_fields(&kind, &vietnamese, &xodang) {
        return json_error(StatusCode::BAD_REQUEST, err);
    }

    let Some(raw_bytes) = audio_bytes else {
        return json_error(StatusCode::BAD_REQUEST, "Thiếu file âm thanh trong yêu cầu.");
    };

    if raw_bytes.is_empty() {
        return json_error(StatusCode::BAD_REQUEST, "File âm thanh rỗng.");
    }

    let Some(detected) = detect_audio_format(&raw_bytes) else {
        return json_error(
            StatusCode::UNSUPPORTED_MEDIA_TYPE,
            "Định dạng file âm thanh không hợp lệ hoặc sai magic bytes.",
        );
    };

    let (final_bytes, final_ext, final_mime) = maybe_transcode_opus(
        raw_bytes,
        detected.extension,
        detected.mime_type,
        state.config.transcode_before_forward,
    )
    .await;

    let id = state.next_id();
    let fallback_name = if !vietnamese.trim().is_empty() {
        vietnamese.as_str()
    } else if !reading_content.trim().is_empty() {
        reading_content.as_str()
    } else {
        "audio"
    };
    let name_source = if raw_filename.trim().is_empty() {
        fallback_name
    } else {
        raw_filename.as_str()
    };
    let safe_stem = sanitize_filename(name_source);
    let final_filename = format!("{safe_stem}_{id}.{final_ext}");
    let stored_path = state
        .store
        .uploads_dir()
        .join(&final_filename)
        .to_string_lossy()
        .to_string();

    let ts = now_millis();
    let initial_status = if state.config.apps_script_webhook_url.is_some() {
        "queued"
    } else {
        "stored"
    };

    let record = ContributionRecord {
        id: id.clone(),
        kind: kind.trim().to_string(),
        vietnamese: vietnamese.trim().to_string(),
        xodang: xodang.trim().to_string(),
        reading_content: reading_content.trim().to_string(),
        filename: final_filename.clone(),
        mime_type: final_mime.to_string(),
        size: final_bytes.len(),
        stored_path,
        sync_status: initial_status.to_string(),
        attempts: 0,
        last_error: None,
        created_at_ms: ts,
        updated_at_ms: ts,
    };

    if let Err(err) = state.store.save_upload(&record, &final_bytes).await {
        return json_error(StatusCode::INTERNAL_SERVER_ERROR, err);
    }

    let Some(webhook_url) = state.config.apps_script_webhook_url.clone() else {
        return (
            StatusCode::OK,
            Json(ContributionResponse {
                success: true,
                id,
                filename: final_filename,
                size: final_bytes.len(),
                sync_status: String::from("stored"),
                message: String::from("Đã lưu đóng góp thành công."),
            }),
        )
            .into_response();
    };

    match state.config.forward_mode {
        ForwardMode::Sync => {
            let (res, attempts) = forward_to_apps_script(
                &state.http_client,
                &webhook_url,
                &record,
                &final_bytes,
                state.config.forward_max_attempts,
                state.config.forward_retry_base_ms,
            )
            .await;

            match res {
                Ok(()) => {
                    let _ = state.store.update_status(&id, "synced", attempts, None).await;
                    (
                        StatusCode::OK,
                        Json(ContributionResponse {
                            success: true,
                            id,
                            filename: final_filename,
                            size: final_bytes.len(),
                            sync_status: String::from("synced"),
                            message: String::from("Đã nhận và đồng bộ đóng góp lên Google Sheet."),
                        }),
                    )
                        .into_response()
                }
                Err(err) => {
                    let _ = state
                        .store
                        .update_status(&id, "failed", attempts, Some(err.clone()))
                        .await;
                    json_error(
                        StatusCode::BAD_GATEWAY,
                        format!("Đã lưu dự phòng nhưng lỗi đồng bộ Google Sheet: {err}"),
                    )
                }
            }
        }
        ForwardMode::Async => {
            let bg_state = Arc::clone(&state);
            let bg_record = record.clone();
            let bg_id = id.clone();
            tokio::spawn(async move {
                let (res, attempts) = forward_to_apps_script(
                    &bg_state.http_client,
                    &webhook_url,
                    &bg_record,
                    &final_bytes,
                    bg_state.config.forward_max_attempts,
                    bg_state.config.forward_retry_base_ms,
                )
                .await;
                match res {
                    Ok(()) => {
                        let _ = bg_state
                            .store
                            .update_status(&bg_id, "synced", attempts, None)
                            .await;
                    }
                    Err(err) => {
                        let _ = bg_state
                            .store
                            .update_status(&bg_id, "failed", attempts, Some(err))
                            .await;
                    }
                }
            });

            (
                StatusCode::ACCEPTED,
                Json(ContributionResponse {
                    success: true,
                    id,
                    filename: final_filename,
                    size: record.size,
                    sync_status: String::from("queued"),
                    message: String::from(
                        "Đã nhận đóng góp và đang đồng bộ sang Google Sheet.",
                    ),
                }),
            )
                .into_response()
        }
    }
}

fn build_cors_layer(allowed_origins: &[String]) -> CorsLayer {
    let allow_all = allowed_origins.is_empty() || allowed_origins.iter().any(|o| o == "*");
    let base = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([header::CONTENT_TYPE, header::ACCEPT]);

    if allow_all {
        base.allow_origin(Any)
    } else {
        let parsed: Vec<HeaderValue> = allowed_origins
            .iter()
            .filter_map(|origin| origin.parse::<HeaderValue>().ok())
            .collect();
        base.allow_origin(AllowOrigin::list(parsed))
    }
}

pub fn build_router(state: Arc<AppState>) -> Router {
    let body_limit = state.config.max_upload_bytes.saturating_add(512 * 1024);
    let cors = build_cors_layer(&state.config.allowed_origins);
    Router::new()
        .route("/health", get(health_handler))
        .route("/api/contributions", post(create_contribution_handler))
        .layer(DefaultBodyLimit::max(body_limit))
        .layer(cors)
        .with_state(state)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::AtomicUsize;
    use tokio::net::TcpListener;

    fn test_temp_dir(label: &str) -> PathBuf {
        let dir = env::temp_dir().join(format!("capi_test_{}_{}", label, now_millis()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn test_client() -> reqwest::Client {
        reqwest::Client::builder().no_proxy().build().unwrap()
    }

    async fn spawn_test_server(
        config: AppConfig,
    ) -> (String, Arc<AppState>, tokio::task::JoinHandle<()>) {
        let state = Arc::new(AppState::with_http_client(config, test_client()));
        let app = build_router(Arc::clone(&state));
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        let handle = tokio::spawn(async move {
            let _ = axum::serve(listener, app).await;
        });
        (format!("http://{addr}"), state, handle)
    }

    async fn spawn_mock_webhook(
        fail_until: usize,
        permanent_fail: bool,
    ) -> (
        String,
        Arc<Mutex<Vec<serde_json::Value>>>,
        tokio::task::JoinHandle<()>,
    ) {
        let received = Arc::new(Mutex::new(Vec::new()));
        let attempts = Arc::new(AtomicUsize::new(0));
        let recv_clone = Arc::clone(&received);
        let att_clone = Arc::clone(&attempts);

        let app = Router::new().route(
            "/exec",
            post(move |body: String| {
                let recv_inner = Arc::clone(&recv_clone);
                let att_inner = Arc::clone(&att_clone);
                async move {
                    let count = att_inner.fetch_add(1, Ordering::SeqCst) + 1;
                    if permanent_fail || count <= fail_until {
                        return (StatusCode::SERVICE_UNAVAILABLE, "temporary failure").into_response();
                    }
                    if let Ok(val) = serde_json::from_str::<serde_json::Value>(&body) {
                        recv_inner.lock().unwrap().push(val);
                    }
                    (StatusCode::OK, r#"{"result":"success"}"#).into_response()
                }
            }),
        );

        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        let handle = tokio::spawn(async move {
            let _ = axum::serve(listener, app).await;
        });
        (format!("http://{addr}/exec"), received, handle)
    }

    fn base_config(dir: PathBuf, webhook: Option<String>) -> AppConfig {
        AppConfig {
            port: 0,
            allowed_origins: vec![String::from("https://umnuar.github.io")],
            data_dir: dir,
            max_upload_bytes: 2048,
            apps_script_webhook_url: webhook,
            forward_mode: ForwardMode::Sync,
            transcode_before_forward: false,
            rate_limit_per_min: 60,
            forward_max_attempts: 3,
            forward_retry_base_ms: 10,
        }
    }

    #[tokio::test]
    async fn health_and_cors_preflight_work() {
        let dir = test_temp_dir("health_cors");
        let (base_url, _state, handle) = spawn_test_server(base_config(dir.clone(), None)).await;
        let client = test_client();

        let health = client.get(format!("{base_url}/health")).send().await.unwrap();
        assert_eq!(health.status(), 200);
        let body: serde_json::Value = health.json().await.unwrap();
        assert_eq!(body["status"], "ok");
        assert_eq!(body["queued"], 0);

        let preflight = client
            .request(Method::OPTIONS, format!("{base_url}/api/contributions"))
            .header("Origin", "https://umnuar.github.io")
            .header("Access-Control-Request-Method", "POST")
            .send()
            .await
            .unwrap();
        assert_eq!(preflight.status(), 200);
        assert_eq!(
            preflight
                .headers()
                .get("access-control-allow-origin")
                .and_then(|v| v.to_str().ok()),
            Some("https://umnuar.github.io")
        );

        handle.abort();
        let _ = std::fs::remove_dir_all(&dir);
    }

    fn build_multipart_body(
        fields: &[(&str, &str)],
        file_name: &str,
        mime: &str,
        audio: &[u8],
    ) -> (String, Vec<u8>) {
        let boundary = "----tudienTestBoundary7357";
        let mut body = Vec::new();
        for (k, v) in fields {
            body.extend_from_slice(
                format!(
                    "--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n"
                )
                .as_bytes(),
            );
        }
        body.extend_from_slice(
            format!(
                "--{boundary}\r\nContent-Disposition: form-data; name=\"audio\"; filename=\"{file_name}\"\r\nContent-Type: {mime}\r\n\r\n"
            )
            .as_bytes(),
        );
        body.extend_from_slice(audio);
        body.extend_from_slice(format!("\r\n--{boundary}--\r\n").as_bytes());
        (format!("multipart/form-data; boundary={boundary}"), body)
    }

    #[tokio::test]
    async fn uploads_valid_webm_stores_backup_and_forwards_with_retry() {
        let dir = test_temp_dir("valid_sync");
        let (webhook_url, received, wh_handle) = spawn_mock_webhook(1, false).await;
        let (base_url, state, srv_handle) =
            spawn_test_server(base_config(dir.clone(), Some(webhook_url))).await;

        let webm_bytes = vec![0x1A, 0x45, 0xDF, 0xA3, 0x9F, 0x42, 0x86, 0x81];
        let (ct, body) = build_multipart_body(
            &[
                ("type", "vocab"),
                ("vietnamese", "Nhà"),
                ("xodang", "Hnam"),
                ("filename", "../../Nhà"),
            ],
            "../../evil.webm",
            "audio/webm",
            &webm_bytes,
        );

        let client = test_client();
        let res = client
            .post(format!("{base_url}/api/contributions"))
            .header("Content-Type", ct)
            .body(body)
            .send()
            .await
            .unwrap();

        assert_eq!(res.status(), 200);
        let payload: serde_json::Value = res.json().await.unwrap();
        assert_eq!(payload["success"], true);
        assert_eq!(payload["syncStatus"], "synced");
        let stored_name = payload["filename"].as_str().unwrap();
        assert!(stored_name.starts_with("nha_"));
        assert!(!stored_name.contains(".."));
        assert!(state.store.uploads_dir().join(stored_name).exists());
        assert_eq!(state.store.count_queued().await.unwrap(), 0);

        let forwarded = received.lock().unwrap();
        assert_eq!(forwarded.len(), 1);
        assert_eq!(forwarded[0]["vietnamese"], "Nhà");
        assert_eq!(forwarded[0]["xodang"], "Hnam");
        assert_eq!(
            forwarded[0]["audioData"],
            crate::forwarder::encode_base64(&webm_bytes)
        );

        srv_handle.abort();
        wh_handle.abort();
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn rejects_spoofed_magic_bytes_oversized_and_missing_fields() {
        let dir = test_temp_dir("validation");
        let (base_url, _state, srv_handle) = spawn_test_server(base_config(dir.clone(), None)).await;
        let client = test_client();

        let (ct_spoof, body_spoof) = build_multipart_body(
            &[("type", "voice"), ("readingContent", "Bơ rơ ha")],
            "fake.webm",
            "audio/webm",
            b"<script>alert(1)</script>",
        );
        let spoof_res = client
            .post(format!("{base_url}/api/contributions"))
            .header("Content-Type", ct_spoof)
            .body(body_spoof)
            .send()
            .await
            .unwrap();
        assert_eq!(spoof_res.status(), 415);

        let huge_bytes = vec![0x1Au8; 3000];
        let (ct_huge, body_huge) = build_multipart_body(
            &[("type", "voice")],
            "huge.webm",
            "audio/webm",
            &huge_bytes,
        );
        let huge_res = client
            .post(format!("{base_url}/api/contributions"))
            .header("Content-Type", ct_huge)
            .body(body_huge)
            .send()
            .await
            .unwrap();
        assert_eq!(huge_res.status(), 413);

        let (ct_missing, body_missing) = build_multipart_body(
            &[("type", "vocab"), ("vietnamese", "Nhà"), ("xodang", "")],
            "ok.webm",
            "audio/webm",
            &[0x1A, 0x45, 0xDF, 0xA3, 0x01],
        );
        let missing_res = client
            .post(format!("{base_url}/api/contributions"))
            .header("Content-Type", ct_missing)
            .body(body_missing)
            .send()
            .await
            .unwrap();
        assert_eq!(missing_res.status(), 400);

        srv_handle.abort();
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn enforces_rate_limit_and_keeps_backup_when_webhook_fails() {
        let dir = test_temp_dir("rate_and_fail");
        let (webhook_url, _received, wh_handle) = spawn_mock_webhook(0, true).await;
        let mut cfg = base_config(dir.clone(), Some(webhook_url));
        cfg.rate_limit_per_min = 1;
        let (base_url, state, srv_handle) = spawn_test_server(cfg).await;
        let client = test_client();

        let (ct1, body1) = build_multipart_body(
            &[("type", "voice"), ("readingContent", "Đak")],
            "ok.webm",
            "audio/webm",
            &[0x1A, 0x45, 0xDF, 0xA3, 0x01],
        );
        let res1 = client
            .post(format!("{base_url}/api/contributions"))
            .header("Content-Type", ct1)
            .body(body1)
            .send()
            .await
            .unwrap();
        assert_eq!(res1.status(), 502);
        assert_eq!(state.store.count_queued().await.unwrap(), 1);

        let (ct2, body2) = build_multipart_body(
            &[("type", "voice")],
            "ok2.webm",
            "audio/webm",
            &[0x1A, 0x45, 0xDF, 0xA3, 0x01],
        );
        let res2 = client
            .post(format!("{base_url}/api/contributions"))
            .header("Content-Type", ct2)
            .body(body2)
            .send()
            .await
            .unwrap();
        assert_eq!(res2.status(), 429);

        srv_handle.abort();
        wh_handle.abort();
        let _ = std::fs::remove_dir_all(&dir);
    }
}
