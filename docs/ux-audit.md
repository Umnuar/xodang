# BÁO CÁO AUDIT TRẢI NGHIỆM NGƯỜI DÙNG & TIẾP CẬN (UX & A11Y AUDIT)
*Dự án: Ứng dụng số hóa hỗ trợ tự học và bảo tồn ngôn ngữ Xơ Đăng cho học sinh THCS*  
*Tiêu chuẩn đối chiếu: 10 Nguyên lý Nielsen Heuristics + WCAG 2.2 Cấp độ AA*  
*Ngày thực hiện: 2026-10-03*

---

## 1. Tổng Quan Kết Quả Đánh Giá

| Tiêu chí kiểm tra | Tình trạng hiện tại | Đánh giá tổng quan |
| :--- | :--- | :--- |
| **Độ tương phản màu (Color Contrast)** | ⚠️ Cảnh báo | Màu chữ phụ `#666` trên nền trắng chỉ đạt ~4.4:1; Trong Dark mode chữ `#bdc3c7` trên `#34495e` đạt ~3.8:1 (dưới chuẩn 4.5:1). Thẻ lỗi nền `#e74c3c` chữ trắng gây chói lóa. |
| **Kích thước vùng bấm (Tap Targets)** | ❌ Không đạt (23 phần tử) | 23 nút bấm và liên kết có chiều cao < 44px (chuẩn tối thiểu 48x48px trên thiết bị di động theo WCAG 2.5.8 & 2.5.5). Bao gồm nút menu (42px), nút micro (42px), các hashtag (28px - 38px), nút đóng modal (32px). |
| **Điều hướng bàn phím (Keyboard Navigation)** | ⚠️ Cần khắc phục | Thiếu `:focus-visible` tùy biến với độ tương phản cao; một số nút dùng `outline: none` dẫn đến mất dấu con trỏ bàn phím; Onboarding modal chưa thực hiện focus trap hoàn chỉnh. |
| **Cấu trúc tiêu đề (Heading Hierarchy)** | ⚠️ Trung bình | Các thẻ `h1`, `h2`, `h3` phân cấp tương đối tốt, nhưng một số card dùng thẻ `h3` trước `h2`, hoặc tiêu đề phụ không có vai trò ngữ nghĩa rõ ràng. |
| **Nhãn Form & ARIA Accessibility** | ❌ 2 cảnh báo Console | Console ghi nhận 2 cảnh báo: `No label associated with a form field`. Nút icon audio, nút xóa file, nút điều hướng thẻ flashcard thiếu `aria-label` chi tiết. |
| **Thao tác một tay trên di động (Mobile Thumb Zone)** | ❌ Chưa tối ưu | Toàn bộ thanh điều hướng chính nằm ở đỉnh màn hình (Sticky top navbar), học sinh cầm điện thoại 1 tay không thể với tới các tab menu nếu không đổi tay cầm. |
| **Độ dịch chuyển bố cục (CLS) & Tốc độ** | ✅ Tốt | Đã có skeleton cơ bản nên CLS thấp (< 0.05), tuy nhiên Service Worker gặp lỗi MIME type khi nạp `service-worker.js` khiến tính năng offline PWA chưa kích hoạt trọn vẹn ở môi trường dev. |

---

## 2. Bảng Phân Loại Lỗi Chi Tiết (P0 - P1 - P2)

### 2.1 Mức P0: Lỗi Chặn / Vi Phạm Nghiêm Trọng Trải Nghiệm (Critical Blockers)
*Cần giải quyết triệt để ngay trong đợt tái thiết kế*

1. **[P0-01] Vùng bấm (Tap Target) trên di động quá nhỏ gây bấm trượt (WCAG 2.5.5)**:
   - *Vị trí*: Toàn bộ các nút hashtag ở Footer (chiều cao 28px - 38px), nút điều hướng Onboarding (42px), nút micro `#speechButton` (42px), các nút chức năng icon game (36px).
   - *Hậu quả*: Học sinh THCS sử dụng điện thoại màn hình nhỏ (360px) rất dễ bấm nhầm hoặc bấm không ăn.
   - *Khắc phục*: Tăng `min-height: 48px; min-width: 48px;` cho mọi phần tử tương tác, bổ sung padding bao quanh.

2. **[P0-02] Thiếu nhãn liên kết Form và ARIA cho các nút hành động chỉ có biểu tượng (WCAG 4.1.2)**:
   - *Vị trí*: `#singlePlayAudioBtn`, `#singleStopAudioBtn`, `#singleDeleteAudioBtn`, `#prevCardBtn`, `#nextCardBtn`, `#btnOpenLeaderboard`.
   - *Hậu quả*: Công cụ đọc màn hình (Screen Reader) của người khiếm thị không đọc được chức năng của nút (chỉ đọc "button" trống).
   - *Khắc phục*: Bổ sung `aria-label` tường minh và `aria-live` cho mọi tương tác âm thanh / lật thẻ.

3. **[P0-03] Trải nghiệm điều hướng di động không hỗ trợ thao tác ngón cái (Ergonomics & Thumb Zone)**:
   - *Vị trí*: Thanh Navbar cố định trên đỉnh máy chứa 5 nút viên thuốc nằm tràn và vỡ dòng trên màn hình < 380px.
   - *Hậu quả*: Gây khó khăn lớn khi cầm máy bằng một tay; che khuất phần đầu nội dung khi cuộn.
   - *Khắc phục*: Xây dựng **Mobile Bottom Navigation Bar** thanh thoát ở đáy màn hình cho 4 tab chính (`Trang chủ`, `Học tập`, `Trò chơi`, `Đóng góp`), chuyển các cài đặt phụ vào ngăn xếp tiện ích.

---

### 2.2 Mức P1: Lỗi Gây Khó Chịu Lớn (Major UX Friction)

1. **[P1-01] Độ tương phản kém trong Dark Mode và nhãn thứ cấp (WCAG 1.4.3)**:
   - *Vị trí*: Text nhãn `.stat-label` (`#666` trên `#ffffff` = 4.48:1; Dark mode `#bdc3c7` trên `#34495e` = 3.8:1); Placeholder input tìm kiếm bị chìm.
   - *Khắc phục*: Điều chỉnh token màu Dark Mode: Text chính `#f8fafc`, Text phụ `#94a3b8`, Nền card `#1e293b` trên nền tổng thể `#0f172a`. Đảm bảo tỉ lệ tương phản luôn đạt tối thiểu 5.5:1.

2. **[P1-02] Thiếu Focus-Visible & Viền định vị bàn phím (WCAG 2.4.7)**:
   - *Vị trí*: Khi nhấn phím `Tab` duyệt qua các nút và ô nhập, đường viền focus mờ hoặc biến mất hoàn toàn do CSS reset `outline: none`.
   - *Khắc phục*: Thiết lập chuẩn `:focus-visible { outline: 2px solid var(--primary-accent); outline-offset: 2px; }`.

3. **[P1-03] Empty State nghèo nàn và thiếu gợi ý hành động (Nielsen Heuristic #10 & #6)**:
   - *Vị trí*: Ô kết quả tìm kiếm khi chưa nhập gì chỉ hiện dòng chữ xám "Nhập từ cần tra cứu và nhấn nút 'Tra cứu'".
   - *Khắc phục*: Thiết kế Empty State trực quan với minh họa đồ họa, kèm danh sách các "Từ khóa phổ biến" (vd: "Xin chào", "Cảm ơn", "Gia đình") dạng chips bấm 1 chạm để tra ngay.

4. **[P1-04] Modal Onboarding quá nhiều chữ, thiếu tương tác trực quan (Nielsen Heuristic #8)**:
   - *Vị trí*: 4 slide hướng dẫn chứa các đoạn văn dài miêu tả tính năng; người dùng thường bấm bỏ qua mà không đọc.
   - *Khắc phục*: Chuyển đổi slide sang dạng thẻ trực quan (Visual Showcase) với hình ảnh minh họa sống động, rút gọn text còn 1 câu đắt giá kèm badge nổi bật.

---

### 2.3 Mức P2: Thẩm Mỹ & Tinh Chỉnh (Polish & Aesthetics)

1. **[P2-01] Thiếu Design Tokens đồng bộ cho Spacing, Radius và Shadows**:
   - Hiện tại bán kính góc bo dùng lẫn lộn: `8px`, `10px`, `15px`, `20px`, `25px`, `50%`.
   - Cần chuẩn hóa: `--radius-sm: 6px`, `--radius-md: 10px`, `--radius-lg: 16px`, `--radius-xl: 24px`, `--radius-full: 9999px`.

2. **[P2-02] Bảng màu chưa mang đậm bản sắc văn hóa Xơ Đăng / Tây Nguyên**:
   - Hiện tại phối màu xám navy `#2c3e50` + xanh lá flat `#27ae60` mang phong cách bootstrap cổ điển.
   - Cải tiến: Kết hợp gam màu ấm áp của đất bazan, thổ cẩm Tây Nguyên và rừng đại ngàn (Emerald Green, Ochre Gold, Crimson Terracotta) tạo cảm xúc tự hào văn hóa dân tộc.

3. **[P2-03] Thiếu Micro-interactions và âm thanh phản hồi nhẹ nhàng khi tương tác UI**:
   - Nút bấm khi click chưa có hiệu ứng co nhún (active scale down `transform: scale(0.97)`), chuyển tab chưa mượt mà.

---

## 3. Kế Hoạch Chia Lô Trang (Batching Plan)

Để đảm bảo quy trình kiểm soát chất lượng tuyệt đối và không gây xáo trộn code, toàn bộ 6 màn hình được chia thành **3 LÔ (BATCHES)** theo độ gắn kết cấu trúc:

```
┌────────────────────────────────────────────────────────────────────────┐
│ LÔ 1 (Batch 1): Khung Ứng Dụng (Shell) + Trang Chủ + Hướng Dẫn       │
│ - Global Layout (Header, Desktop Navbar, Mobile Bottom Bar, Footer)    │
│ - Màn hình Trang Chủ (Từ Điển 2 chiều, Stats, Audio Download, Voice)    │
│ - Modal Hướng Dẫn (Onboarding Showcase) + Modal Cài Đặt (PWA Install)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ LÔ 2 (Batch 2): Học Tập & Giải Trí (Learning & Gamification Hub)       │
│ - Màn hình Học & Kiểm Tra (Quiz, Topic Picker, 3D Flashcard, Exam)     │
│ - Màn hình Trò Chơi Giáo Dục (Game Hub, 4 Game Cards, Top Bảng Vàng)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ LÔ 3 (Batch 3): Cộng Đồng & Ngoại Tuyến (Community & Resilience)       │
│ - Màn hình Đóng Góp Từ Vựng (Tab Đơn, Tab Thu Hàng Loạt, Audio Wave)  │
│ - Tiện ích Trợ Lý Ảo Chatbot (Floating Widget, Chat Window)           │
│ - Trang Cứu Trợ Ngoại Tuyến Độc Lập (Offline Fallback Page)           │
└────────────────────────────────────────────────────────────────────────┘
```
