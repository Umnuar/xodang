use contribute_api::{build_router, AppConfig, AppState};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::TcpListener;

async fn shutdown_signal() {
    let _ = tokio::signal::ctrl_c().await;
}

#[tokio::main]
async fn main() {
    let config = AppConfig::from_env();
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    let state = Arc::new(AppState::new(config));
    let app = build_router(state);

    let listener = TcpListener::bind(addr)
        .await
        .expect("Failed to bind contribute-api TCP listener");
    println!("contribute-api listening on http://{addr}");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("contribute-api server error");
}
