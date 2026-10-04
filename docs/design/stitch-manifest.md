# TỔNG QUAN HỆ THIẾT KẾ STITCH MCP (STITCH MANIFEST)
*Dự án: Ứng dụng số hóa hỗ trợ tự học, nghiên cứu và bảo tồn ngôn ngữ Xơ Đăng*

---

## 1. Thông Tin Stitch Project & Design System

- **Stitch Project ID**: `6056681178059878206` (`projects/6056681178059878206`)
- **Tên dự án**: `TuDienXeDang-Redesign`
- **Design System Asset**: `assets/10506316430121335770` / `assets/0fb672d1451f4c09b9a21d34333a9810`
- **Tên hệ thiết kế**: `XeDang Educational Design System`
- **Typography**:
  - Tiêu đề (Headline): `Plus Jakarta Sans` (Hỗ trợ dấu thanh tiếng Việt & phiên âm bản địa)
  - Thân bài (Body): `Be Vietnam Pro` / `Plus Jakarta Sans`
- **Shape & Roundness**: `ROUND_TWELVE` (12px / Full pill)
- **Bảng màu chủ đạo (Central Highlands Palette)**:
  - Màu chính (Primary): `#1e7e48` (Xanh đại ngàn Tây Nguyên - Canopy Emerald)
  - Màu phụ (Secondary): `#c05621` (Đất đỏ Bazan & Thổ cẩm - Warm Ochre)
  - Màu bổ trợ (Tertiary): `#2c5282` (Sông suối miền cao - River Slate)
  - Nền & Bề mặt (Surface): `#f8fafc` (Light) / `#0f172a` (Dark)
  - Độ tương phản: Đạt chuẩn WCAG 2.2 AA (Tối thiểu 4.5:1 cho text thường, 7:1 cho text chính)

---

## 2. Danh Sách Màn Hình Đã Tạo Bằng Stitch MCP

| STT | Tên màn hình | Screen ID (Stitch) | Thiết bị (Viewport) | Đường dẫn ảnh mẫu |
| :--- | :--- | :--- | :--- | :--- |
| **01** | **Trang Chủ & Tra Cứu Từ Điển (Desktop)** | `9fdfa2cdaf6c43399853c859af32ead2` | Desktop (1280px / 2560px) | `docs/design/after/home_1280_stitch.png` |
| **02** | **Trang Chủ & Bàn Phím Bản Địa (Mobile)** | `ecab1be8e11b4c29953066b2ad691eb5` | Mobile (360px / 780px) | `docs/design/after/home_360_stitch.png` |

---

## 3. Các Điểm Nâng Cấp UI/UX Nổi Bật Theo Báo Cáo Audit

1. **Khắc phục hoàn toàn lỗi Tap Target < 48px (P0-01)**:
   - Toàn bộ nút bấm, icon audio, thẻ từ và chip danh mục đều có diện tích tiếp xúc ngón tay tối thiểu `48x48px`.
2. **Thanh điều hướng công thái học cho di động (P0-03)**:
   - Trên màn hình nhỏ (360px), thanh menu dạng thanh trượt đáy (**Mobile Bottom Navigation Bar**) đặt 4 nút chức năng chính trong vùng ngón tay cái dễ chạm tới nhất (`Thumb Zone`).
3. **Thanh nhập ký tự đặc biệt Xơ Đăng (Special Diacritics Bar)**:
   - Bổ sung dải nút gõ nhanh các nguyên âm có dấu bản địa (`Ŏ`, `Ŭ`, `Ĕ`, `Ă`, `Â`, `Õ`, `Ě`, `Ĭ`) trực tiếp trên ô tìm kiếm, giúp học sinh tra cứu dễ dàng mà không cần cài bộ gõ đặc biệt.
4. **Thẻ từ vựng song ngữ đa chiều (Bilingual Word Card)**:
   - Tích hợp phát âm chuẩn kèm sóng âm thanh (Audio wave), phiên âm quốc tế IPA, các biến thể phương ngữ vùng miền (Đăk Tô, Đăk Hà, Tơ-đra) và hộp kiến thức văn hóa dân tộc.
5. **Giao diện hiện đại, bản sắc và tối ưu hiệu năng (P2-01 & P2-02)**:
   - Áp dụng triệt để bộ Design Tokens chuẩn (`docs/design/tokens.json`) và thông số component (`docs/design/components.md`), loại bỏ CSS hardcoded.
