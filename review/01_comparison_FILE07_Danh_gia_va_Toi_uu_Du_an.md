# BÁO CÁO ĐỐI CHIẾU: FILE07 — `Danh_gia_va_Toi_uu_Du_an.md`

- **Tập tin gốc:** `C:\Users\umnuar\Downloads\tudien-goc\Danh_gia_va_Toi_uu_Du_an.md`
- **Tập tin mới:** `c:\Users\umnuar\Downloads\tudien-main\docs\archive\Danh_gia_va_Toi_uu_Du_an.md`

---

## BẢNG ĐỐI CHIẾU TỪNG MỤC THEO ID

| ID | Hạng mục / Khái niệm | Trạng thái | Vị trí file:dòng mới | Ghi chú & Trích đoạn đối chiếu |
| :--- | :--- | :---: | :--- | :--- |
| **S001_F07** | Target Domain | ✅ GIỮ NGUYÊN | `public/CNAME:1`, `docs/archive/Danh_gia_va_Toi_uu_Du_an.md:3` | `https://hoctiengxodang.online/` |
| **S002_F07** | Legacy Domain | ✅ GIỮ NGUYÊN | `docs/archive/Danh_gia_va_Toi_uu_Du_an.md:3` | Được lưu trữ và ghi nhận đầy đủ |
| **S003_F07** | Lỗi 1: CDN Caching | ✅ GIỮ NGUYÊN | `src/renderer/styles/`, `public/fonts/` | Đã giải quyết triệt để: Bundling cục bộ Tailwind CSS và lưu trữ webfonts tĩnh trong `public/fonts/` thay vì phụ thuộc CDN ngoài |
| **S004_F07** | Lỗi 2: Lệch cache Game | ✅ GIỮ NGUYÊN | `src/renderer/features/games/` | Đã giải quyết: Game được gom trực tiếp vào SPA, nạp chung cache với toàn app |
| **S005_F07** | Lỗi 3: Xung đột SEO URL | ⚠️ ĐỔI KHÁC | `index.html:11-25` | Thẻ Canonical và OpenGraph trong `tudien-main/index.html` đang dùng URL tương đối `./` hoặc chưa điền đầy đủ metadata OpenGraph |
| **S006_F07** | Bảo mật API Key | ⚠️ ĐỔI KHÁC | `src/shared/constants/config.ts:5` | API Key vẫn tồn tại trong code phía client để truy vấn Google Sheets công cộng |

---

## KẾT LUẬN FILE07
- File tài liệu được lưu trữ nguyên vẹn 100% trong `docs/archive/`.
- 2 vấn đề lớn (Lỗi 1 về CDN và Lỗi 2 về Cache Game) đã được giải quyết bằng kiến trúc mới.
