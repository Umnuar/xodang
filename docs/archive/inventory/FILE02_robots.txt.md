# KIỂM KÊ CHI TIẾT: FILE02 — `robots.txt`

- **Đường dẫn:** `C:\Users\umnuar\Downloads\tudien-goc\robots.txt`
- **Loại tập tin:** Cấu hình SEO / Web Crawler Directives
- **Số dòng:** 3 dòng (85 bytes)
- **Nội dung thực tế:**
  ```text
  User-agent: *
  Allow: /
  Sitemap: https://tudienxedang.github.io/tudien/sitemap.xml
  ```

---

## A. HÀM / CLASS / METHOD
*Không có (Tập tin chỉ thị crawler).*

## B. EVENT & BINDING
*Không có.*

## C. PHẦN TỬ HTML TƯƠNG TÁC & SELECTORS
*Không có.*

## D. STATE & DỮ LIỆU
| ID | Tên dữ liệu / Cấu hình | Kiểu | Nơi đọc | Nơi ghi | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S001_F02** | `User-agent` | String | Bot tìm kiếm (Googlebot, Bingbot...) | File tĩnh | Cho phép toàn bộ robot (`*`) thu thập dữ liệu |
| **S002_F02** | `Allow` | Path | Search Engine Crawlers | File tĩnh | Cho phép truy cập toàn bộ đường dẫn gốc `/` |
| **S003_F02** | `Sitemap` | URL | Search Engine Crawlers | File tĩnh | Trỏ tới sitemap chính: `https://tudienxedang.github.io/tudien/sitemap.xml` |

## E. LUỒNG KHỞI TẠO & BẤT ĐỒNG BỘ
*Không có.*

## F. UI LOGIC
*Không có.*

## G. CSS
*Không có.*

## H. PHỤ THUỘC & THỨ TỰ NẠP
- Phụ thuộc: Đường dẫn sitemap trỏ tới `FILE03` (`sitemap.xml`).

---

## BƯỚC 2: Tự kiểm đếm CLI
- Lệnh kiểm tra: `Get-Content C:\Users\umnuar\Downloads\tudien-goc\robots.txt | Measure-Object -Line`
- Kết quả thực tế: 3 dòng.
- Số mục cấu hình kiểm kê: 3 mục (S001_F02, S002_F02, S003_F02).
- Trạng thái khớp: 100%.
