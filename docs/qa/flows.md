# 📋 DANH SÁCH CÁC LUỒNG NGƯỜI DÙNG CẦN KIỂM THỬ (User QA Flows)

**Dự án:** Từ Điển Xơ Đăng - Việt (Web PWA & Electron Desktop)  
**Tài liệu:** `docs/qa/flows.md`  
**Phiên bản:** 1.0.0 (Pha 0 — Chuẩn Bị & Lập Luồng)  
**Nhánh Git:** `fix/browser-qa` (Baseline Tag: `pre-browser-qa`)  

---

## Danh Sách 12 Luồng Người Dùng Kiểm Thử Trực Tiếp

### Luồng 1 (FLOW-01): Khởi động & Màn hình chính (Home Startup & Splash)
- **Mục đích:** Xác minh ứng dụng tải mượt mà, render thanh điều hướng (navbar), chân trang (footer), thống kê từ vựng, và thanh tìm kiếm chính.
- **Các bước:**
  1. Mở trang chủ ứng dụng tại `http://localhost:3000/`.
  2. Quan sát splash loading hoặc màn hình chờ (nếu có).
  3. Kiểm tra hiển thị tiêu đề, ô nhập từ khóa `#word`, nút tra cứu, các chỉ số thống kê (từ vựng, âm thanh, trắc nghiệm).
- **Kết quả mong đợi:** Trang tải hoàn tất không có lỗi console; hiển thị đầy đủ giao diện tìm kiếm và thống kê.

---

### Luồng 2 (FLOW-02): Tra cứu từ vựng xuôi/ngược (Dictionary Search)
- **Mục đích:** Kiểm tra tính năng tra từ Việt $\rightarrow$ Xơ Đăng và Xơ Đăng $\rightarrow$ Việt.
- **Các bước:**
  1. Nhập từ phổ biến vào `#word`, ví dụ: `"xin chào"`, chọn hướng `"viet_to_ethnic"`.
  2. Bấm nút "Tra cứu" hoặc nhấn Enter.
  3. Đổi hướng sang `"ethnic_to_viet"`, nhập `"bơ rơ ha"`.
  4. Bấm "Tra cứu".
- **Kết quả mong đợi:** Hiển thị thẻ từ (`word-card`) chính xác với từ gốc, từ dịch, phiên âm, nút phát âm, và ví dụ song ngữ.

---

### Luồng 3 (FLOW-03): Tìm kiếm với điều kiện biên & Ký tự đặc biệt (Edge-Case Search)
- **Mục đích:** Kiểm tra xử lý từ không có trong từ điển, ký tự đặc biệt, chuỗi rỗng và chuỗi siêu dài.
- **Các bước:**
  1. Bấm tra cứu khi ô tìm kiếm rỗng.
  2. Nhập từ không tồn tại (vd: `"xyz123abc"`).
  3. Nhập chuỗi chứa ký tự HTML/regex: `"<test>.*+?^${}()|[\]\\"`.
  4. Nhập chuỗi dài trên 100 ký tự.
- **Kết quả mong đợi:** 
  - Ô rỗng: Hiển thị hướng dẫn tra cứu.
  - Từ không có: Hiển thị thông báo "Không tìm thấy kết quả phù hợp" an toàn (không bị XSS).
  - Chuỗi dài: Bị giới hạn độ dài hoặc xử lý êm thấm, không gây sập ứng dụng (ReDoS / SyntaxError).

---

### Luồng 4 (FLOW-04): Phát âm thanh từ vựng (Audio Playback)
- **Mục đích:** Kiểm tra tính năng nghe phát âm từ điển trực tuyến và cơ chế fallback tạo âm thanh mẫu.
- **Các bước:**
  1. Trên thẻ từ vựng kết quả, bấm nút phát âm (biểu tượng loa).
  2. Bấm liên tục nhiều lần hoặc bấm phát âm từ khác trong khi âm thanh trước đang chạy.
- **Kết quả mong đợi:** Âm thanh phát đúng, không xung đột luồng audio, giao diện icon hiển thị trạng thái đang phát / kết thúc phù hợp.

---

### Luồng 5 (FLOW-05): Đóng góp từ vựng đơn lẻ (Contribute Single Vocab)
- **Mục đích:** Kiểm tra biểu mẫu đóng góp từ mới và tệp ghi âm / tải lên.
- **Các bước:**
  1. Điều hướng sang `#contribute` (tab Đóng góp đơn).
  2. Thử bấm "Gửi từ vựng" khi các ô đang để trống.
  3. Nhập từ tiếng Việt, từ Xơ Đăng.
  4. Thử tải lên file không phải âm thanh (vd: `.txt`, `.png`) hoặc file quá lớn (>10MB).
  5. Thử tính năng thu âm qua microphone (nếu được cấp quyền) hoặc tải file âm thanh hợp lệ (`.mp3`/`.webm`).
  6. Bấm nút "Gửi từ vựng".
- **Kết quả mong đợi:** Validate form đúng; báo lỗi khi thiếu thông tin; từ chối file sai định dạng/dung lượng; gửi đóng góp thành công khi dữ liệu hợp lệ.

---

### Luồng 6 (FLOW-06): Đóng góp từ vựng hàng loạt (Contribute Batch Queue)
- **Mục đích:** Kiểm tra hàng đợi thu âm / upload nhiều tệp đóng góp cùng lúc.
- **Các bước:**
  1. Chuyển sang tab "Đóng góp hàng loạt" (`#batchTab`).
  2. Tải lên danh sách nhiều tệp âm thanh.
  3. Nghe thử từng tệp trong danh sách hàng đợi (`batchQueueList`).
  4. Xóa thử một tệp khỏi hàng đợi.
  5. Kiểm tra hiển thị tổng dung lượng và số lượng tệp.
- **Kết quả mong đợi:** Danh sách cập nhật tức thì, nút nghe/xóa hoạt động chính xác bằng Event Delegation, không rò rỉ URL Blob.

---

### Luồng 7 (FLOW-07): Trắc nghiệm ngôn ngữ Xơ Đăng (Quiz Feature)
- **Mục đích:** Kiểm tra tính năng học tập qua câu hỏi trắc nghiệm tương tác.
- **Các bước:**
  1. Điều hướng sang tab `#quiz`.
  2. Đọc câu hỏi, quan sát 4 phương án đáp án A, B, C, D.
  3. Chọn 1 đáp án: kiểm tra phản hồi màu sắc (xanh khi đúng, đỏ khi sai) và phần giải thích.
  4. Bấm "Câu tiếp theo" để chuyển câu.
  5. Hoàn thành toàn bộ câu hỏi và kiểm tra bảng kết quả tổng kết điểm số.
- **Kết quả mong đợi:** Dữ liệu câu hỏi hiển thị đầy đủ; tính điểm chính xác; có nút làm lại bài trắc nghiệm.

---

### Luồng 8 (FLOW-08): Mini-Games học tập (Games: Lật thẻ, Hứng từ, Bắn từ)
- **Mục đích:** Kiểm tra hoạt động của 3 mini-games giáo dục.
- **Các bước:**
  1. Điều hướng sang `#game`.
  2. **Game 1 (Lật thẻ - Memory Match):** Bấm lật 2 thẻ ghép đôi từ vựng Việt - Xơ Đăng, kiểm tra tính điểm khi ghép đúng / lật úp khi ghép sai.
  3. **Game 2 (Hứng từ - Word Catcher):** Di chuyển giỏ để đón nhận từ ngữ đúng rơi từ trên xuống, kiểm tra va chạm và mất mạng khi hứng sai.
  4. **Game 3 (Bắn từ - Word Shooter):** Nhắm bắn đáp án chính xác, kiểm tra đạn và điểm số.
- **Kết quả mong đợi:** Vòng lặp animation chạy mượt mà; render an toàn chống XSS; nút chơi lại / tạm dừng hoạt động tốt; dọn dẹp timer khi rời màn hình game.

---

### Luồng 9 (FLOW-09): Trợ lý Chatbot AI học tập (Chat Assistant Modal)
- **Mục đích:** Kiểm tra giao diện trò chuyện hỗ trợ học tiếng Xơ Đăng.
- **Các bước:**
  1. Bấm nút mở Chatbot nổi ở góc màn hình.
  2. Bấm vào các nút gợi ý câu hỏi mẫu.
  3. Nhập câu hỏi tự do vào ô chat và gửi.
  4. Bấm nút đóng modal chat.
- **Kết quả mong đợi:** Modal mở/đóng mượt mà; tin nhắn được thêm vào danh sách an toàn qua DOM API; gợi ý câu hỏi click được; cuộn tin nhắn mượt mà.

---

### Luồng 10 (FLOW-10): Hướng dẫn sử dụng Onboarding (Onboarding Modal)
- **Mục đích:** Kiểm tra modal giới thiệu dành cho học sinh THCS lần đầu truy cập.
- **Các bước:**
  1. Bấm nút "Trợ giúp / Hướng dẫn" trên thanh điều hướng.
  2. Lần lượt bấm "Tiếp tục" qua các bước hướng dẫn.
  3. Bấm "Bắt đầu ngay" ở bước cuối cùng hoặc bấm nút "Bỏ qua".
- **Kết quả mong đợi:** Chuyển slide hướng dẫn chính xác; trạng thái `hasSeenIntro` được ghi nhớ trong localStorage; modal đóng sạch sẽ.

---

### Luồng 11 (FLOW-11): Điều hướng Hash Routing & Lịch sử trình duyệt
- **Mục đích:** Kiểm tra cơ chế định tuyến không tải lại trang (`#home`, `#contribute`, `#quiz`, `#game`).
- **Các bước:**
  1. Bấm chuyển lần lượt giữa các menu trên Navbar.
  2. Nhập trực tiếp hash trên URL (vd: `http://localhost:3000/#quiz`).
  3. Bấm nút Back và Forward trên trình duyệt.
  4. Thử nhập hash không hợp lệ (vd: `http://localhost:3000/#unknown-route`).
- **Kết quả mong đợi:** Mục menu active thay đổi tương ứng; nội dung section hiển thị đúng; nút Back/Forward hoạt động chuẩn; route lạ tự động chuyển hướng về `#home`.

---

### Luồng 12 (FLOW-12): Giao diện Responsive & Khả năng truy cập (A11y & Responsiveness)
- **Mục đích:** Kiểm tra hiển thị trên các độ phân giải màn hình khác nhau và hỗ trợ bàn phím.
- **Các bước:**
  1. Kiểm tra ở 3 kích thước: **Mobile (360px)**, **Tablet (768px)**, **Desktop (1280px)**.
  2. Kiểm tra menu hamburger trên thiết bị di động (bấm mở/đóng).
  3. Dùng phím `Tab` để điều hướng toàn bộ trang, kiểm tra đường viền focus nhìn thấy được.
  4. Kiểm tra độ tương phản màu sắc và kích thước vùng chạm (touch target $\ge 44\text{px}$).
- **Kết quả mong đợi:** Không bị vỡ khung, tràn ngang (horizontal scrollbar); chữ không bị cắt; điều hướng bàn phím đầy đủ.
