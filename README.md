# Từ Điển Xơ Đăng – Tiếng Việt

[English](README.en.md) | Tiếng Việt

[![Build Status](https://img.shields.io/badge/build-passing-22c55e?style=flat-square)](https://github.com/Umnuar/xodang)
[![Tests](https://img.shields.io/badge/tests-95%2F95%20passed-34d399?style=flat-square)](https://github.com/Umnuar/xodang)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178c6?style=flat-square)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-offline--first-f59e0b?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![WCAG 2.2](https://img.shields.io/badge/WCAG%202.2-AA%20%2F%20AAA-4ade80?style=flat-square)](docs/design/dark-mode-tokens.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)](LICENSE)

Website tra cứu và học tiếng Xơ Đăng (ngữ tộc Môn-Khmer, vùng Bắc Tây Nguyên). Ứng dụng chạy trực tiếp trên trình duyệt dưới dạng Progressive Web App (PWA) và hỗ trợ đóng gói ứng dụng máy tính qua Electron.

Trực tiếp: [https://umnuar.github.io/xodang/#home](https://umnuar.github.io/xodang/#home)

---

## Tính năng chính

* **Tra cứu hai chiều**: Tìm kiếm Xơ Đăng ↔ Tiếng Việt; hỗ trợ tìm kiếm mờ, chuẩn hóa ký tự Unicode NFC và bàn phím ảo nhập ký tự ngữ âm (`ơ̆`, `ŏ`, `ê̆`, `ô̆`, `ă`, `ĭ`, `ŭ`).
* **Hỗ trợ giọng nói & phát âm**: Nghe âm thanh mẫu định dạng WebM và tìm kiếm bằng giọng nói qua Web Speech API.
* **Ôn tập & kiểm tra**: Flashcard 3D lật hai mặt, bài thi trắc nghiệm theo chủ đề, lưu tiến độ học tập vào `localStorage`.
* **Trò chơi ngôn ngữ**: 4 trò chơi thực hành (lật thẻ, hứng từ, bắn mục tiêu, nông trại từ vựng) kèm bảng xếp hạng và tạo chứng nhận hoàn thành bằng Canvas.
* **Đóng góp dữ liệu**: Ghi âm phát âm trực tiếp từ trình duyệt kèm biểu đồ sóng âm thời gian thực (Web Audio API).
* **Hoạt động ngoại tuyến (Offline-First)**: Caching toàn bộ tài nguyên qua Service Worker; tự động chuyển sang dữ liệu tĩnh nội bộ (`snapshot-fallback.ts`) khi không có kết nối mạng.
* **Giao diện tối (Dark Mode)**: Hệ thống màu Graphite và Rừng đêm, tuân thủ tiêu chuẩn tương phản WCAG 2.2 AA / AAA.
* **Không phụ thuộc runtime bên ngoài**: Viết bằng TypeScript thuần và DOM API; không sử dụng runtime framework giúp giảm thiểu kích thước gói và bề mặt tấn công.

---

## Kiến trúc hệ thống

```text
+-----------------------------------------------------------------+
|                       Tang hien thi (Client)                    |
|   Web PWA (Service Worker)   |   Desktop (Electron + IPC)       |
+-----------------------------------------------------------------+
                                |
+-------------------------------v---------------------------------+
|                    Module giao dien (Renderer)                  |
|   Tra cuu     Hoc tap & Thi     Tro choi     Dong gop am thanh  |
+-----------------------------------------------------------------+
                                |
+-------------------------------v---------------------------------+
|                    Tang logic & du lieu (Services)              |
|   DictionaryEngine   StorageService   Google Sheets API (Sync)  |
|   (Unicode NFC)      (Local v10)      (Dong bo truc tuyen)      |
+-----------------------------------------------------------------+
                                |
                                v (Khi mat mang hoac loi API)
+-----------------------------------------------------------------+
|             Du lieu snapshot ngoai tuyen (snapshot-fallback)    |
+-----------------------------------------------------------------+
```

---

## Cấu trúc thư mục

```text
tudien-main/
├── docs/
│   └── design/                 # Tai lieu thiet ke, tokens.json va bang mau
├── public/
│   ├── audio/                  # Tap am thanh phat am tieng Xo Dang (.webm)
│   ├── fonts/jakarta/          # Font Plus Jakarta Sans nhung cuc bo
│   └── icons/                  # Bieu tuong PWA cho cac man hinh
├── scripts/
│   └── generate-snapshot.ts    # Script ket xuat snapshot tu Google Sheets
├── src/
│   ├── main/                   # Tien trinh chinh Electron
│   ├── preload/                # Script bridge Electron an toan
│   ├── shared/                 # Hang so, kieu TypeScript, du lieu fallback
│   └── renderer/               # Ma nguon giao dien Web/Renderer
│       ├── components/         # Navbar, footer, modal, thong bao
│       ├── features/           # Home, quiz, games, chat, contribute
│       ├── services/           # Logic tra cuu, audio, speech, storage
│       ├── styles/             # CSS tokens, layout va cac feature
│       ├── router.ts           # Hash router dieu huong trang
│       └── main.ts             # Diem khoi chay ung dung
├── tests/                      # Bo test Vitest (95 test cases)
├── index.html                  # Khung HTML chinh
├── vite.config.ts              # Cau hinh Vite va PWA
└── package.json                # Cau hinh du an
```

---

## Cài đặt và phát triển

### Yêu cầu môi trường
* Node.js >= 18.0.0
* npm >= 9.0.0

### 1. Cài đặt mã nguồn
```bash
git clone https://github.com/Umnuar/xodang.git
cd xodang
npm install
```

### 2. Cấu hình biến môi trường (Tùy chọn)
Nếu muốn đồng bộ dữ liệu từ Google Sheets riêng, tạo tệp `.env`:
```bash
cp .env.example .env
```

Nội dung `.env`:
```ini
VITE_GOOGLE_API_KEY=your_google_sheets_api_key
VITE_SHEET_ID=your_google_sheet_id
```

Nếu không cấu hình khóa API, ứng dụng sẽ tự động sử dụng bộ từ điển tích hợp sẵn trong `src/shared/data/snapshot-fallback.ts`.

### 3. Khởi chạy máy chủ phát triển
```bash
npm run dev
```
Mở trình duyệt tại `http://localhost:5173`.

### 4. Đóng gói sản xuất
```bash
npm run build
```
Kết quả được xuất ra thư mục `dist/`.

---

## Kiểm thử tự động

Dự án sử dụng Vitest cùng môi trường happy-dom:

```bash
# Chay toan bo test suite
npm test

# Chay che do theo doi thay doi
npm run test:watch
```

Các nội dung kiểm thử chính:
* `tests/xss-security.test.ts`: Kiểm tra an toàn trước tấn công chèn mã XSS.
* `tests/unicode-nfc.test.ts`: Kiểm tra chuẩn hóa dấu thanh và ký tự Môn-Khmer.
* `tests/memory-leak.test.ts`: Kiểm tra giải phóng bộ nhớ, timer và event listener khi chuyển trang.
* `tests/legacy-storage.test.ts`: Kiểm tra tính toàn vẹn dữ liệu `localStorage` và xử lý chuỗi JSON lỗi.
* `tests/service-worker.test.ts`: Kiểm tra chiến lược bộ nhớ đệm ngoại tuyến.

---

## Ứng dụng máy tính (Electron)

Chạy ứng dụng dạng native desktop:
```bash
# Chay ung dung trong moi truong phat trien
npm run electron:dev

# Dong goi bo cai dat desktop
npm run electron:build
```

---

## Thiết kế & Tiêu chuẩn giao diện

* Bộ token thiết kế chi tiết: [docs/design/dark-mode-tokens.json](docs/design/dark-mode-tokens.json)
* Tài liệu độ tương phản WCAG 2.2: [docs/design/dark-mode-tokens.md](docs/design/dark-mode-tokens.md)
* Tệp stylesheet biến màu: [docs/design/dark-mode-themes.css](docs/design/dark-mode-themes.css)

---

## Bảo mật

Chính sách bảo mật, phạm vi phiên bản hỗ trợ và quy trình báo cáo lỗ hổng xem tại [SECURITY.md](SECURITY.md).

---

## Giấy phép

Phát hành theo giấy phép [MIT](LICENSE).
