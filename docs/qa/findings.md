# 🔍 DANH SÁCH CÁC PHÁT HIỆN KIỂM CHỨNG TRÌNH DUYỆT (QA Findings)

**Dự án:** Từ Điển Xơ Đăng - Việt (Web PWA & Electron Desktop)  
**Tài liệu:** `docs/qa/findings.md`  
**Phiên bản:** 1.0.0 (Pha 1 — Kiểm Chứng Trực Tiếp Trên Trình Duyệt)  
**Nhánh Git:** `fix/browser-qa` (Baseline Tag: `pre-browser-qa`)  
**Môi trường kiểm thử:** Localhost (`http://localhost:3000/`), Trình duyệt Chromium/Brave headless engine qua Playwright, Viewports: Desktop (1280x720), Tablet (768x1024), Mobile (360x640).  

---

## 1. Bảng Tổng Hợp Phát Hiện (Xếp Theo Mức Độ Ưu Tiên P0 → P3)

| ID | Loại | Tiêu đề phát hiện | Mức độ | Độ tin cậy | Nhãn sửa |
|:---:|:---|:---|:---:|:---:|:---:|
| **QA-01** | **Chức năng / Mạng** | Google Sheets API 403 và thiếu dữ liệu Offline Snapshot Fallback | **P1** | **Cao** ($\ge 2$ lần) | **CỔNG DUYỆT** |
| **QA-02** | **UI / Responsive** | Navbar tràn 3 hàng và che khuất tiêu đề trang trên màn hình nhỏ (360px) | **P2** | **Cao** ($\ge 2$ lần) | **TỰ SỬA** |
| **QA-03** | **Console / Mạng** | Gọi Favicon URL tuyệt đối ra ngoài domain thay vì asset cục bộ | **P3** | **Cao** ($\ge 2$ lần) | **TỰ SỬA** |
| **QA-04** | **A11y (Tiếp cận)** | Vùng chạm một số nút icon đóng/mở nhỏ hơn chuẩn $44 \times 44\text{px}$ | **P3** | **Cao** ($\ge 2$ lần) | **TỰ SỬA** |

---

## 2. Chi Tiết Từng Phát Hiện

### QA-01: Google Sheets API 403 & Thiếu dữ liệu Offline Snapshot Fallback
- **Loại:** Chức năng / Console / Mạng
- **Mức độ:** **P1** (Ảnh hưởng trực tiếp đến chức năng cốt lõi khi chạy local/offline)
- **Độ tin cậy:** **Cao** (Tái hiện 100% trong mọi lần chạy kiểm thử)
- **Vị trí nghi ngờ trong code:**
  - `src/renderer/services/sheets.service.ts:38-87`
  - `src/shared/data/snapshot-fallback.ts:14-18`
- **Mô tả:**
  Khi ứng dụng khởi chạy tại local mà không có `VITE_GOOGLE_API_KEY`, dịch vụ `sheets.service.ts` gửi request tới Google Sheets API v4 với tham số rỗng `?key=`. Máy chủ Google trả về lỗi `403 Forbidden`. Mặc dù dịch vụ có khối `catch` để kích hoạt dữ liệu dự phòng offline, đối tượng `snapshotFallback` trong `src/shared/data/snapshot-fallback.ts` hiện tại chỉ chứa các giá trị `null` (`dictionary: null, quiz: null, chat: null`).
- **Các bước tái hiện:**
  1. Khởi động ứng dụng bằng `npm run dev` (không cung cấp file `.env.local` chứa key).
  2. Mở `http://localhost:3000/`.
  3. Mở Console trình duyệt hoặc kiểm tra ô tìm kiếm từ vựng.
- **Kết quả thực tế vs Mong đợi:**
  - *Thực tế:* Console xuất hiện 3 lỗi đỏ `Error: Google Sheets API error: 403`; giao diện hiện Toast đỏ `Không thể tải dữ liệu từ điển từ máy chủ`; tìm kiếm từ vựng trả về `0 kết quả`; mục Trắc nghiệm và Chatbot không có dữ liệu câu hỏi.
  - *Mong đợi:* Khi không có kết nối Google Sheets hoặc không có key, ứng dụng phải tự động nạp từ điển và câu hỏi từ bản sao lưu tĩnh (offline snapshot) có sẵn để học sinh vẫn tra cứu và học tập bình thường.
- **Bằng chứng:**
  - Console Error: `Failed to load dictionary: Error: Google Sheets API error: 403 at fetchSheetValues (sheets.service.ts:38)`
  - Ảnh chụp: [docs/qa/screenshots/flow-01-home-main.png](file:///c:/Users/umnuar/Downloads/tudien-main/docs/qa/screenshots/flow-01-home-main.png)
- **Nhãn sửa:** **CỔNG DUYỆT** (Cần người dùng duyệt tích hợp bản snapshot dữ liệu chuẩn vào `snapshot-fallback.ts`).

---

### QA-02: Navbar tràn 3 hàng và che khuất tiêu đề trang trên màn hình di động (360px)
- **Loại:** UI / Giao diện Responsive
- **Mức độ:** **P2** (Trải nghiệm người dùng di động bị ảnh hưởng)
- **Độ tin cậy:** **Cao** (Tái hiện 100% trên viewport $\le 480\text{px}$)
- **Vị trí nghi ngờ trong code:**
  - `src/renderer/components/navbar/navbar.html`
  - `src/renderer/styles/` (CSS thanh điều hướng `.navbar` và container)
- **Mô tả:**
  Trên độ phân giải điện thoại nhỏ (360px), thanh điều hướng không sử dụng menu thu gọn hoặc ngăn cách phù hợp; 5 nút bấm menu tràn thành 3 hàng dạng pill, đẩy lùi nội dung và **chèn đè trực tiếp lên phần trên của tiêu đề** `<h1>Tra Cứu Tiếng Xơ Đăng – Tiếng Việt</h1>` khiến tiêu đề bị mất chữ và bố cục bị rối.
- **Các bước tái hiện:**
  1. Mở `http://localhost:3000/`.
  2. Chuyển kích thước cửa sổ/DevTools sang Viewport Mobile: `360 x 640px`.
  3. Quan sát phần đầu trang phía dưới navbar.
- **Kết quả thực tế vs Mong đợi:**
  - *Thực tế:* Tiêu đề trang bị các nút menu che khuất 40% diện tích chiều cao.
  - *Mong đợi:* Navbar cần có khoảng cách an toàn (margin/padding) hoặc thu gọn mượt mà, tiêu đề trang luôn hiển thị rõ ràng, trọn vẹn, không bị đè chữ.
- **Bằng chứng:**
  - Ảnh chụp thực tế: [docs/qa/screenshots/flow-12-mobile-360.png](file:///c:/Users/umnuar/Downloads/tudien-main/docs/qa/screenshots/flow-12-mobile-360.png)
- **Nhãn sửa:** **TỰ SỬA** (Lỗi CSS/giao diện thuần túy, khắc phục bằng cách bổ sung responsive padding/spacing an toàn cho container).

---

### QA-03: Gọi Favicon URL tuyệt đối ra ngoài domain thay vì asset cục bộ
- **Loại:** Console / Mạng / Hiệu năng
- **Mức độ:** **P3** (Thấp)
- **Độ tin cậy:** **Cao**
- **Vị trí nghi ngờ trong code:**
  - `index.html:12`, `src/renderer/`
- **Mô tả:**
  Trang web gửi request tìm kiếm favicon tới URL `https://hoctiengxodang.online/favicon.png` thay vì sử dụng icon cục bộ trong thư mục `public/icons/` đã được định nghĩa trong `manifest.json`. Khi chạy offline hoặc localhost không có internet, request này tạo thêm độ trễ mạng không đáng có.
- **Các bước tái hiện:**
  1. Mở Network tab trên DevTools.
  2. Tải trang `http://localhost:3000/`.
  3. Lọc request theo loại hình ảnh/icon.
- **Kết quả thực tế vs Mong đợi:**
  - *Thực tế:* Trình duyệt gửi request ra ngoài domain internet.
  - *Mong đợi:* Sử dụng favicon nội bộ từ thư mục `public/` (`./icons/icon-192x192.png`).
- **Bằng chứng:**
  - Network log ghi nhận request tới `https://hoctiengxodang.online/favicon.png`
- **Nhãn sửa:** **TỰ SỬA** (Sửa đường dẫn link rel icon trong `index.html`).

---

### QA-04: Vùng chạm nút bấm một số icon nhỏ hơn $44 \times 44\text{px}$
- **Loại:** Khả năng truy cập (A11y / WCAG 2.2 AA)
- **Mức độ:** **P3** (Thấp)
- **Độ tin cậy:** **Cao**
- **Vị trí nghi ngờ trong code:**
  - `src/renderer/features/onboarding/onboarding.html`
  - `src/renderer/features/chat/chat.html`
- **Mô tả:**
  Nút đóng modal hướng dẫn (`#closeOnboardingBtn`) và nút đóng chat (`#closeChatBtn`) có vùng chạm đo được khoảng $32 \times 32\text{px}$, không đạt chuẩn tối thiểu $44 \times 44\text{px}$ cho người dùng thao tác bằng ngón tay trên màn hình cảm ứng theo khuyến nghị WCAG.
- **Các bước tái hiện:**
  1. Kiểm tra kích thước bounding box của các nút đóng modal trên màn hình cảm ứng di động.
- **Kết quả thực tế vs Mong đợi:**
  - *Thực tế:* Nút nhỏ, khó bấm chính xác trên màn hình cảm ứng nhỏ.
  - *Mong đợi:* Nút có `min-width: 44px; min-height: 44px;` hoặc padding mở rộng vùng chạm.
- **Nhãn sửa:** **TỰ SỬA** (Điều chỉnh CSS padding/kích thước).

---

## 3. Các Mục Chưa Tái Hiện Được (Unreproduced Items)
- *Không có.* Tất cả các luồng đã kiểm tra đều có kết quả nhất quán trên 2 lần chạy trình duyệt tự động.
