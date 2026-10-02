# BÁO CÁO ĐỐI CHIẾU: FILE06 — `manifest.json`

- **Tập tin gốc:** `C:\Users\umnuar\Downloads\tudien-goc\manifest.json`
- **Tập tin mới:** `c:\Users\umnuar\Downloads\tudien-main\public\manifest.json`

---

## BẢNG ĐỐI CHIẾU TỪNG MỤC THEO ID

| ID | Tên mục | Trạng thái | Vị trí file:dòng mới | Ghi chú & Trích đoạn đối chiếu |
| :--- | :--- | :---: | :--- | :--- |
| **S001_F06** | `name` | ✅ GIỮ NGUYÊN | `public/manifest.json:2` | `"Từ điển Xơ Đăng THCS"` |
| **S002_F06** | `short_name` | ✅ GIỮ NGUYÊN | `public/manifest.json:3` | `"Xơ Đăng"` |
| **S003_F06** | `description` | ✅ GIỮ NGUYÊN | `public/manifest.json:4` | Giữ nguyên mô tả đầy đủ |
| **S004_F06** | `start_url` | ✅ GIỮ NGUYÊN | `public/manifest.json:5` | `"./index.html"` |
| **S005_F06** | `display` | ✅ GIỮ NGUYÊN | `public/manifest.json:6` | `"standalone"` |
| **S006_F06** | `background_color` | ✅ GIỮ NGUYÊN | `public/manifest.json:7` | `"#ffffff"` |
| **S007_F06** | `theme_color` | ✅ GIỮ NGUYÊN | `public/manifest.json:8` | `"#27ae60"` |
| **S008_F06** | `orientation` | ✅ GIỮ NGUYÊN | `public/manifest.json:9` | `"portrait"` |
| **S009_F06** | `icons` (7 icons) | ⚠️ ĐỔI KHÁC | `public/manifest.json:10-48` | Gốc: `"./icon-48x48.png"` $\rightarrow$ Mới: `"./icons/icon-48x48.png"`. Thay đổi tích cực: gom các tệp icon vào thư mục con `public/icons/` ngăn ô nhiễm thư mục gốc. |
| **S010_F06** | `categories` | ✅ GIỮ NGUYÊN | `public/manifest.json:49` | `["education", "books", "lifestyle"]` |
| **S011_F06** | `shortcuts[0]` | ✅ GIỮ NGUYÊN | `public/manifest.json:51-55` | Tra từ điển (`./#home`) |
| **S012_F06** | `shortcuts[1]` | ✅ GIỮ NGUYÊN | `public/manifest.json:56-60` | Học và kiểm tra (`./#quiz`) |
| **S013_F06** | `prefer_related_applications` | ✅ GIỮ NGUYÊN | `public/manifest.json:62` | `false` |

---

## KẾT LUẬN FILE06
- Tỷ lệ: 12/13 mục ✅ GIỮ NGUYÊN, 1/13 mục ⚠️ ĐỔI KHÁC (đường dẫn con icon hợp lý, an toàn).
- Hoàn toàn tương thích và đáp ứng chuẩn PWA Installability của Google Chrome & Android.
