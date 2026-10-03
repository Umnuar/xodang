# ĐẶC TẢ THÀNH PHẦN GIAO DIỆN (COMPONENTS SPECIFICATION)
*Dự án: Xơ Đăng Lingua — Phiên bản 10.0.3 | Nhánh: `feat/ui-minimal`*

---

## 1. NGUYÊN TẮC THIẾT KẾ CỐT LÕI (CORE PRINCIPLES)
1. **Phân cấp bằng kiểu chữ và khoảng trắng**: Không dùng khung hộp màu mè, không dùng dải màu trang trí. Cỡ chữ (size), độ đậm (weight: 400/500/600/700) và 3 mức sắc độ chữ (chính, phụ, mờ) là công cụ phân cấp duy nhất.
2. **Căn trái, lưới chuẩn xác**: Toàn bộ nội dung tuân thủ lề trái thẳng hàng, bỏ hoàn toàn việc căn giữa toàn màn hình (center alignment). Khoảng cách tuân thủ thang 4/8px (`4, 8, 12, 16, 20, 24, 32, 48px`).
3. **Viền phẳng 1px thay cho bóng đổ**: Sử dụng đường viền phẳng 1px (`#E7E5E4` / `#E4E4E7` ở Light mode; `#3F3F46` / `#27272A` ở Dark mode). Bóng đổ tối đa 1 cấp độ cực nhẹ hoặc bằng 0 (`box-shadow: none`).
4. **Bo góc tinh giản (4px – 6px)**: Nghiêm cấm bo góc lớn (pill/full radius) cho các khối thẻ và nút bấm chữ nhật. Bo tròn (9999px) chỉ dùng duy nhất cho avatar tròn hoặc nút công tắc switch.
5. **Kích thước chạm chuẩn WCAG 2.2 AA**: Toàn bộ nút bấm, icon button, tab bar và phím ký tự phải có kích thước chạm tối thiểu **44 x 44 px** (ưu tiên 48px cho các tác vụ chính).
6. **Hệ icon nét đơn Lucide SVG duy nhất**: Kích thước 24x24px, nét 2px, `stroke="currentColor"`, `fill="none"`, `aria-hidden="true"`.

---

## 2. QUY CHUẨN CÁC THÀNH PHẦN CHÍNH (COMPONENT SPECIFICATIONS)

### 2.1. Khung Dùng Chung (Shell / Layout)

#### A. Thanh Điều Hướng Desktop (Navbar)
- **Cấu trúc**: Chiều cao cố định 60px. Viền đáy 1px `border-subtle`.
- **Logo thương hiệu**: Căn trái. Icon `book-open` (24px) + Tiêu đề "Xơ Đăng Lingua" (`font-weight: 700`, 1.1rem) + phụ đề nhỏ "Bảo tồn ngôn ngữ THCS".
- **Menu liên kết**: Danh sách phẳng 4 mục (Tra từ, Học & Thi, Trò chơi, Đóng góp). Mục active có viền đáy 2px `colorPrimary` hoặc nền nhẹ 4px radius; không dùng pill màu.
- **Nút hành động**:
  - Nút chuyển Dark/Light mode: Nút viền mỏng, icon `moon` / `sun`.
  - Nút "Cài App Ngay" (PWA install): Nút gọn, icon `download`.

#### B. Thanh Điều Hướng Đáy Mobile (Mobile Bottom Navigation)
- **Cấu trúc**: Cố định đáy màn hình (`position: fixed; bottom: 0; left: 0; width: 100%; z-index: 100;`). Chiều cao 60px + khoảng đệm an toàn `env(safe-area-inset-bottom)`.
- **4 Tab tương tác**: Tra từ (`search`), Học & Thi (`graduation-cap`), Trò chơi (`gamepad-2`), Đóng góp (`helping-hand`).
- **Quy chuẩn chạm**: Mỗi tab chiếm 25% chiều rộng, chiều cao trọn vẹn 60px (đạt chuẩn ≥ 44px). Icon 20px, nhãn chữ 11px, `color: currentColor`.

#### C. Nút Mở Chat Nổi (#chatToggleBtn) & Nút "Cài App Ngay"
- **Xử lý chống chồng lấn trên Mobile (360px – 414px)**:
  - Trên desktop: Đặt tại `bottom: 24px; right: 24px;`.
  - Trên mobile (< 768px): Đặt tại `bottom: 76px; right: 16px;` (nằm an toàn **phía trên** thanh Bottom Nav 60px, cách mép trên của thanh bottom nav 16px).
  - Không che khuất nút gửi/nút tra cứu cuối trang nhờ `padding-bottom: 96px` trên `<main>`.

#### D. Báo Mất Mạng (Offline Indicator)
- **Cấu trúc**: Thanh thông báo mỏng 32px gắn trên cùng hoặc chip góc với icon `wifi-off` + nhãn "Chế độ Ngoại tuyến".
- **Màu sắc**: Màu cam đất hoặc xám trung tính, tương phản cao, không gây hoảng loạn.

---

### 2.2. Trang Chủ Tra Từ (#home)

#### A. Vị Trí Ô Tra Cứu (Above-the-Fold)
- **Cải tiến cốt lõi**: Ô tra từ `#searchForm` xuất hiện ngay lập tức trên màn hình đầu tiên (< 100px từ đỉnh màn hình trên mobile 360px), loại bỏ hoàn toàn việc bị đẩy xuống 1327px.
- **Ô nhập từ (`#word`)**: Chiều cao 48px, viền 1.5px `border-default`, bo góc 6px. Nút mic nhận diện giọng nói tích hợp bên trong ô nhập (icon `mic`, tap target 44x44px).

#### B. Bàn Phím Ký Tự Đặc Biệt Xơ Đăng (.diacritics-bar)
- **10 ký tự chuẩn**: **Ŏ, Ŭ, Ĕ, Ă, Â, Õ, Ě, Ĭ, Ơ̆, Ư̆**.
- **Kích thước chạm**: Mỗi nút đạt kích thước tối thiểu **44 x 44 px** (chiều rộng tối thiểu 44px, chiều cao 44px).
- **Bố cục di động**: Cuộn ngang mượt với `overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;` hoặc lưới 2 hàng 5 cột gọn gàng.

#### C. Thanh Thông Số Từ Điển Tinh Giản (Thay Thế Khối Bento Stats Cũ)
- **Giải pháp bảo toàn thông tin**: Trước khi xóa khối Bento 4 thẻ cồng kềnh, chuyển toàn bộ 4 chỉ số vào **thanh tóm tắt 1 dòng (One-Line Lexical Summary)** đặt ngay dưới ô tìm kiếm:
  `1.000+ từ chuẩn • 1.000+ phát âm bản địa • 2.000+ ví dụ • 100+ câu trắc nghiệm`
- **Kết quả**: Giữ trọn vẹn 100% dữ liệu thống kê người dùng cần, đồng thời tiết kiệm 200px chiều cao màn hình.

#### D. Thẻ Kết Quả Từ Điển (.word-card)
- **Cấu trúc**: Mặt phẳng thẻ trắng/xám tối, viền 1px `border-subtle`, bo góc 6px.
- **Từ đầu mục (Headword)**: In đậm, cỡ chữ 24px, màu `textPrimary`.
- **Ký âm phiên âm (IPA)**: Phông chữ monospace hoặc nghiêng nhẹ, màu `textSecondary`.
- **Nút phát âm bản địa**: Nút tròn 44x44px, icon `volume-2`, không hiệu ứng viền chói.
- **Mục từ & Ví dụ**: Định nghĩa rõ ràng theo số thứ tự (1, 2); ví dụ song ngữ đặt thụt đầu dòng với màu `textSecondary`.

---

### 2.3. Trang Học Tập & Khảo Thí (#quiz)

#### A. Danh Mục Chủ Đề Học Tập
- **Lưới thẻ chủ đề**: Bỏ badge "Không gian khảo thí", đưa lưới chủ đề lên ngay đầu trang.
- **Thẻ chủ đề**: Khung phẳng viền 1px, tiêu đề chủ đề rõ ràng (Gia đình, Động vật, Thiên nhiên...), kèm thanh tiến độ học mỏng 4px hiển thị % đã học từ `studyProgressByTopic`.

#### B. Thẻ Flashcard Luyện Từ
- **Thiết kế phẳng**: Loại bỏ hiệu ứng bóng đổ dày và viền màu 3D.
- **Mặt trước**: Từ Xơ Đăng lớn, phát âm chuẩn, nút nghe audio rõ nét.
- **Mặt sau**: Nghĩa tiếng Việt, ví dụ câu ngữ cảnh.
- **Thao tác**: Nút lật thẻ to rõ (chiều cao 44px), nút Trước/Sau cân đối.

#### C. Giao Diện Thi Trắc Nghiệm & Kết Quả
- **Danh sách câu hỏi**: 4 đáp án dạng nút phẳng viền 1px thẳng hàng, khoảng cách 10px, chiều cao mỗi nút ≥ 48px.
- **Màn hình kết quả**: Bảng điểm rõ ràng (Số câu đúng / Tổng số câu, tỷ lệ %), bỏ emoji sticker `🎉`, `🏆`, thay bằng icon nét đơn `award` và nút "Làm lại" / "Chọn chủ đề khác".

---

### 2.4. Hub Trò Chơi Giáo Dục (#game)

#### A. Thanh Hồ Sơ Người Học (.game-user-bar)
- **Thẻ hồ sơ**: Căn ngang, gồm tên người học "Học sinh Xơ Đăng".
- **Các chip chức năng có nhãn rõ ràng (Labeled Chips)**:
  - Chip Bảng vàng: Icon `trophy` + Nhãn "Bảng vàng".
  - Chip Huy hiệu: Icon `medal` + Nhãn "Huy hiệu".
  - Chip Chứng nhận: Icon `award` + Nhãn "Chứng nhận".
  - Nút Âm thanh SFX: Nút bật/tắt riêng biệt icon `volume-2` / `volume-x` có tooltip "Bật/Tắt âm thanh hiệu ứng".
- **Kích thước chạm**: Toàn bộ các chip/nút đều đạt kích thước tối thiểu **44 x 44 px**.

#### B. 4 Thẻ Game Hub (Lựa Chọn Trò Chơi)
- **Xóa bỏ toàn bộ 4 emoji**:
  1. **Lật Thẻ Trí Nhớ**: Dùng icon Lucide **`copy`** hoặc **`layers`** (hình hai thẻ xếp chồng lệch nhau, sát nghĩa lật cặp thẻ).
  2. **Mưa Từ Vựng**: Dùng icon Lucide **`inbox`** hoặc **`shopping-bag`** (hình chiếc giỏ hứng từ rơi) hoặc **`cloud-rain`**.
  3. **Bảo Vệ Làng**: Dùng icon Lucide **`shield`** hoặc **`crosshair`** (hình khiên chắn bảo vệ hoặc tâm ngắm chính xác).
  4. **Nông Trại Số**: Dùng icon Lucide **`sprout`** (hình mầm cây vươn lên, đại diện nông nghiệp và gieo mầm từ ngữ).
- **Thao tác tương tác**: Toàn bộ thẻ game là khối có thể nhấp chuột (clickable surface), có hiệu ứng viền `border-default` khi hover/focus. Bỏ nút "Chơi ngay" lặp lại trên từng thẻ.

---

### 2.5. Trang Đóng Góp Từ Ngữ (#contribute)

- **Biểu mẫu**: Nhãn nằm phía trên ô nhập (Top-aligned labels), viền 1px, chiều cao ô nhập 44px.
- **Khu vực thu âm**:
  - Nút "Thu âm" (icon `mic`, chiều cao 48px).
  - Nút "Dừng" (icon `square`, chiều cao 48px).
  - Nút "Nghe lại" (icon `play`, chiều cao 48px).
  - Nút "Xóa bản thu" (icon `trash-2`, chiều cao 48px).
- **Hộp thoại xác nhận xóa**: Strictly **1 bước xác nhận duy nhất** với nút màu đỏ ghi chữ "Xóa" rõ ràng, không gây phiền toái cho người dùng.

---

### 2.6. Trợ Lý AI Chat & Modal

#### A. Cửa Sổ Chat Trên Mobile (#chatWindow)
- **Giải quyết mâu thuẫn hiển thị**:
  - **Phương án A (Bottom Sheet 85%)**: Trượt lên từ đáy chiếm 85% chiều cao màn hình, chừa lại 15% phía trên và **giữ nguyên thanh bottom navigation phía dưới** để học sinh có thể chuyển trang bất kỳ lúc nào.
  - **Phương án B (Full-screen Modal)**: Chiếm trọn 100% màn hình, thanh điều hướng tạm thời ẩn đi khi mở chat để học sinh có không gian tối đa để gõ phím ảo và đọc câu trả lời. Nút "Đóng" (icon `x`) to 44px ở góc trên cùng bên phải.
- **Hỗ trợ bàn phím**: Đóng ngay lập tức khi nhấn phím `Escape`.

#### B. Hướng Dẫn Ban Đầu (Onboarding Guide)
- Viết lại câu từ súc tích, dễ hiểu cho lứa tuổi 11-15:
  1. *Tra từ*: Gõ tiếng Việt hoặc Xơ Đăng, dùng phím dấu trên màn hình để tìm từ nhanh.
  2. *Luyện tập*: Lật thẻ từ vựng và làm bài trắc nghiệm ngắn để ghi nhớ.
  3. *Trò chơi*: Vừa chơi vừa tích điểm và sưu tầm huy hiệu học tập.
  4. *Học ngoại tuyến*: Ứng dụng vẫn chạy tốt khi điện thoại không có mạng internet.
- **Bảo toàn hợp đồng logic**: Giữ nguyên kiểm tra key `hasSeenIntro` trong `localStorage`.
