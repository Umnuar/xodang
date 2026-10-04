# DANH SÁCH ĐỀ XUẤT TÙY CHỌN (OPTIONAL PROPOSALS)
*Dự án: Xơ Đăng Lingua — Phiên bản 10.0.3 | Nhánh: `feat/ui-minimal`*

---

## 1. Phím Tắt Bàn Phím Cho Flashcard (Space / Mũi Tên)
- **Mô tả tính năng đề xuất**:
  - Nhấn phím `Space` hoặc `Enter`: Lật thẻ Flashcard giữa mặt trước (tiếng Xơ Đăng) và mặt sau (tiếng Việt).
  - Nhấn phím `Mũi tên Trái (ArrowLeft)`: Chuyển về thẻ trước.
  - Nhấn phím `Mũi tên Phải (ArrowRight)`: Chuyển sang thẻ tiếp theo.
- **Lý do hoãn lại**: Đây là tính năng mới về mặt hành vi/tương tác, không thuộc phạm vi cải tiến giao diện (UI Redesign).
- **Phân tích rủi ro & xung đột**:
  1. *Xung đột cuộn trang (Page Scroll Conflict)*: Phím `Space` mặc định trên trình duyệt cuộn trang xuống dưới một khung nhìn. Nếu bắt sự kiện `e.preventDefault()`, người dùng máy tính sẽ mất khả năng dùng phím Space để cuộn trang khi đang ở chế độ học tập.
  2. *Xung đột nhập liệu (Input Focus Conflict)*: Nếu người dùng đang focus vào một ô nhập văn bản (vd: ô tìm kiếm từ điển hoặc khung chat) mà phím tắt không được cô lập chặt chẽ theo ngữ cảnh (scoped context), việc gõ dấu cách sẽ kích hoạt lật thẻ ngoài ý muốn.
  3. *Tương tác trên thiết bị di động (Mobile Irrelevance)*: Phần lớn người dùng sử dụng điện thoại cảm ứng không có bàn phím cứng, do đó tính năng này chỉ phục vụ nhóm người dùng máy tính để bàn.
- **Kết luận**: Đưa vào danh sách chờ (Backlog). Chỉ triển khai khi có yêu cầu và phê duyệt văn bản riêng từ người dùng.
