# KIỂM KÊ CHI TIẾT: FILE07 — `Danh_gia_va_Toi_uu_Du_an.md`

- **Đường dẫn:** `C:\Users\umnuar\Downloads\tudien-goc\Danh_gia_va_Toi_uu_Du_an.md`
- **Loại tập tin:** Tài liệu kỹ thuật / Báo cáo đánh giá & tối ưu hóa dự án
- **Số dòng:** 139 dòng (8.346 bytes)

---

## A. HÀM / CLASS / METHOD
*Không có (Tài liệu Markdown).*

## B. EVENT & BINDING
*Không có.*

## C. PHẦN TỬ HTML TƯƠNG TÁC & SELECTORS
*Không có.*

## D. STATE, CẤU HÌNH & TRI THỨC KỸ THUẬT
| ID | Hạng mục / Khái niệm | Kiểu | Trích dẫn / Giá trị | Mô tả ý nghĩa kỹ thuật |
| :--- | :--- | :--- | :--- | :--- |
| **S001_F07** | Target Domain | URL | `https://hoctiengxodang.online/` | Tên miền chính thức của ứng dụng |
| **S002_F07** | Legacy Domain | URL | `https://tudienxedang.github.io/tudien/` | Tên miền phụ GitHub Pages cũ cần thay thế trong SEO meta |
| **S003_F07** | Lỗi 1: CDN Caching | Issue | `service-worker.js:115-122` | Bỏ qua cache CDN dẫn đến vỡ UI (Tailwind) và mất FontAwesome khi offline |
| **S004_F07** | Lỗi 2: Lệch tên cache Game | Issue | `index.html:7315` | `tudien-xodang-v3.2` vs `CACHE_NAME` (`tudien-${APP_VERSION}`) |
| **S005_F07** | Lỗi 3: Xung đột SEO URL | Issue | `index.html:114, 144, 160, 231-244` | Canonical và OpenGraph trỏ về github.io gây trùng lặp nội dung |
| **S006_F07** | Khuyến nghị bảo mật API Key | Security | `API_KEY: 'AIzaSyD757jS4SLR7-EzrPgrW9WrLQeD2DQExHw'` | Thiết lập HTTP Referrer và API Restriction trên Google Cloud Console |

## E. LUỒNG KHỞI TẠO & BẤT ĐỒNG BỘ
*Không có.*

## F. UI LOGIC
*Không có.*

## G. CSS
*Không có.*

## H. PHỤ THUỘC & THỨ TỰ NẠP
- Tham chiếu tới `service-worker.js` (dòng 115-122) và `index.html` (dòng 114, 144, 160, 7315).

---

## BƯỚC 2: Tự kiểm đếm CLI
- Lệnh kiểm tra: `Get-Content C:\Users\umnuar\Downloads\tudien-goc\Danh_gia_va_Toi_uu_Du_an.md | Measure-Object -Line`
- Kết quả thực tế: 139 dòng (kể cả khoảng trắng).
- Số mục tri thức kỹ thuật kiểm kê: 6 mục (S001_F07 đến S006_F07).
- Trạng thái khớp: 100%.
