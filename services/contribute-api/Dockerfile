FROM rust:1-slim AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock* ./
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates ffmpeg && rm -rf /var/lib/apt/lists/*
RUN useradd -m -u 10001 appuser
WORKDIR /app
COPY --from=builder /app/target/release/contribute-api /usr/local/bin/contribute-api
RUN mkdir -p /app/data && chown -R appuser:appuser /app
USER appuser
ENV PORT=8080
ENV DATA_DIR=/app/data
EXPOSE 8080
CMD ["contribute-api"]
