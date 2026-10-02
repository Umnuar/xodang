# KIỂM KÊ CHI TIẾT: FILE03 — `sitemap.xml`

- **Đường dẫn:** `C:\Users\umnuar\Downloads\tudien-goc\sitemap.xml`
- **Loại tập tin:** XML / SEO URLset Schema
- **Số dòng:** 15 dòng (513 bytes)
- **Nội dung thực tế:**
  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
          <loc>https://tudienxedang.github.io/tudien/</loc>
          <lastmod>2025-12-26</lastmod>
          <changefreq>daily</changefreq>
          <priority>1.0</priority>
      </url>
      <url>
          <loc>https://tudienxedang.github.io/tudien/game.html</loc>
          <lastmod>2025-12-26</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
      </url>
  </urlset>
  ```

---

## A. HÀM / CLASS / METHOD
*Không có.*

## B. EVENT & BINDING
*Không có.*

## C. PHẦN TỬ HTML TƯƠNG TÁC & SELECTORS
*Không có.*

## D. STATE & DỮ LIỆU
| ID | Tên URL Node | Kiểu | loc | lastmod | changefreq | priority | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S001_F03** | `URL_Home` | XML Element | `https://tudienxedang.github.io/tudien/` | 2025-12-26 | daily | 1.0 | Trang chủ từ điển |
| **S002_F03** | `URL_Game` | XML Element | `https://tudienxedang.github.io/tudien/game.html` | 2025-12-26 | weekly | 0.8 | Trang minigames |

## E. LUỒNG KHỞI TẠO & BẤT ĐỒNG BỘ
*Không có.*

## F. UI LOGIC
*Không có.*

## G. CSS
*Không có.*

## H. PHỤ THUỘC & THỨ TỰ NẠP
- Phụ thuộc: Đường dẫn trỏ tới trang gốc và `game.html`.

---

## BƯỚC 2: Tự kiểm đếm CLI
- Lệnh kiểm tra: `Get-Content C:\Users\umnuar\Downloads\tudien-goc\sitemap.xml | Measure-Object -Line`
- Kết quả thực tế: 15 dòng.
- Số nút URL kiểm kê: 2 nodes (S001_F03, S002_F03).
- Trạng thái khớp: 100%.
