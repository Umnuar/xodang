# BÁO CÁO ĐỐI CHIẾU: FILE11 — `offline.html`

- **Tập tin gốc:** `C:\Users\umnuar\Downloads\tudien-goc\offline.html` (493 dòng)
- **Tập tin mới:** `c:\Users\umnuar\Downloads\tudien-main\public\offline.html` (492 dòng)

---

## BẢNG ĐỐI CHIẾU TỪNG MỤC THEO ID

| ID | Tên mục | Trạng thái | Vị trí file:dòng mới | Ghi chú & Trích đoạn đối chiếu |
| :--- | :--- | :---: | :--- | :--- |
| **F001_F11** | `updateOnlineStatus` | ✅ GIỮ NGUYÊN | `public/offline.html:348` | Toàn bộ logic kiểm tra `navigator.onLine`, tạo spinner, redirect sau 3s được giữ nguyên 100% |
| **F002_F11** | `showNotification` | ✅ GIỮ NGUYÊN | `public/offline.html:382` | Toàn bộ logic tạo Toast alert nổi (`slideIn`/`slideOut`) giữ nguyên 100% |
| **E001_F11** | `window.ononline` | ✅ GIỮ NGUYÊN | `public/offline.html:375` | Lắng nghe mạng phục hồi |
| **E002_F11** | `window.onoffline` | ✅ GIỮ NGUYÊN | `public/offline.html:376` | Lắng nghe mất kết nối mạng |
| **E003_F11** | `document.DOMContentLoaded` | ✅ GIỮ NGUYÊN | `public/offline.html:450` | Kiểm tra sessionStorage và đăng ký beforeinstallprompt |
| **E004_F11** | `beforeinstallprompt` | ✅ GIỮ NGUYÊN | `public/offline.html:466` | Prompt cài đặt PWA |
| **E005_F11** | Button Thử lại (`reload`) | ✅ GIỮ NGUYÊN | `public/offline.html:318` | `onclick="window.location.reload()"` |
| **E006_F11** | Button Quay lại (`history.back`)| ✅ GIỮ NGUYÊN | `public/offline.html:322` | `onclick="window.history.back()"` |
| **E007_F11** | Button Về trang chủ (`href='./'`)| ✅ GIỮ NGUYÊN | `public/offline.html:326` | `onclick="window.location.href = './'"` |
| **E008_F11** | Dynamic install button click | ✅ GIỮ NGUYÊN | `public/offline.html:476` | Bấm nút cài đặt PWA |
| **B001_F11** | Thử lại kết nối | ✅ GIỮ NGUYÊN | `public/offline.html:318` | Giữ nguyên |
| **B002_F11** | Quay lại trang trước | ✅ GIỮ NGUYÊN | `public/offline.html:322` | Giữ nguyên |
| **B003_F11** | Về trang chủ offline | ✅ GIỮ NGUYÊN | `public/offline.html:326` | Giữ nguyên |
| **B004_F11** | Cài đặt ứng dụng | ✅ GIỮ NGUYÊN | `public/offline.html:476` | Giữ nguyên |
| **B005_F11** | Liên hệ hỗ trợ email | ✅ GIỮ NGUYÊN | `public/offline.html:337` | Giữ nguyên |
| **S001_F11** | `sessionStorage['offlinePageVisited']`| ✅ GIỮ NGUYÊN | `public/offline.html:452` | Giữ nguyên khóa lưu trạng thái lần đầu ghé thăm |
| **S002_F11** | `deferredPrompt` | ✅ GIỮ NGUYÊN | `public/offline.html:464` | Giữ nguyên biến lưu prompt PWA |
| **S003_F11** | Ping Test URL (`./?ping=...`) | ✅ GIỮ NGUYÊN | `public/offline.html:435` | Giữ nguyên chu kỳ ping kiểm tra mạng 30s |

---

## KẾT LUẬN FILE11
- Tỷ lệ toàn vẹn: 100% (18/18 mục ✅ GIỮ NGUYÊN).
- Điểm cải tiến duy nhất: Thêm thẻ bảo mật `<meta name="referrer" content="strict-origin-when-cross-origin">` ở đầu file.
