# BẢN KIỂM KÊ MÃ NGUỒN GỐC — DANH MỤC TẬP TIN (00_FILES)

- **Thư mục mã nguồn gốc:** `C:\Users\umnuar\Downloads\tudien-goc`
- **Thời điểm kiểm kê:** 2026-10-02
- **Trạng thái:** Hoàn tất quét đệ quy toàn bộ thư mục

---

## 1. Ghi chú các tập tin và thư mục đã bỏ qua

Theo quy chuẩn kiểm kê mã nguồn và logic:
1. **Thư mục hệ thống / version control:**
   - `.git/` (nếu có)
   - `node_modules/`, `dist/`, `build/` (không có trong thư mục gốc)
2. **Tập tin nhị phân / Media / Đa phương tiện:** Đã thống kê và bỏ qua nội dung chi tiết vì không chứa mã nguồn logic thực thi:
   - **Tập tin âm thanh `.webm`:** 1.261 files (dữ liệu phát âm tiếng Xơ Đăng trong thư mục `audio/`)
   - **Tập tin âm thanh `.mp3`:** 2 files (hiệu ứng âm thanh trò chơi `game_click.mp3`, `game_match.mp3`)
   - **Tập tin hình ảnh `.png`:** 15 files (icon PWA, badge huy hiệu trò chơi, ảnh minh họa nông trại/bắn cung)
   - **Tập tin hình ảnh `.jpg`:** 1 file (`Thumnail.jpg`)
   - **Tổng cộng tập tin nhị phân đã bỏ qua:** **1.279 files**

---

## 2. Danh mục 15 tập tin văn bản, cấu hình và mã nguồn cần kiểm kê chi tiết

| Mã File | Đường dẫn tương đối | Phân loại | Số dòng | Kích thước (bytes) | Mục đích / Vai trò |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **FILE01** | `CNAME` | Khác (DNS/Text) | 1 | 21 | Cấu hình Custom Domain GitHub Pages (`tudienxedang.online`) |
| **FILE02** | `robots.txt` | Cấu hình SEO | 3 | 85 | Khai báo luật thu thập dữ liệu web và vị trí sitemap |
| **FILE03** | `sitemap.xml` | XML / SEO | 15 | 513 | Sơ đồ liên kết website phục vụ chỉ mục tìm kiếm |
| **FILE04** | `google752b7efc6d08d97f.html` | HTML xác thực | 1 | 53 | Mã xác thực sở hữu website với Google Search Console |
| **FILE05** | `audio/README.md` | Tài liệu Markdown | 0 | 1 | Tập tin rỗng hướng dẫn/giữ chỗ cho thư mục audio |
| **FILE06** | `manifest.json` | JSON Cấu hình PWA | 64 | 1.512 | Manifest PWA: icon, tên ứng dụng, theme_color, display mode |
| **FILE07** | `Danh_gia_va_Toi_uu_Du_an.md` | Tài liệu Markdown | 110 | 8.346 | Tài liệu đánh giá hiện trạng và giải pháp kỹ thuật tối ưu hóa |
| **FILE08** | `Bao_cao_giai_phap_PWA.md` | Tài liệu Markdown | 268 | 11.804 | Báo cáo chi tiết kiến trúc PWA, offline cache, audit hiệu năng |
| **FILE09** | `.agents/skills/taste-skill/SKILL.md` | Tài liệu Kỹ năng AI | 271 | 34.903 | Định nghĩa kỹ năng thẩm mỹ giao diện người dùng |
| **FILE10** | `service-worker.js` | JavaScript | 411 | 13.145 | Service Worker: caching đa tầng, offline fallback, stale-while-revalidate |
| **FILE11** | `offline.html` | HTML / CSS / JS | 491 | 16.746 | Giao diện hiển thị khi mất mạng và chưa nạp được cache |
| **FILE12** | `intro.html` | HTML / CSS / JS | 1.438 | 55.332 | Màn hình giới thiệu, onboarding, câu chuyện dự án, hướng dẫn |
| **FILE13** | `game.html` | HTML / CSS / JS | 4.516 | 187.735 | Module 4 trò chơi luyện tập tiếng Xơ Đăng (Memory, Catcher, Shooter, Farm) |
| **FILE14** | `app/index.html` | HTML / CSS / JS | 7.078 | 283.273 | Bản ứng dụng biến thể phân phối (Subdirectory App) |
| **FILE15** | `index.html` | HTML / CSS / JS | 7.380 | 295.692 | Giao diện từ điển chính nguyên khối (Tra cứu, Đóng góp, Trắc nghiệm, Chatbot) |

**Tổng số dòng mã nguồn và văn bản:** **21.687 dòng** trên **15 tập tin**.

---

## 3. Quy trình thực hiện kiểm kê

- **Thứ tự xử lý:** FILE01 $\rightarrow$ FILE15, thực hiện tuần tự không nhảy cóc.
- **Tiêu chí kiểm kê:** Với mỗi file, phân tích đầy đủ 8 nhóm mục (A: Hàm/Class, B: Event/Binding, C: DOM/Selectors, D: State/Data, E: Init/Async, F: UI Logic, G: CSS, H: Dependencies).
- **Quy tắc phân đoạn:** Đối với các file lớn hơn 500 dòng (FILE10, FILE11, FILE12, FILE13, FILE14, FILE15), việc đọc và phân tích được thực hiện theo các đoạn tuần tự để đảm bảo 100% bao phủ, không bỏ sót bất kỳ dòng lệnh nào.
- **Tự kiểm đếm CLI:** Mỗi file sau khi lập bảng sẽ chạy kiểm đếm đối chiếu giữa số lượng mục trong tài liệu và kết quả grep thực tế.
