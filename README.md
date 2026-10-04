<div align="center">

# Từ Điển Xơ Đăng – Tiếng Việt
### *Hệ Thống Tra Cứu & Nền Tảng Học Ngôn Ngữ Bản Địa Tây Nguyên*

[![Build Status](https://img.shields.io/badge/build-passing-22c55e?style=flat-square&logo=vite)](https://github.com/Umnuar/xodang)
[![Tests](https://img.shields.io/badge/tests-95%2F95%20passed-34d399?style=flat-square&logo=vitest)](https://github.com/Umnuar/xodang)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline--First-f59e0b?style=flat-square&logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![WCAG 2.2](https://img.shields.io/badge/WCAG%202.2-AA%20%2F%20AAA-4ade80?style=flat-square)](docs/design/dark-mode-tokens.md)
[![Zero Runtime Deps](https://img.shields.io/badge/dependencies-0%20runtime-blueviolet?style=flat-square)](#-kiến-trúc-hệ-thống-architecture)
[![License: MIT](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)](LICENSE)

[English](README.en.md) • **Tiếng Việt** • **[Trải nghiệm trực tuyến](https://umnuar.github.io/xodang/#home)** • **[Đặc tả Thiết kế](docs/design/dark-mode-tokens.md)** • **[Bảo mật](SECURITY.md)**

</div>

---

## ◈ Tổng quan (Overview)

**Từ Điển Xơ Đăng** (`tudien-xedang`) là nền tảng học tập và lưu trữ di sản ngôn ngữ Xơ Đăng (ngữ hệ Môn-Khmer, vùng Bắc Tây Nguyên). Dự án được thiết kế cho các nhà nghiên cứu dân tộc học và người tự học ngôn ngữ bản địa.

Nền tảng được xây dựng dựa trên các tiêu chuẩn kỹ thuật hiện đại:
* **Zero Runtime Dependencies**: 100% Native Web APIs và TypeScript thuần, không phụ thuộc framework runtime bên ngoài, đảm bảo thời gian tải trang nhanh và kích thước gói tối ưu.
* **Offline-First**: Hoạt động ổn định trong điều kiện mạng chập chờn hoặc mất kết nối thông qua Service Worker và kho dữ liệu snapshot tĩnh nội bộ (`snapshot-fallback.ts`).
* **Chuẩn hóa ngữ âm chuyên sâu**: Xử lý triệt để hệ thống dấu thanh kép và âm thở tiếng Xơ Đăng bằng thuật toán chuẩn hóa Unicode NFC.
* **Hệ thống giao diện tối (Dark Mode)**: Bảng màu **Graphite** và **Rừng đêm** tuân thủ nghiêm ngặt tiêu chuẩn tương phản **WCAG 2.2 AA / AAA**.

---

## ⬡ Kiến trúc hệ thống (Architecture)

```text
┌─────────────────────────────────────────────────────────────────┐
│                     Client Application Layer                     │
├────────────────────────────────┬────────────────────────────────┤
│       Web Browser (PWA)        │    Desktop Client (Electron)    │
│    (Service Worker Cache)      │       (IPC Bridge Fetcher)     │
└────────────────────────────────┴────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│               Core Presentation & Modules (Vite + TS)            │
├───────────────┬────────────────┬───────────────┬────────────────┤
│  Dictionary   │  Study & Quiz  │   Game Hub    │  Contribute    │
│  Dual Search  │ 3D Flashcards  │  4 Minigames  │ WebAudio / Mic │
└───────────────┴────────────────┴───────────────┴────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    Service & Data Access Layer                   │
├──────────────────┬───────────────────────┬──────────────────────┤
│ DictionaryEngine │ StorageService (v10)  │ Google Sheets API    │
│  (Unicode NFC)   │ (Progress / Badges)   │ (Online Live Sync)   │
└──────────────────┴───────────────────────┴──────────────────────┘
                                │
                                ▼ [Fallback khi mất mạng hoặc lỗi API]
┌─────────────────────────────────────────────────────────────────┐
│             Offline Local Snapshot (`snapshot-fallback.ts`)     │
└─────────────────────────────────────────────────────────────────┘
```

---

## ◇ Tính năng cốt lõi (Core Features)

### 1. ⌕ Tra cứu hai chiều thông minh (Lexical Search Engine)
* Tra cứu hai chiều linh hoạt: **Xơ Đăng → Tiếng Việt** và **Tiếng Việt → Xơ Đăng**.
* Tích hợp bàn phím ảo một chạm các ký tự ngữ âm đặc thù: `ơ̆`, `ŏ`, `ê̆`, `ô̆`, `ă`, `ĭ`, `ŭ`.
* Hỗ trợ tìm kiếm bằng giọng nói qua Web Speech Recognition API.
* Bảng tóm tắt từ vựng ngắn gọn (One-line lexical summary) hiển thị số lượng từ và định nghĩa trực tiếp.

### 2. ⎘ Học tập & Ôn luyện (Study & Spaced Repetition)
* **Flashcard 3D lật 2 mặt**: Mặt trước tiếng Xơ Đăng kèm phiên âm, mặt sau hiển thị ngữ nghĩa tiếng Việt và ví dụ ngữ cảnh.
* **Hệ thống trắc nghiệm theo chủ đề**: Đếm ngược thời gian, chấm điểm tự động và phản hồi giải thích đáp án tức thì.
* Lưu trữ tiến độ học tập nội bộ qua `localStorage` với cơ chế phục hồi dữ liệu an toàn khi gặp chuỗi JSON hỏng.

### 3. ⊡ Đấu trường trò chơi ngôn ngữ (Gamification Hub)
* **4 Minigames tương tác**:
  1. *Lật thẻ ghi nhớ (Memory Match)*: Rèn luyện trí nhớ từ vựng và hình ảnh.
  2. *Hứng từ ngữ (Word Catcher)*: Thử thách phản xạ ghép nghĩa nhanh.
  3. *Bắn mục tiêu (Word Shooter)*: Nhận diện chính tả tiếng Xơ Đăng.
  4. *Nông trại từ vựng (Vocabulary Farm)*: Vun trồng cây tri thức bản địa.
* **Cấp giấy chứng nhận tự động**: Xuất chứng nhận hoàn thành bằng HTML5 Canvas trực tiếp trên trình duyệt.
* Bảng xếp hạng và hệ thống huy hiệu cá nhân hóa bảo mật quyền riêng tư phía client.

### 4. ⊚ Ngữ liệu âm thanh & Đóng góp cộng đồng (Crowdsourced Audio)
* Tích hợp kho âm thanh WebM phát âm chuẩn từ người bản địa.
* Bộ công cụ ghi âm trực tiếp với Visualizer sóng âm thời gian thực (`AudioContext` / `AnalyserNode`).
* Hỗ trợ tải xuống và xóa ngữ liệu đóng góp trong 1 bước thuận tiện.

### 5. ◐ Giao diện tối đo đạc toán học (WCAG 2.2 AA / AAA Dark Mode)
* Áp dụng nguyên tắc nâng sáng bề mặt (Surface Lightness Elevation: `Canvas < Card < Raised/Input`).
* Loại bỏ hoàn toàn nền đen thuần `#000000` và chữ trắng chói `#ffffff`.
* Bộ biến màu chuẩn hóa:
  * Nền than chì trung tính: `#0f1012`
  * Thẻ nội dung: `#17181b`
  * Chữ chính: `#e8e8ea` (Tương phản **14.51:1 AAA**)
  * Điểm nhấn xanh lá bản địa: `#34d399` (Tương phản nút bấm **9.90:1 AAA** với chữ nền tối)
* Xem chi tiết tại [docs/design/dark-mode-tokens.md](docs/design/dark-mode-tokens.md).

---

## ◫ Cấu trúc thư mục (Project Structure)

```text
tudien-main/
├── docs/
│   └── design/                 # Tài liệu thiết kế, tokens.json và ảnh render mẫu
├── public/
│   ├── audio/                  # Kho tệp âm thanh phát âm bản địa (.webm / .mp3)
│   ├── fonts/jakarta/          # Font Plus Jakarta Sans nhúng cục bộ (offline)
│   └── icons/                  # Bộ biểu tượng ứng dụng PWA (72x72 -> 512x512)
├── scripts/
│   └── generate-snapshot.ts    # Script kết xuất dữ liệu Google Sheets thành snapshot tĩnh
├── src/
│   ├── main/                   # Tiến trình chính Electron (Main Process & IPC Fetcher)
│   ├── preload/                # Script bảo mật Preload Electron
│   ├── shared/                 # Hằng số (storage-keys, config) & dữ liệu fallback
│   └── renderer/               # Tiến trình hiển thị Web / Renderer
│       ├── components/         # Các thành phần dùng chung (navbar, footer, modal, toast)
│       ├── features/           # Các phân hệ nghiệp vụ (home, quiz, games, chat, contribute)
│       ├── services/           # Lớp dịch vụ logic (dictionary, speech, audio, storage)
│       ├── styles/             # Hệ thống CSS phân tầng (tokens, base, layout, features)
│       ├── router.ts           # Hash router điều hướng trang không tải lại
│       └── main.ts             # Điểm khởi chạy ứng dụng (Bootstrap Entry)
├── tests/                      # Bộ kiểm thử tự động Vitest (95 tests)
├── index.html                  # Khung HTML gốc với SEO Meta & OpenGraph
├── vite.config.ts              # Cấu hình biên dịch Vite & PWA Plugin
└── package.json                # Cấu hình dự án (Zero runtime dependencies)
```

---

## ▷ Hướng dẫn cài đặt & Phát triển (Quick Start)

### Yêu cầu môi trường
* Node.js >= 18.0.0
* npm >= 9.0.0

### 1. Clone kho mã nguồn
```bash
git clone https://github.com/Umnuar/xodang.git
cd xodang
```

### 2. Cài đặt gói phụ trợ
```bash
npm install
```

### 3. Thiết lập biến môi trường (Tùy chọn)
Sao chép tệp mẫu nếu bạn muốn kết nối Google Sheets riêng:
```bash
cp .env.example .env
```
Nội dung tệp `.env`:
```ini
VITE_GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE
VITE_SHEET_ID=YOUR_SHEET_ID_HERE
```
*(Nếu không có API Key, hệ thống tự động sử dụng kho từ điển tích hợp sẵn trong `src/shared/data/snapshot-fallback.ts`).*

### 4. Khởi chạy máy chủ phát triển
```bash
npm run dev
```
Truy cập ứng dụng tại `http://localhost:5173`.

### 5. Biên dịch bản sản xuất
```bash
npm run build
```
Bản dựng tối ưu hóa mã nguồn sẽ được xuất ra thư mục `dist/`.

---

## ⊚ Kiểm thử tự động & Đảm bảo chất lượng (Quality Gates)

Dự án áp dụng bộ kiểm thử tự động với Vitest và môi trường giả lập happy-dom:

```bash
# Chạy toàn bộ 95 test cases
npm test

# Chạy kiểm thử ở chế độ theo dõi thời gian thực (Watch Mode)
npm run test:watch
```

### Các nhóm kiểm thử then chốt:
| Danh mục kiểm thử | Tệp kiểm thử | Mục tiêu bảo đảm |
| :--- | :--- | :--- |
| **Bảo mật XSS** | `tests/xss-security.test.ts` | Bảo đảm an toàn, không có lỗ hổng chèn mã qua URL hoặc từ ngữ tìm kiếm |
| **Chuẩn hóa Unicode NFC** | `tests/unicode-nfc.test.ts` | Xác minh khả năng chuẩn hóa dấu ngữ âm Xơ Đăng không bị phân mảnh chuỗi |
| **Rò rỉ bộ nhớ** | `tests/memory-leak.test.ts` | Giám sát việc dọn dẹp Event Listener và Timer khi chuyển trang |
| **Toàn vẹn dữ liệu lưu trữ**| `tests/legacy-storage.test.ts` | Kiểm thử cơ chế di trú schema và phục hồi an toàn khi gặp dữ liệu lỗi |
| **Độ tin cậy ngoại tuyến** | `tests/service-worker.test.ts` | Đảm bảo chiến lược bộ nhớ đệm Cache-First hoạt động chính xác |

---

## ⊞ Đóng gói ứng dụng Desktop (Electron)

Hỗ trợ đóng gói thành ứng dụng native desktop chạy độc lập cho Windows, macOS và Linux:

```bash
# Chạy ứng dụng Electron ở chế độ phát triển
npm run electron:dev

# Đóng gói bộ cài đặt Desktop phát hành (Installers)
npm run electron:build
```

---

## ⛊ Bảo mật & Đóng góp (Security & Contributing)

* Chi tiết về chính sách công bố lỗ hổng có trách nhiệm và thực hành an toàn mã nguồn, xem tại [SECURITY.md](SECURITY.md).
* Mọi đóng góp (Pull Request) cần đáp ứng:
  1. Vượt qua 100% kiểm thử: `npm test`.
  2. Vượt qua kiểm tra kiểu dữ liệu và đóng gói: `npm run build`.
  3. Không chèn thêm thư viện phụ thuộc runtime nếu không có lý do kiến trúc đặc biệt.

---

## ⎘ Giấy phép (License)

Dự án được phân phối dưới giấy phép [MIT](LICENSE).
