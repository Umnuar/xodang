<div align="center">

# Từ Điển Xơ Đăng – Tiếng Việt
### *Hệ Thống Tra Cứu Song Ngữ & Nền Tảng Học Ngôn Ngữ Bản Địa Tây Nguyên (Web PWA)*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/vitest-116%20passed-22c55e?style=flat-square&logo=vitest)](tests/)
[![Rust Tooling](https://img.shields.io/badge/rust%20tests-15%20passed-f97316?style=flat-square&logo=rust)](tools/audio-optimizer/)
[![PWA Offline-First](https://img.shields.io/badge/PWA-Offline--First-f59e0b?style=flat-square&logo=pwa)](src/renderer/service-worker.ts)
[![Zero Runtime Deps](https://img.shields.io/badge/runtime%20deps-0-1e7e48?style=flat-square)](package.json)
[![WCAG 2.2](https://img.shields.io/badge/WCAG%202.2-AA%20%2F%20AAA-4ade80?style=flat-square)](docs/design/dark-mode-tokens.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)](LICENSE)

[English](README.en.md) • **Tiếng Việt** • **[Ứng dụng trực tuyến](https://umnuar.github.io/xodang/#home)** • **[Design Tokens](docs/design/dark-mode-tokens.md)** • **[Chính sách bảo mật](SECURITY.md)**

</div>

---

## Tổng quan

**Từ Điển Xơ Đăng** (`tudien-xedang`) là nền tảng web **Progressive Web App (PWA)** phục vụ học tập, tra cứu ngữ âm và lưu trữ di sản ngôn ngữ Xơ Đăng (ngữ hệ Môn-Khmer, khu vực Bắc Tây Nguyên). Dự án được thiết kế cho người học tiếng bản địa, nhà nghiên cứu ngôn ngữ học và cộng đồng đóng góp ngữ liệu số.

### Đặc điểm kỹ thuật cốt lõi
- **Zero Frontend Runtime Dependencies:** 100% TypeScript thuần và Native Web APIs, không phụ thuộc framework runtime bên ngoài (`package.json` chỉ dùng devDependencies để kiểm thử và đóng gói).
- **Route Code-Splitting:** Trang chủ tải nhẹ (`83.94 kB` JS / `34.32 kB` CSS khởi động); các phân hệ `quiz`, `games`, `contribute` và `chat` chỉ nạp động khi người dùng truy cập hoặc trình duyệt rảnh.
- **Hybrid Audio Pack & Offline-First:**
  - `1,261` tệp phát âm bản địa đã được tối ưu bằng **Rust + FFmpeg Opus VoIP 24 kbps** (`40.38 MB` → `8.23 MiB`, TB `6.8 KB`/từ) và đóng gói vào `audio-pack.bin` + `audio-pack.index.json`.
  - Lần đầu tải **1 HTTP request duy nhất** (`8.23 MiB`) với thanh tiến trình theo byte, lưu vào `CacheStorage` `tudien-audio`. Các lần cập nhật về sau đối chiếu hash FNV-1a để chỉ tải phần chênh lệch (delta) khi thêm hoặc thu âm lại từ vựng.
  - Tự động đồng bộ nền khi trình duyệt rảnh, tôn trọng trạng thái mạng và chế độ tiết kiệm dữ liệu (`saveData` / `2g`).
- **Dữ liệu bền vững khi mất mạng:** Đồng bộ từ Google Sheets có dedup request song song, lưu cache cục bộ qua `localStorage` an toàn (chống crash Private Mode) và fallback về snapshot tích hợp sẵn khi build (`snapshot-fallback.ts`).
- **Chuẩn hóa ngữ âm Xơ Đăng & Tìm kiếm đa tầng:** Chỉ mục `WeakMap` theo Unicode NFC, ranh giới từ Unicode (`\p{L}\p{N}`) bảo toàn các tổ hợp dấu phụ (`ơ̆`, `ŏ`, `ê̆`), kèm tầng tìm kiếm không dấu khi khớp chính xác không ra kết quả.
- **Rust Tooling mở rộng:** Kèm CLI tối ưu/đóng gói audio không crate ngoài ([tools/audio-optimizer](tools/audio-optimizer/)) và tùy chọn HTTP Gateway Axum ([services/contribute-api](services/contribute-api/)) nhận upload binary `multipart/form-data` an toàn trước khi chuyển tiếp về Google Apps Script.

---

## Kiến trúc hệ thống

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    Web PWA Client (Vite + Pure TypeScript)              │
├──────────────────┬────────────────────┬─────────────────┬───────────────┤
│  Home & Search   │   Study & Quiz     │    Game Hub     │  Contribute   │
│ (Initial Chunk)  │  (Lazy Imported)   │ (Lazy Imported) │(Lazy Imported)│
└────────┬─────────┴──────────┬─────────┴────────┬────────┴───────┬───────┘
         │                    │                  │                │
         ▼                    ▼                  ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Domain & Resilience Layer                        │
├───────────────────┬──────────────────────┬──────────────────────────────┤
│ DictionaryService │ SheetsService        │ OfflineSyncService           │
│ WeakMap + NFC     │ Dedupe + LS +        │ audio-pack.bin (1 req) /     │
│ & Accent Fallback │ Build Snapshot       │ Hash Delta + Idle Auto-Sync  │
└─────────┬─────────┴──────────┬───────────┴──────────────┬───────────────┘
          │                    │                          │
          ▼                    ▼                          ▼
┌───────────────────┐  ┌───────────────────┐   ┌──────────────────────────┐
│  Service Worker   │  │ Google Sheets API │   │ Google Apps Script hoặc  │
│  Cache-First PWA  │  │ (Online Sync)     │   │ Rust Axum Gateway (A2)   │
└───────────────────┘  └───────────────────┘   └──────────────────────────┘
```

---

## Cấu trúc thư mục công khai

```text
.
├── .github/workflows/          # CI/CD kiểm thử & triển khai GitHub Pages
├── docs/design/                # Đặc tả hệ thống màu & design tokens (WCAG 2.2)
├── public/
│   ├── audio/                  # Kho âm thanh phát âm bản địa (1,261 .webm, 2 .mp3)
│   ├── fonts/jakarta/          # Font Plus Jakarta Sans nhúng nội bộ
│   ├── icons/                  # Bộ icon PWA (48x48 đến 512x512)
│   ├── audio-pack.bin          # Gói nhị phân hợp nhất cho tải offline 1 request
│   ├── audio-pack.index.json   # Bảng offset/length/hash cho đồng bộ delta
│   ├── manifest.json           # Cấu hình PWA manifest
│   └── offline.html            # Trang dự phòng khi mất kết nối hoàn toàn
├── scripts/
│   └── generate-snapshot.ts    # Script kết xuất Google Sheets thành snapshot build-time
├── services/contribute-api/    # Tùy chọn Rust Axum API nhận upload binary & forward Sheet
├── src/
│   ├── shared/                 # Hằng số config, storage keys và snapshot fallback
│   └── renderer/
│       ├── components/         # Navbar, onboarding, install modal, toast, event-bus
│       ├── features/           # home, quiz, games (4 minigame + chứng chỉ), contribute, chat
│       ├── services/           # dictionary, sheets, offline-sync, quiz, faq, speech, storage
│       ├── styles/             # CSS tokens, base, layout và style tách theo từng route
│       ├── router.ts           # Hash router điều hướng không tải lại trang
│       ├── service-worker.ts   # Service Worker quản lý cache & bảo toàn audio offline
│       └── main.ts             # Entry point nạp core & lazy-load route
├── tests/                      # 16 file kiểm thử tự động Vitest (116 test cases)
├── tools/audio-optimizer/      # Rust CLI tối ưu FFmpeg Opus & đóng gói audio-pack
├── index.html                  # HTML entry với SEO metadata & Schema.org
├── package.json                # Cấu hình scripts & devDependencies
├── tsconfig.json               # Cấu hình TypeScript chính (strict)
├── tsconfig.node.json          # Kiểm tra kiểu cho cấu hình Vite/Vitest
├── vite.config.ts              # Build Vite + chèn CSP meta tag + snapshot resolver
└── vitest.config.ts            # Môi trường kiểm thử happy-dom
```

---

## Cài đặt & Phát triển

### Yêu cầu môi trường
- **Web PWA:** Node.js `>= 18.0.0`, npm `>= 9.0.0`
- **Rust Tooling (tùy chọn khi tối ưu lại audio hoặc chạy backend gateway):** `rustc` / `cargo`, `ffmpeg` & `ffprobe`

### 1. Cài đặt & chạy Web PWA
```bash
git clone https://github.com/Umnuar/xodang.git
cd xodang
npm ci
```

Tạo tệp `.env` từ mẫu nếu kết nối Google Sheet hoặc API đóng góp riêng:
```bash
cp .env.example .env
```
```ini
VITE_GOOGLE_API_KEY=YOUR_GOOGLE_SHEETS_API_KEY_HERE
GOOGLE_SHEETS_API_KEY=YOUR_GOOGLE_SHEETS_API_KEY_HERE
VITE_SHEET_ID=YOUR_GOOGLE_SHEET_ID_HERE
VITE_CONTRIBUTE_API_URL=https://YOUR_CONTRIBUTE_API_DOMAIN/api/contributions
```
*(Nếu không đặt `VITE_CONTRIBUTE_API_URL`, ứng dụng mặc định gửi đóng góp trực tiếp qua Google Apps Script hiện có).*

```bash
# Máy chủ phát triển tại http://localhost:3000
npm run dev

# Biên dịch bản production ra dist/ (tự động chèn CSP meta tag)
npm run build
npm run preview
```

### 2. Công cụ Rust tối ưu & đóng gói âm thanh (`tools/audio-optimizer`)
```bash
# Nén âm thanh WebM sang Opus VoIP 24 kbps + loudnorm (tự bỏ qua nếu không nhỏ hơn)
cargo run --release --manifest-path tools/audio-optimizer/Cargo.toml -- --input public/audio --bitrate 24k

# Đóng gói toàn bộ file .webm thành audio-pack.bin + audio-pack.index.json
cargo run --release --manifest-path tools/audio-optimizer/Cargo.toml -- --input public/audio --pack --pack-out public
```

### 3. Rust Axum Contribute Gateway (`services/contribute-api`, tùy chọn)
```bash
cp services/contribute-api/.env.example services/contribute-api/.env
cargo run --release --manifest-path services/contribute-api/Cargo.toml
```
Hoặc chạy bằng Docker (`services/contribute-api/Dockerfile`). Chi tiết biến môi trường xem trong [services/contribute-api/.env.example](services/contribute-api/.env.example).

---

## Kiểm thử & Đảm bảo chất lượng

```bash
# Kiểm tra kiểu TypeScript (client + Vite config)
npx tsc --noEmit
npx tsc -p tsconfig.node.json --noEmit

# Chạy toàn bộ 116 Vitest test cases (16 files)
npm test

# Chạy 15 Rust unit & integration tests (7 CLI + 8 Axum API)
cargo test --manifest-path tools/audio-optimizer/Cargo.toml
cargo test --manifest-path services/contribute-api/Cargo.toml
```

### Phạm vi kiểm thử tự động then chốt
| Hạng mục | Tệp kiểm thử | Trọng tâm kiểm chứng |
| :--- | :--- | :--- |
| **Chống XSS** | [tests/xss-security.test.ts](tests/xss-security.test.ts) | Dữ liệu từ điển, chat, bảng xếp hạng, huy hiệu, chứng chỉ dùng DOM API (`textContent`), vô hiệu hóa `<script>`/`<img onerror>` |
| **Chuẩn hóa ngữ âm NFC** | [tests/unicode-nfc.test.ts](tests/unicode-nfc.test.ts) | Gom dấu tiếng Việt/Xơ Đăng, tìm kiếm chính xác và fallback không dấu (`golden-search.test.ts`) |
| **Audio Pack & Upload** | [tests/audio.test.ts](tests/audio.test.ts) | Đóng gói 1 request (`audio-pack.bin`), đồng bộ delta theo hash, lọc điều kiện auto-download, gửi `FormData` & fallback `no-cors` |
| **Rò rỉ bộ nhớ & Timer** | [tests/memory-leak.test.ts](tests/memory-leak.test.ts) | Hủy animation frame, timeout game, timer quiz và stream ghi âm khi chuyển tab |
| **Storage & Private Mode** | [tests/legacy-storage.test.ts](tests/legacy-storage.test.ts) | Di trú dữ liệu cũ, chống crash khi `SecurityError`/`QuotaExceededError` hoặc JSON lỗi |
| **Service Worker & Allowlist** | [tests/service-worker.test.ts](tests/service-worker.test.ts), [tests/smoke.test.ts](tests/smoke.test.ts) | Bảo toàn cache `tudien-audio`, bypass cache `audio-pack.*`, kiểm tra `ALLOWED_SHEET_RANGES` & không lộ secret fallback |

---

## Bảo mật & Đóng góp

- Xem chi tiết mô hình phòng vệ và quy trình báo cáo lỗ hổng tại [SECURITY.md](SECURITY.md).
- Mọi Pull Request cần bảo đảm:
  1. `npx tsc --noEmit && npx tsc -p tsconfig.node.json --noEmit` đạt 0 lỗi.
  2. `npm test` và `npm run build` vượt qua 100%.
  3. Không thêm runtime dependency mới cho frontend khi chưa có lý do kiến trúc rõ ràng.

---

## Giấy phép

Phân phối theo giấy phép [MIT](LICENSE).
