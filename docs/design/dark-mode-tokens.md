# Bảng màu Dark Mode & Đặc tả Design Tokens - Từ điển Xơ Đăng

Tài liệu đặc tả hệ thống giao diện tối (Dark Mode) cho ứng dụng học tập và tra cứu từ điển Xơ Đăng – Tiếng Việt, phục vụ học sinh THCS (11–15 tuổi) và người tự học ngôn ngữ bản địa. Toàn bộ thiết kế bám sát nhận diện thương hiệu gốc (xanh lá `#27ae60`, kiểu chữ **Plus Jakarta Sans**), áp dụng nguyên tắc tăng độ sáng bề mặt (surface lightness elevation), không dùng nền đen tuyệt đối (#000000) và không dùng chữ trắng gắt (#ffffff).

---

## 1. Tổng quan 2 Phương án Bảng màu

| Tiêu chí | Phương án A: "Rừng đêm" (Forest Midnight) | Phương án B: "Graphite" (Than chì trung tính) |
| :--- | :--- | :--- |
| **Bản sắc thị giác** | Nền đen pha sắc xanh lá rất nhẹ (tinted dark green), hài hòa hữu cơ với đại ngàn Tây Nguyên và nhận diện thương hiệu. | Tông than chì thuần khiết, hoàn toàn trung tính, không ám sắc, phong cách công cụ số tinh gọn học thuật. |
| **Nền trang (`bg-canvas`)** | `#0b100e` | `#0f1012` |
| **Thẻ nội dung (`bg-card`)** | `#111815` | `#17181b` |
| **Phần nổi / Ô nhập (`bg-raised`)** | `#17201c` | `#1f2124` |
| **Đường viền mảnh (`border-hairline`)** | `rgba(255, 255, 255, 0.08)` | `rgba(255, 255, 255, 0.08)` |
| **Chữ chính (`text-primary`)** | `#e8efe9` (Xanh sáng dịu) | `#e8e8ea` (Trắng xám ngà) |
| **Chữ phụ (`text-secondary`)** | `#9db0a4` (Xám rêu nhạt) | `#a0a3a8` (Xám trung tính) |
| **Chữ mờ gốc (`text-muted`)** | `#6d8075` | `#6b6e75` |
| **Chữ mờ hiệu chỉnh AA (`text-muted-calibrated`)** | **`#75897e`** (đạt 4.84:1 trên card) | **`#7f838c`** (đạt 4.72:1 trên card) |
| **Nhấn thương hiệu (`accent`)** | `#34d399` (Emerald 400 - Xanh lá sáng dịu) | `#34d399` (Emerald 400) |
| **Chữ trên nút nhấn (`text-on-accent`)** | **`#0b100e`** (Đạt 9.98:1 AAA) | **`#0f1012`** (Đạt 9.90:1 AAA) |
| **Lỗi ngữ pháp / Trắc nghiệm (`error`)** | `#f87171` | `#f87171` |
| **Cảnh báo / Biến thể từ (`warning`)** | `#fbbf24` | `#fbbf24` |
| **Thông tin / Giải thích (`info`)** | `#60a5fa` | `#60a5fa` |

---

## 2. Kiểm tra Độ tương phản Toán học (WCAG 2.2 AA / AAA Audit)

Độ tương phản được tính toán dựa trên độ chói tương đối (Relative Luminance) chuẩn hóa của W3C WCAG 2.2:
- Chuẩn AA: Tối thiểu **4.5:1** cho văn bản thường (< 18pt), **3.0:1** cho văn bản lớn (≥ 18pt hoặc ≥ 14pt in đậm) và thành phần giao diện (UI controls/borders).
- Chuẩn AAA: Tối thiểu **7.0:1** cho văn bản thường, **4.5:1** cho văn bản lớn.

### Bảng tương phản Phương án A: "Rừng đêm"

| Cặp màu hiển thị | Mã màu nền | Mã màu chữ/icon | Tỷ lệ tương phản | Đánh giá WCAG 2.2 |
| :--- | :--- | :--- | :--- | :--- |
| **Chữ chính trên Nền trang** | `#0b100e` | `#e8efe9` | **16.40:1** | **Đạt AAA** |
| **Chữ chính trên Thẻ card** | `#111815` | `#e8efe9` | **15.41:1** | **Đạt AAA** |
| **Chữ chính trên Khung nổi/Input** | `#17201c` | `#e8efe9` | **14.25:1** | **Đạt AAA** |
| **Chữ phụ trên Thẻ card** | `#111815` | `#9db0a4` | **7.88:1** | **Đạt AAA** |
| **Chữ phụ trên Khung nổi/Input** | `#17201c` | `#9db0a4` | **7.29:1** | **Đạt AAA** |
| **Chữ mờ gốc (`#6d8075`) trên Card** | `#111815` | `#6d8075` | **4.29:1** | *Đạt UI 3:1 & Text lớn (Cần hiệu chỉnh cho text < 18pt)* |
| **Chữ mờ hiệu chỉnh (`#75897e`) trên Card** | `#111815` | `#75897e` | **4.84:1** | **Đạt AA Chuẩn** |
| **Màu nhấn (`#34d399`) trên Thẻ card** | `#111815` | `#34d399` | **9.37:1** | **Đạt AAA** |
| **Chữ đen trên Nút nhấn CTA xanh lá** | `#34d399` | `#0b100e` | **9.98:1** | **Đạt AAA** |
| *(Cảnh báo) Chữ trắng trên Nút nhấn xanh lá* | `#34d399` | `#ffffff` | *2.08:1* | **KHÔNG ĐẠT (Tránh dùng)** |
| **Màu báo lỗi (`#f87171`) trên Card** | `#111815` | `#f87171` | **6.51:1** | **Đạt AAA (Large) / AA** |
| **Màu cảnh báo (`#fbbf24`) trên Card** | `#111815` | `#fbbf24` | **10.80:1** | **Đạt AAA** |
| **Màu thông tin (`#60a5fa`) trên Card** | `#111815` | `#60a5fa` | **7.09:1** | **Đạt AAA** |

### Bảng tương phản Phương án B: "Graphite"

| Cặp màu hiển thị | Mã màu nền | Mã màu chữ/icon | Tỷ lệ tương phản | Đánh giá WCAG 2.2 |
| :--- | :--- | :--- | :--- | :--- |
| **Chữ chính trên Nền trang** | `#0f1012` | `#e8e8ea` | **15.56:1** | **Đạt AAA** |
| **Chữ chính trên Thẻ card** | `#17181b` | `#e8e8ea` | **14.51:1** | **Đạt AAA** |
| **Chữ chính trên Khung nổi/Input** | `#1f2124` | `#e8e8ea` | **13.19:1** | **Đạt AAA** |
| **Chữ phụ trên Thẻ card** | `#17181b` | `#a0a3a8` | **7.02:1** | **Đạt AAA** |
| **Chữ phụ trên Khung nổi/Input** | `#1f2124` | `#a0a3a8` | **6.38:1** | **Đạt AA** |
| **Chữ mờ gốc (`#6b6e75`) trên Card** | `#17181b` | `#6b6e75` | **3.48:1** | *Đạt UI 3:1 (Cần hiệu chỉnh cho body text)* |
| **Chữ mờ hiệu chỉnh (`#7f838c`) trên Card** | `#17181b` | `#7f838c` | **4.72:1** | **Đạt AA Chuẩn** |
| **Màu nhấn (`#34d399`) trên Thẻ card** | `#17181b` | `#34d399` | **9.23:1** | **Đạt AAA** |
| **Chữ đen trên Nút nhấn CTA xanh lá** | `#34d399` | `#0f1012` | **9.90:1** | **Đạt AAA** |
| **Màu báo lỗi (`#f87171`) trên Card** | `#17181b` | `#f87171` | **6.30:1** | **Đạt AAA (Large) / AA** |
| **Màu cảnh báo (`#fbbf24`) trên Card** | `#17181b` | `#fbbf24` | **10.45:1** | **Đạt AAA** |
| **Màu thông tin (`#60a5fa`) trên Card** | `#17181b` | `#60a5fa` | **6.86:1** | **Đạt AAA (Large) / AA** |

> [!IMPORTANT]
> **Quy tắc thiết kế nút bấm CTA xanh lá**: Khi dùng màu nhấn `#34d399` làm nền nút bấm (Primary CTA Button), tuyệt đối **phải sử dụng chữ màu nền tối (`#0b100e` hoặc `#0f1012`)**. Chữ màu trắng `#ffffff` chỉ đạt 2.08:1 sẽ gây mờ mắt và trượt kiểm định accessibility.

---

## 3. Thư viện Ảnh trực quan đã xuất vào `docs/design/`

Toàn bộ ảnh chụp giao diện hoàn chỉnh của 3 trang tiêu biểu (Trang chủ, Học & Thi, Trò chơi) trên cả 2 độ phân giải Desktop (1440px/2560px) và Mobile (390px) đã được xuất trực tiếp vào thư mục `docs/design/`:

| Tên tệp ảnh | Phương án | Màn hình áp dụng | Thiết bị | Mô tả thành phần |
| :--- | :--- | :--- | :--- | :--- |
| [dark-a-home-desktop.png](file:///c:/Users/umnuar/Downloads/tudien-main/docs/design/dark-a-home-desktop.png) | Phương án A (Rừng đêm) | **Trang chủ (Home)** | Desktop | Navbar phân tầng, ô tìm kiếm thông minh tích hợp nút micro, thẻ từ vựng nổi bật với nút nghe phát âm bản địa, cụm chủ đề văn hóa. |
| [dark-a-home-mobile.png](file:///c:/Users/umnuar/Downloads/tudien-main/docs/design/dark-a-home-mobile.png) | Phương án A (Rừng đêm) | **Trang chủ (Home)** | Mobile (390px) | Ô tìm kiếm tối ưu ngón cái, thẻ từ trong ngày, bottom navigation tiện dụng, thanh tra cứu nhanh ký tự đặc biệt. |
| [dark-a-study-desktop.png](file:///c:/Users/umnuar/Downloads/tudien-main/docs/design/dark-a-study-desktop.png) | Phương án A (Rừng đêm) | **Học & Thi (Study & Quiz)** | Desktop | Flashcard 3D lật mặt (mặt trước tiếng Xơ Đăng, mặt sau nghĩa tiếng Việt + âm thanh), trắc nghiệm 4 lựa chọn phản hồi trạng thái đúng/sai. |
| [dark-a-study-mobile.png](file:///c:/Users/umnuar/Downloads/tudien-main/docs/design/dark-a-study-mobile.png) | Phương án A (Rừng đêm) | **Học & Thi (Study & Quiz)** | Mobile (390px) | Flashcard học tập trực quan, tiến độ học tập dạng thanh bar xanh sáng, các nút chọn đáp án lớn chống bấm nhầm. |
| [dark-b-games-desktop.png](file:///c:/Users/umnuar/Downloads/tudien-main/docs/design/dark-b-games-desktop.png) | Phương án B (Graphite) | **Trò chơi (Game Hub)** | Desktop | Nền than chì phẳng, các thẻ trò chơi trí tuệ (Nối từ, Đoán tranh, Đua gõ tiếng Xơ Đăng), huy hiệu điểm số và bảng xếp hạng. |
| [dark-b-games-mobile.png](file:///c:/Users/umnuar/Downloads/tudien-main/docs/design/dark-b-games-mobile.png) | Phương án B (Graphite) | **Trò chơi (Game Hub)** | Mobile (390px) | Bố cục dạng thẻ dọc cuộn mượt, thẻ thử thách ngày, nút bắt đầu chơi viền xanh nổi bật. |

---

## 4. Đặc tả Quy chuẩn Kỹ thuật Font & Dấu thanh Xơ Đăng

- **Font chữ quy định**: `Plus Jakarta Sans`, các họ sans-serif dự phòng: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
- **Đặc thù ký tự ngữ âm Xơ Đăng**: Ngôn ngữ Xơ Đăng có hệ thống nguyên âm phức tạp với các dấu phụ đặc trưng (như `ơ̆`, `ŏ`, `ê̆`, dấu thanh ngã, huyền, hỏi đè lên nhau, dấu giọng thở).
- **Quy tắc Line-height**: Toàn bộ thẻ hiển thị chữ Xơ Đăng (`.xd-headword`, `.xd-phonetics`) bắt buộc giữ `line-height` tối thiểu **1.6** nhằm ngăn chặn hiện tượng cắt cụt dấu mũ trên (`ascender clipping`) hoặc dấu nặng dưới (`descender clipping`).
- **Phân tách nút Micro và Gợi ý**: Ô tìm kiếm đảm bảo khoảng đệm tối thiểu 44px giữa nút Micro và nút danh sách gợi ý, tránh chồng lấn khi thao tác trên màn hình cảm ứng nhỏ.

---

## 5. Tệp dữ liệu Token & Mã nguồn CSS đính kèm

- **Tệp Token JSON**: [dark-mode-tokens.json](file:///c:/Users/umnuar/Downloads/tudien-main/docs/design/dark-mode-tokens.json) – Cấu trúc chuẩn JSON Schema mô tả chi tiết 2 theme, giá trị màu, độ tương phản và ánh xạ component.
- **Tệp Biến CSS Drop-in**: [dark-mode-themes.css](file:///c:/Users/umnuar/Downloads/tudien-main/docs/design/dark-mode-themes.css) – Bộ biến CSS custom properties sẵn sàng tích hợp với thuộc tính `[data-theme="forest-midnight"]` hoặc `[data-theme="graphite"]`.
