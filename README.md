<div align="center">

# 🌿 Từ Điển Xơ Đăng – Tiếng Việt
### *Hệ Thống Tra Cứu & Nền Tảng Học Ngôn Ngữ Bản Địa Tây Nguyên Chuẩn Số Hóa*

[![Build Status](https://img.shields.io/badge/build-passing-22c55e?style=flat-square&logo=vite)](https://github.com/Umnuar/xodang)
[![Tests](https://img.shields.io/badge/tests-95%2F95%20passed-34d399?style=flat-square&logo=vitest)](https://github.com/Umnuar/xodang)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline--First-f59e0b?style=flat-square&logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![WCAG 2.2](https://img.shields.io/badge/WCAG%202.2-AA%20%2F%20AAA-4ade80?style=flat-square)](docs/design/dark-mode-tokens.md)
[![Zero Runtime Deps](https://img.shields.io/badge/dependencies-0%20runtime-blueviolet?style=flat-square)](#-kiến-trúc-kỹ-thuật-architecture)
[![License](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)](LICENSE)

**[Trải nghiệm trực tuyến](https://hoctiengxodang.online)** • **[Đặc tả Thiết kế](docs/design/dark-mode-tokens.md)** • **[Chính sách Bảo mật](SECURITY.md)**

</div>

---

## 📌 Tổng Quan (Overview)

**Từ Điển Xơ Đăng** (`tudien-xedang`) là nền tảng học tập và lưu trữ di sản ngôn ngữ Xơ Đăng (ngữ hệ Môn-Khmer, vùng Bắc Tây Nguyên). Dự án được thiết kế chuyên biệt phục vụ học sinh THCS (11–15 tuổi), các nhà nghiên cứu dân tộc học và cộng đồng người tự học ngôn ngữ bản địa.

Nền tảng được kiến trúc theo triết lý **Senior Software Engineering**:
* **Zero Runtime Dependencies**: Không phụ thuộc framework cồng kềnh (No React/Vue runtime overhead). 100% Native Web APIs + TypeScript thuần cho thời gian tải trang tức thì (< 500ms First Contentful Paint).
* **Offline-First Tuyệt Đối**: Hoạt động bền bỉ trong môi trường vùng sâu, vùng xa có kết nối Internet chập chờn thông qua Service Worker và bộ dữ liệu tĩnh ngoại tuyến (Snapshot Fallback).
* **Chuẩn Hóa Ngữ Âm Phức Tạp**: Xử lý triệt để hệ thống dấu thanh kép và âm thở của tiếng Xơ Đăng bằng thuật toán chuẩn hóa Unicode NFC.
* **Hệ Thống Giao Diện Tối (Dark Mode) Đo Đạt Toán Học**: Bảng màu **Graphite** & **Rừng đêm** tuân thủ nghiêm ngặt tiêu chuẩn tương phản **WCAG 2.2 AA / AAA**.

---

## 🏛️ Kiến Trúc Kỹ Thuật (Architecture)

```
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
                                ▼ [Fallback khi mất mạng]
┌─────────────────────────────────────────────────────────────────┐
│             Offline Local Snapshot (`snapshot-fallback.ts`)     │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Tính Năng Cốt Lõi (Core Features)

### 1. 🔍 Tra Cứu Hai Chiều Thông Minh (Lexical Search Engine)
* Tra cứu linh hoạt: **Xơ Đăng → Tiếng Việt** và **Tiếng Việt → Xơ Đăng**.
* Tích hợp bàn phím ảo một chạm các ký tự ngữ âm đặc trưng: `ơ̆`, `ŏ`, `ê̆`, `ô̆`, `ă`, `ĭ`, `ŭ`.
* Tự động phát hiện và tra cứu bằng giọng nói thông qua Web Speech Recognition API.
* Bảng tóm tắt từ vựng ngắn gọn (One-line lexical summary) hiển thị số lượng từ và định nghĩa trực tiếp.

### 2. 📚 Học Tập & Thi Trắc Nghiệm (Study & Spaced Repetition)
* **Flashcard 3D lật 2 mặt**: Mặt trước tiếng Xơ Đăng kèm phiên âm, mặt sau hiển thị ngữ nghĩa tiếng Việt và ví dụ ngữ cảnh.
* **Hệ thống trắc nghiệm theo chủ đề**: Đếm ngược thời gian, chấm điểm tự động và phản hồi giải thích đáp án tức thì.
* Lưu trữ tiến độ học tập nội bộ qua `localStorage` với cơ chế chống lỗi dữ liệu JSON (`corrupt-safe fallback`).

### 3. 🎮 Đấu Trường Trò Chơi Ngôn Ngữ (Gamification Hub)
* **4 Minigames tương tác**:
  1. *Lật thẻ ghi nhớ (Memory Match)*: Rèn luyện trí nhớ từ vựng và hình ảnh.
  2. *Hứng từ ngữ (Word Catcher)*: Thử thách phản xạ ghép nghĩa nhanh.
  3. *Bắn mục tiêu (Word Shooter)*: Nhận diện chính tả tiếng Xơ Đăng.
  4. *Nông trại từ vựng (Vocabulary Farm)*: Vun trồng cây tri thức bản địa.
* **Cấp Giấy Chứng Nhận Tự Động**: Xuất chứng nhận hoàn thành bằng HTML5 Canvas trực tiếp trên trình duyệt.
* Bảng xếp hạng và hệ thống huy hiệu cá nhân hóa bảo mật quyền riêng tư (Client-side privacy).

### 4. 🎙️ Ngữ Liệu Âm Thanh & Đóng Góp Cộng Đồng (Crowdsourced Audio)
* Tích hợp kho âm thanh WebM phát âm chuẩn từ người bản địa.
* Bộ công cụ ghi âm trực tiếp với Visualizer sóng âm thời gian thực (`AudioContext` / `AnalyserNode`).
* Hỗ trợ tải xuống và xóa ngữ liệu đóng góp trong 1 bước thuận tiện.

### 5. 🌓 Giao Diện Tối Chuẩn Mực (WCAG 2.2 AA / AAA Dark Mode)
* Áp dụng nguyên tắc nâng sáng bề mặt (Surface Lightness Elevation: `Canvas < Card < Raised/Input`).
* Loại bỏ hoàn toàn nền đen thuần `#000000` và chữ trắng chói `#ffffff`.
* Bộ biến màu chuẩn hóa:
  * Nền Than chì trung tính: `#0f1012`
  * Thẻ nội dung: `#17181b`
  * Chữ chính: `#e8e8ea` (Tương phản **14.51:1 AAA**)
  * Điểm nhấn xanh lá bản địa: `#34d399` (Tương phản nút bấm **9.90:1 AAA** với chữ nền tối)
* Xem chi tiết tại [docs/design/dark-mode-tokens.md](docs/design/dark-mode-tokens.md).

---

## 📂 Cấu Trúc Thư Mục (Project Structure)

```text
tudien-main/
├── docs/
│   └── design/                 # Tài liệu thiết kế, tokens.json và ảnh render mẫu
├── public/
│   ├── audio/                  # Kho tệp âm thanh phát âm bản địa (.webm / .mp3)
│   ├── fonts/jakarta/          # Font Plus Jakarta Sans nhúng trực tiếp (offline)
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
│       ├── router.ts           # Trình điều hướng Hash Router không tải lại trang
│       └── main.ts             # Điểm khởi chạy ứng dụng (Bootstrap Entry)
├── tests/                      # Bộ kiểm thử tự động Vitest (95 tests)
├── index.html                  # Khung HTML gốc với SEO Meta & OpenGraph
├── vite.config.ts              # Cấu hình biên dịch Vite & PWA Plugin
└── package.json                # Cấu hình dự án (Zero runtime dependencies)
```

---

## 🚀 Hướng Dẫn Cài Đặt & Phát Triển (Quick Start)

### Yêu Cầu Hệ Thống
* **Node.js**: Phiên bản `>= 18.0.0`
* **npm**: Phiên bản `>= 9.0.0`

### 1. Clone Kho Mã Nguồn
```bash
git clone https://github.com/Umnuar/xodang.git
cd xodang
```

### 2. Cài Đặt Gói Phụ Trợ (DevDependencies)
```bash
npm install
```

### 3. Thiết Lập Biến Môi Trường (Tùy Chọn)
Sao chép tệp mẫu và điền thông tin nếu bạn muốn kết nối Google Sheets riêng:
```bash
cp .env.example .env
```
Nội dung tệp `.env`:
```ini
# Google Sheets API Key phục vụ tra cứu trực tuyến và cập nhật snapshot
VITE_GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE
VITE_SHEET_ID=YOUR_SHEET_ID_HERE
```
*(Nếu không có API Key, hệ thống sẽ tự động chuyển sang kho từ điển nội bộ trong `src/shared/data/snapshot-fallback.ts` mà không làm gián đoạn ứng dụng).*

### 4. Khởi Chạy Máy Chủ Phát Triển (Local Dev Server)
```bash
npm run dev
```
Truy cập ứng dụng tại `http://localhost:5173`.

### 5. Biên Dịch Đóng Gói Bản Sản Xuất (Production Build)
```bash
npm run build
```
Bản dựng tối ưu hóa mã nguồn sẽ được xuất ra thư mục `dist/`.

---

## 🧪 Kiểm Thử Tự Động & Đảm Bảo Chất Lượng (Quality Gates)

Dự án áp dụng bộ kiểm thử hồi quy nghiêm ngặt với **Vitest** và môi trường giả lập **happy-dom**:

```bash
# Chạy toàn bộ 95 test cases
npm test

# Chạy kiểm thử ở chế độ theo dõi thời gian thực (Watch Mode)
npm run test:watch
```

### Các nhóm kiểm thử then chốt:
| Danh mục kiểm thử | Tệp kiểm thử | Mục tiêu bảo đảm |
| :--- | :--- | :--- |
| **Bảo mật XSS** | `tests/xss-security.test.ts` | Bảo đảm an toàn tuyệt đối, không có lỗ hổng chèn mã qua URL hoặc từ ngữ tìm kiếm |
| **Chuẩn hóa Unicode NFC** | `tests/unicode-nfc.test.ts` | Xác minh khả năng chuẩn hóa dấu ngữ âm Xơ Đăng không bị phân mảnh chuỗi |
| **Rò rỉ Bộ nhớ** | `tests/memory-leak.test.ts` | Giám sát việc dọn dẹp Event Listener và Timer khi chuyển trang |
| **Toàn vẹn Dữ liệu Lưu trữ**| `tests/legacy-storage.test.ts` | Kiểm thử cơ chế di trú schema và xử lý an toàn dữ liệu JSON hỏng |
| **Độ tin cậy Ngoại tuyến** | `tests/service-worker.test.ts` | Đảm bảo chiến lược bộ nhớ đệm Cache-First hoạt động chính xác |

---

## 🖥️ Đóng Gói Ứng Dụng Desktop (Electron)

Dự án hỗ trợ đóng gói thành ứng dụng native desktop chạy độc lập cho Windows, macOS và Linux:

```bash
# Chạy ứng dụng Electron ở chế độ phát triển
npm run electron:dev

# Đóng gói bộ cài đặt Desktop phát hành (Installers)
npm run electron:build
```

---

## 🛡️ Bảo Mật & Đóng Góp (Security & Contributing)

* Chi tiết về chính sách công bố lỗ hổng có trách nhiệm và thực hành an toàn mã nguồn, xem tại [SECURITY.md](SECURITY.md).
* Mọi đóng góp (Pull Request) đều phải:
  1. Vượt qua 100% kiểm thử: `npm test`.
  2. Vượt qua kiểm tra kiểu dữ liệu và đóng gói: `npm run build`.
  3. Không chèn thêm thư viện phụ thuộc runtime nếu không có lý do kiến trúc đặc biệt.

---

## 📄 Giấy Phép (License)

Dự án được phân phối dưới giấy phép **MIT License**. Mọi cá nhân và tổ chức đều có quyền sử dụng, sửa đổi và phân phối phục vụ mục đích giáo dục và cộng đồng.

---

<div align="center">
  <sub>Được phát triển với lòng trân trọng văn hóa bản địa Tây Nguyên Việt Nam.</sub>
</div>
