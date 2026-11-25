# Bảng màu Dark Mode & Đặc tả Design Tokens - Từ điển Xơ Đăng

Tài liệu đặc tả hệ thống giao diện tối (Dark Mode) cho ứng dụng học tập và tra cứu từ điển Xơ Đăng – Tiếng Việt, đồng bộ trực tiếp với nguồn chuẩn duy nhất [src/styles/tokens.css](../../src/styles/tokens.css). Toàn bộ thiết kế bám sát nhận diện thương hiệu Direction A (xanh lá `#1e7e48` Light / `#34d399` Dark, kiểu chữ **Be Vietnam Pro**), áp dụng nguyên tắc tăng độ sáng bề mặt (surface lightness elevation), không dùng nền đen tuyệt đối (#000000) và không dùng chữ trắng gắt (#ffffff) trên nền sáng hoặc nền accent sáng.

---

## 1. Tổng quan 2 Phương án Bảng màu

| Tiêu chí | Phương án A: "Rừng đêm" (Forest Midnight) | Phương án B: "Graphite" (Đang áp dụng chuẩn trong `tokens.css`) |
| :--- | :--- | :--- |
| **Bản sắc thị giác** | Nền đen pha sắc xanh lá rất nhẹ (tinted dark green), hài hòa hữu cơ với đại ngàn Tây Nguyên. | Tông than chì thuần khiết, hoàn toàn trung tính, không ám sắc, phong cách công cụ số tinh gọn học thuật. |
| **Nền trang (`--bg-canvas`)** | `#0b100e` | `#0f1012` |
| **Thẻ nội dung (`--bg-surface`)** | `#111815` | `#17181b` |
| **Phần nổi / Ô nhập (`--bg-surface-elevated`)** | `#17201c` | `#1f2124` (hover `#27292d`) |
| **Đường viền mảnh (`--border-subtle`)** | `rgba(255, 255, 255, 0.08)` | `rgba(255, 255, 255, 0.08)` (`--border-default`: `0.12`) |
| **Chữ chính (`--text-primary`)** | `#e8efe9` (Xanh sáng dịu) | `#e8e8ea` (Trắng xám ngà) |
| **Chữ phụ (`--text-secondary`)** | `#9db0a4` (Xám rêu nhạt) | `#a0a3a8` (Xám trung tính) |
| **Chữ mờ hiệu chỉnh AA (`--text-tertiary`)** | **`#75897e`** (đạt 4.84:1 trên card) | **`#8b909a`** (đạt 5.54:1 trên `#17181b`, 5.04:1 trên `#1f2124`, 4.55:1 trên `#27292d`) |
| **Nhấn thương hiệu (`--color-primary`)** | `#34d399` (Emerald 400) | `#34d399` (Emerald 400) |
| **Chữ trên nút nhấn (`--text-inverse`)** | **`#0b100e`** (Đạt 9.98:1 AAA) | **`#0f1012`** (Đạt 9.90:1 AAA) |
| **Lỗi ngữ pháp / Trắc nghiệm (`--color-danger`)** | `#f87171` | `#f87171` (`--color-danger-bg`: `#dc2626`) |
| **Cảnh báo / Biến thể từ (`--color-warning`)** | `#fbbf24` | `#fbbf24` |
| **Thông tin / Giải thích (`--color-info`)** | `#60a5fa` | `#60a5fa` |

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
| **Chữ mờ hiệu chỉnh (`#75897e`) trên Card** | `#111815` | `#75897e` | **4.84:1** | **Đạt AA Chuẩn** |
| **Màu nhấn (`#34d399`) trên Thẻ card** | `#111815` | `#34d399` | **9.37:1** | **Đạt AAA** |
| **Chữ đen trên Nút nhấn CTA xanh lá** | `#34d399` | `#0b100e` | **9.98:1** | **Đạt AAA** |
| *(Cảnh báo) Chữ trắng trên Nút nhấn xanh lá* | `#34d399` | `#ffffff` | *2.08:1* | **KHÔNG ĐẠT (Tránh dùng)** |
| **Màu báo lỗi (`#f87171`) trên Card** | `#111815` | `#f87171` | **6.51:1** | **Đạt AAA (Large) / AA** |
| **Màu cảnh báo (`#fbbf24`) trên Card** | `#111815` | `#fbbf24` | **10.80:1** | **Đạt AAA** |
| **Màu thông tin (`#60a5fa`) trên Card** | `#111815` | `#60a5fa` | **7.09:1** | **Đạt AAA** |

### Bảng tương phản Phương án B: "Graphite" (Canonical `src/styles/tokens.css`)

| Cặp màu hiển thị | Mã màu nền | Mã màu chữ/icon | Tỷ lệ tương phản | Đánh giá WCAG 2.2 |
| :--- | :--- | :--- | :--- | :--- |
| **Chữ chính trên Nền trang** | `#0f1012` | `#e8e8ea` | **15.56:1** | **Đạt AAA** |
| **Chữ chính trên Thẻ card** | `#17181b` | `#e8e8ea` | **14.51:1** | **Đạt AAA** |
| **Chữ chính trên Khung nổi/Input** | `#1f2124` | `#e8e8ea` | **13.19:1** | **Đạt AAA** |
| **Chữ phụ trên Thẻ card** | `#17181b` | `#a0a3a8` | **7.02:1** | **Đạt AAA** |
| **Chữ phụ trên Khung nổi/Input** | `#1f2124` | `#a0a3a8` | **6.38:1** | **Đạt AA** |
| **Chữ mờ hiệu chỉnh (`#8b909a`) trên Card / Elevated / Hover** | `#17181b` / `#1f2124` / `#27292d` | `#8b909a` | **5.54:1 / 5.04:1 / 4.55:1** | **Đạt AA Chuẩn** |
| **Màu nhấn (`#34d399`) trên Thẻ card** | `#17181b` | `#34d399` | **9.23:1** | **Đạt AAA** |
| **Chữ đen trên Nút nhấn CTA xanh lá** | `#34d399` | `#0f1012` | **9.90:1** | **Đạt AAA** |
| **Màu báo lỗi (`#f87171`) trên Card** | `#17181b` | `#f87171` | **6.30:1** | **Đạt AAA (Large) / AA** |
| **Màu cảnh báo (`#fbbf24`) trên Card** | `#17181b` | `#fbbf24` | **10.45:1** | **Đạt AAA** |
| **Màu thông tin (`#60a5fa`) trên Card** | `#17181b` | `#60a5fa` | **6.86:1** | **Đạt AAA (Large) / AA** |

> [!IMPORTANT]
> **Quy tắc thiết kế nút bấm CTA xanh lá**: Khi dùng màu nhấn `#34d399` làm nền nút bấm (Primary CTA Button), tuyệt đối **phải sử dụng `var(--text-inverse)` (`#0f1012` ở Graphite Dark)**. Chữ màu trắng `#ffffff` chỉ đạt 2.08:1 sẽ gây mờ mắt và trượt kiểm định accessibility.

---

## 3. Đặc tả Quy chuẩn Kỹ thuật Font & Dấu thanh Xơ Đăng

- **Font chữ quy định**: `'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` (self-hosted `.woff2` với đủ dải dấu tổ hợp `U+0300–U+036F`, đặc biệt `U+0306` cho `Ơ̆/Ư̆/ơ̆/ư̆/ê̆`).
- **Đặc thù ký tự ngữ âm Xơ Đăng**: Ngôn ngữ Xơ Đăng có hệ thống nguyên âm phức tạp với các dấu phụ đặc trưng (như `ơ̆`, `ŏ`, `ê̆`, dấu thanh ngã, huyền, hỏi đè lên nhau, dấu giọng thở).
- **Quy tắc Line-height**: Toàn bộ thẻ hiển thị chữ Xơ Đăng (`.xd-headword`, `.xd-phonetics`, `.word-text`, `.pronunciation`) bắt buộc giữ `line-height` tối thiểu **1.6** nhằm ngăn chặn hiện tượng cắt cụt dấu mũ trên (`ascender clipping`) hoặc dấu nặng dưới (`descender clipping`).
- **Phân tách nút Micro và Gợi ý**: Ô tìm kiếm đảm bảo vùng chạm tối thiểu `44×44px` giữa nút xóa, nút Micro và nút danh sách gợi ý.

---

## 4. Tệp dữ liệu Token & Mã nguồn CSS đính kèm

- **Nguồn chuẩn duy nhất (Single Source of Truth)**: [src/styles/tokens.css](../../src/styles/tokens.css) (`:root` với `color-scheme: light`, `:root.dark-mode, body.dark-mode` với `color-scheme: dark`, thang `--z-*`).
- **Tệp Token JSON**: [dark-mode-tokens.json](./dark-mode-tokens.json) & [tokens.json](./tokens.json).
- **Tệp Biến CSS Tham khảo**: [dark-mode-themes.css](./dark-mode-themes.css) – Bộ biến CSS tham chiếu song song 2 phương án `[data-theme="forest-midnight"]` và `[data-theme="graphite"]` đồng bộ font `Be Vietnam Pro` và giá trị Graphite chuẩn.
