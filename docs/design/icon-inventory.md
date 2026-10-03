# KIỂM KÊ VÀ BẢNG ÁNH XẠ ICON (ICON INVENTORY & MAPPING)
*Dự án: Xơ Đăng Lingua — Phiên bản 10.0.3*
*Ngày lập: 03/10/2026 — Kiểm kê thực tế trực tiếp từ source code (HTML, TS, CSS)*

---

## 1. Hiện Trạng Icon Trong Ứng Dụng
1. **Họ icon chính hiện tại**: Font Awesome 5/6 Free (lưu offline nội bộ dưới dạng webfonts `.woff2` trong `public/fonts/webfonts/` và CSS `public/fonts/fontawesome.css` / bundle).
2. **Các biểu hiện sai lệch phong cách ("AI Slop") phát hiện được**:
   - **Emoji màu sắc / 3D kiểu sticker**: Xuất hiện trực tiếp trong thẻ game (`🎴`, `🧺`, `🏹`, `🌾`), modal chúc mừng (`🎉`, `🏆`, `😢`), tiêu đề nhận xét quiz (`🌟`, `👍`, `💪`), các biểu tượng huy hiệu (`🌱`, `🥇`, `🥈`, `🥉`).
   - **Icon hỗn tạp nét & mảng**: Sự pha trộn giữa `fas` (Solid - mảng khối đậm) và `fab` (Brands) gây mất đồng bộ về trọng lượng thị giác trên màn hình phẳng.
   - **Kích thước & độ dày nét không đồng đều**: Nhiều icon hiển thị ở cỡ 12px, 14px, 20px, 32px với độ đậm nhạt khác nhau tùy font glyph.

---

## 2. Xác Minh Giấy Phép Họ Icon Mới: Lucide SVG
- **Họ icon lựa chọn**: **Lucide** (dẫn xuất từ Feather Icons).
- **Giấy phép (License)**: **ISC License** (tương đương MIT / 2-Clause BSD).
  - *Bản quyền*: Copyright (c) 2022 Lucide Contributors.
  - *Quyền hạn*: Được phép sao chép, sửa đổi, phân phối miễn phí hoặc thương mại trong mọi phần mềm nguồn mở hoặc đóng.
  - *Điều kiện tuân thủ*: Giữ thông báo bản quyền trong tài liệu dự án (ghi nhận tại `docs/design/icon-license.md` hoặc header file sprite).
- **Quy chuẩn kỹ thuật**:
  - Lưới chuẩn: **24 x 24 px**.
  - Độ dày nét (stroke-width): **2 px** (hoặc 1.75px trên mobile cỡ nhỏ).
  - Đầu nét & góc nối: `stroke-linecap="round"` và `stroke-linejoin="round"`.
  - Tô màu: `fill="none"`, `stroke="currentColor"` (tự động thích ứng theme Light & Dark mà không cần sửa code).
  - Triển khai: Lưu trữ SVG thuần trực tiếp trong repo (dạng SVG sprite nội bộ hoặc các file `.svg` đơn lẻ tại `src/renderer/assets/icons/`), **không dùng CDN, không thêm npm dependency**.

---

## 3. Bảng Ánh Xạ Chi Tiết: Icon Hiện Tại → Lucide SVG

| Vị trí / Màn hình | Selector / Code hiện tại | Loại hiện tại | Ý nghĩa chức năng | Icon Lucide thay thế (Tên chuẩn) | Ghi chú & Đánh giá tương đương |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Navbar / Logo** | `.brand-icon` | `fas fa-book-reader` | Biểu tượng thương hiệu từ điển | `book-open` | ✅ Khớp 1:1, nét vẽ cuốn sách mở thanh lịch |
| **Navbar / Theme** | `#themeIcon` | `fas fa-moon` / `fa-sun` | Chuyển đổi Dark / Light mode | `moon` / `sun` | ✅ Khớp 1:1 chuẩn mực |
| **Navbar / PWA** | `#pwaInstallBtn i` | `fas fa-cloud-download-alt` | Cài đặt ứng dụng PWA | `download` | ✅ Khớp 1:1, nét gọn gàng |
| **Nav Desktop / Mobile** | Menu Tra từ | `fas fa-search` | Tra cứu từ vựng | `search` | ✅ Khớp 1:1 |
| **Nav Desktop / Mobile** | Menu Học tập | `fas fa-graduation-cap` | Góc học tập & quiz | `graduation-cap` | ✅ Khớp 1:1 |
| **Nav Desktop / Mobile** | Menu Trò chơi | `fas fa-gamepad` | Trò chơi giáo dục | `gamepad-2` | ✅ Khớp 1:1 |
| **Nav Desktop / Mobile** | Menu Đóng góp | `fas fa-hands-helping` | Cộng đồng đóng góp từ | `heart-handshake` / `helping-hand` | ✅ Khớp 1:1, diễn đạt đúng tinh thần cộng đồng |
| **Home / Search** | `#speechButton i` | `fas fa-microphone` | Ghi âm giọng nói tìm kiếm | `mic` | ✅ Khớp 1:1 |
| **Home / Diacritics** | `.diacritics-label i` | `fas fa-keyboard` | Nhãn bàn phím ký tự | `keyboard` | ✅ Khớp 1:1 |
| **Home / Submit** | `.search-button i` | `fas fa-search` | Nút bấm tra từ | `search` | ✅ Khớp 1:1 |
| **Home / Audio player** | `.btn-play-audio i` | `fas fa-volume-up` | Phát âm thanh từ vựng | `volume-2` | ✅ Khớp 1:1, loa phát sóng âm thanh |
| **Home / Audio mute** | `.btn-mute-audio i` | `fas fa-volume-mute` | Tắt tiếng | `volume-x` | ✅ Khớp 1:1 |
| **Home / Offline card** | `.offline-card-icon i` | `fas fa-database` | Cơ sở dữ liệu offline | `database` | ✅ Khớp 1:1 |
| **Home / Download** | `.btn-download-offline i` | `fas fa-download` | Tải dữ liệu ngoại tuyến | `download` | ✅ Khớp 1:1 |
| **Home / Suggestions** | `.chips-label i` | `fas fa-lightbulb` | Gợi ý tìm kiếm phổ biến | `sparkles` / `lightbulb` | ✅ Khớp 1:1 |
| **Home / Features** | Danh sách tính năng | `fa-check-circle`, `fa-volume-up`, `fa-exchange-alt`, `fa-microphone`, `fa-brain`, `fa-wifi` | 6 tính năng nổi bật | `check-circle-2`, `volume-2`, `arrow-left-right`, `mic`, `brain`, `wifi` | ✅ Khớp 1:1 |
| **Quiz / Topic cards** | Icon chủ đề học | `fa-users`, `fa-heart`, `fa-tree`, `fa-home`... | Phân loại chủ đề từ vựng | `users`, `heart`, `trees`, `home`... | ✅ Khớp 1:1 theo từng chủ đề |
| **Quiz / Flashcard** | Nút lật thẻ | `fas fa-sync-alt` | Đảo mặt thẻ từ | `rotate-cw` | ✅ Khớp 1:1 |
| **Quiz / Navigation** | Nút Trước / Sau | `fas fa-chevron-left`, `fas fa-chevron-right` | Chuyển câu / chuyển thẻ | `chevron-left`, `chevron-right` | ✅ Khớp 1:1 |
| **Quiz / Result** | Đánh giá sao | `fas fa-star` | Điểm số và xếp hạng | `star` | ✅ Khớp 1:1 nét viền |
| **Quiz / Replay** | Nút làm lại | `fas fa-redo` | Thi lại chủ đề | `rotate-ccw` | ✅ Khớp 1:1 |
| **Game / Hub User** | Avatar học sinh | `fas fa-user-graduate` | Hồ sơ người học | `user` / `graduation-cap` | ✅ Khớp 1:1 |
| **Game / Hub Bar** | Nút Bảng vàng | `fas fa-trophy` | Bảng vàng thành tích | `trophy` | ✅ Khớp 1:1 |
| **Game / Hub Bar** | Nút Huy hiệu | `fas fa-medal` | Bộ sưu tập huy hiệu | `medal` | ✅ Khớp 1:1 |
| **Game / Hub Bar** | Nút Chứng nhận | `fas fa-certificate` | Kho chứng nhận | `award` | ✅ Khớp 1:1 |
| **Game / Hub Bar** | Nút Âm thanh | `fas fa-volume-up` | Bật/tắt SFX | `volume-2` / `volume-x` | ✅ Khớp 1:1 |
| **Game / Card 1** | Icon Lật Thẻ | `🎴` (Emoji) | Thẻ bài trí nhớ | `layers` / `copy` | ✅ Thay emoji bằng icon thẻ bài nét đơn |
| **Game / Card 2** | Icon Mưa Từ | `🧺` (Emoji) | Giỏ hứng từ ngữ | `shopping-bag` / `inbox` | ✅ Thay emoji giỏ tre bằng inbox/receptacle nét đơn |
| **Game / Card 3** | Icon Bảo Vệ Làng | `🏹` (Emoji) | Cung tên bảo vệ làng | `shield` / `target` | ✅ Thay emoji cung tên bằng icon khiên bảo vệ `shield` nét đơn |
| **Game / Card 4** | Icon Nông Trại | `🌾` (Emoji) | Bông lúa nông nghiệp | `sprout` / `wheat` | ✅ Thay emoji bông lúa bằng mầm cây `sprout` nét đơn |
| **Game / Play button**| Nút chơi | `fas fa-play` | Bắt đầu chơi | `play` | ✅ Khớp 1:1 |
| **Game / Active Top** | Nút thoát game | `fas fa-arrow-left` | Quay lại menu game | `arrow-left` | ✅ Khớp 1:1 |
| **Game / Lives** | Mạng sống | `fas fa-heart` | Số lượt chơi còn lại | `heart` | ✅ Khớp 1:1 |
| **Game / Modal** | Icon kết thúc | `🎉`, `🏆`, `😢` (Emoji) | Thắng / Thua màn chơi | `trophy` (thắng) / `rotate-ccw` (thua) | ✅ Thay hoàn toàn emoji bằng icon nét đơn |
| **Contribute / Record**| Nút bắt đầu thu | `fas fa-microphone` | Bắt đầu thu âm | `mic` | ✅ Khớp 1:1 |
| **Contribute / Stop** | Nút dừng thu | `fas fa-stop` | Dừng ghi âm | `square` | ✅ Khớp 1:1 chuẩn player |
| **Contribute / Play** | Nghe thử bản thu | `fas fa-play` | Phát lại audio | `play` | ✅ Khớp 1:1 |
| **Contribute / Trash**| Xóa bản thu | `fas fa-trash` | Bỏ bản thu làm lại | `trash-2` | ✅ Khớp 1:1 |
| **Contribute / Submit**| Nút gửi từ | `fas fa-paper-plane` | Gửi đóng góp lên hàng đợi | `send` | ✅ Khớp 1:1 |
| **Chat / Toggle** | Nút mở chat tròn | `fas fa-comments` | Kích hoạt trợ lý AI | `message-square` | ✅ Khớp 1:1 nét đơn trang nhã |
| **Chat / Close** | Nút đóng chat | `fas fa-times` | Đóng hộp thoại | `x` | ✅ Khớp 1:1 |
| **Chat / Send** | Nút gửi tin | `fas fa-paper-plane` | Gửi câu hỏi | `send` | ✅ Khớp 1:1 |
| **Global / Offline** | Nhãn mất mạng | `fas fa-wifi` | Báo mất mạng | `wifi-off` | ✅ Khớp 1:1 rõ nghĩa hơn `fa-wifi` cũ |
| **Global / Close** | Nút đóng modal | `fas fa-times` | Đóng các dialog/modal | `x` | ✅ Khớp 1:1 |

---

## 4. Kế Hoạch Chuyển Đổi Từng Lô & Giữ Font Cũ
- **Nguyên tắc an toàn**: Trong các lô triển khai UI (Lô 1 → Lô 6), các icon mới sẽ được thay thế tuần tự bằng thẻ `<svg class="lucide-icon" ...>` tương ứng.
- **Không vội xóa Font Awesome**: File font `.woff2` và CSS font vẫn được giữ nguyên vẹn trong dự án suốt quá trình tái thiết kế để tránh phát sinh lỗi hiển thị dở dang.
- **Tiêu chí dọn dẹp cuối cùng**: Chỉ thực hiện xóa thư mục `public/fonts/` và các tham chiếu font khi kiểm tra grep toàn diện toàn bộ repo (`grep -rn "fa-" src/ index.html`) cho kết quả bằng 0 và được người dùng phê duyệt bằng văn bản.
