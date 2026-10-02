# KIỂM KÊ CHI TIẾT: FILE06 — `manifest.json`

- **Đường dẫn:** `C:\Users\umnuar\Downloads\tudien-goc\manifest.json`
- **Loại tập tin:** Web App Manifest (JSON)
- **Số dòng:** 64 dòng (1.512 bytes)

---

## A. HÀM / CLASS / METHOD
*Không có (JSON tĩnh).*

## B. EVENT & BINDING
*Không có.*

## C. PHẦN TỬ HTML TƯƠNG TÁC & SELECTORS
*Không có.*

## D. STATE & DỮ LIỆU CẤU HÌNH PWA
| ID | Trường cấu hình | Kiểu | Giá trị thực tế | Mô tả vai trò |
| :--- | :--- | :--- | :--- | :--- |
| **S001_F06** | `name` | String | `Từ điển Xơ Đăng THCS` | Tên đầy đủ hiển thị khi cài đặt PWA |
| **S002_F06** | `short_name` | String | `Xơ Đăng` | Tên ngắn hiển thị dưới icon trên màn hình chính |
| **S003_F06** | `description` | String | `Hệ thống học tiếng Xơ Đăng trên nền tảng PWA cho học sinh THCS` | Mô tả ứng dụng |
| **S004_F06** | `start_url` | String | `./index.html` | Điểm khởi đầu khi mở app từ màn hình chính |
| **S005_F06** | `display` | String | `standalone` | Chế độ hiển thị độc lập không có thanh địa chỉ trình duyệt |
| **S006_F06** | `background_color` | Hex String | `#ffffff` | Màu nền splash screen khi nạp app |
| **S007_F06** | `theme_color` | Hex String | `#27ae60` | Màu thanh trạng thái hệ thống (Status Bar xanh lá) |
| **S008_F06** | `orientation` | String | `portrait` | Khóa hướng màn hình dọc trên thiết bị di động |
| **S009_F06** | `icons` | Array(7) | 48x48, 72x72, 96x96, 128x128, 144x144, 192x192 (maskable), 512x512 | Tập hợp icon các kích thước cho Android, iOS, Desktop |
| **S010_F06** | `categories` | Array(3) | `["education", "books", "lifestyle"]` | Phân loại cửa hàng ứng dụng |
| **S011_F06** | `shortcuts[0]` | Object | Name: `Tra từ điển`, url: `./#home` | Lối tắt màn hình chính: Mở nhanh tra cứu |
| **S012_F06** | `shortcuts[1]` | Object | Name: `Học và kiểm tra`, url: `./#quiz` | Lối tắt màn hình chính: Mở nhanh phần trắc nghiệm |
| **S013_F06** | `prefer_related_applications` | Boolean | `false` | Ưu tiên chạy PWA thay vì native store apps |

## E. LUỒNG KHỞI TẠO & BẤT ĐỒNG BỘ
- Trình duyệt nạp qua `<link rel="manifest" href="./manifest.json">` trong `index.html`.
- Kích hoạt sự kiện `beforeinstallprompt` trên trình duyệt di động / desktop Chromium.

## F. UI LOGIC
- PWA Install Banner / Install Modal.

## G. CSS
- Cung cấp `theme_color` tương thích với theme xanh lá `#27ae60`.

## H. PHỤ THUỘC & THỨ TỰ NẠP
- Phụ thuộc: Các file icon PNG (`icon-48x48.png` đến `icon-512x512.png`).
- Được liên kết trong `index.html`, `app/index.html`, `game.html`, `intro.html`.

---

## BƯỚC 2: Tự kiểm đếm CLI
- Lệnh kiểm tra: `Get-Content C:\Users\umnuar\Downloads\tudien-goc\manifest.json | Measure-Object -Line`
- Kết quả thực tế: 64 dòng.
- Số mục cấu hình kiểm kê: 13 mục (S001_F06 đến S013_F06).
- Trạng thái khớp: 100%.
