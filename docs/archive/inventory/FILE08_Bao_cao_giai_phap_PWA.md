# KIỂM KÊ CHI TIẾT: FILE08 — `Bao_cao_giai_phap_PWA.md`

- **Đường dẫn:** `C:\Users\umnuar\Downloads\tudien-goc\Bao_cao_giai_phap_PWA.md`
- **Loại tập tin:** Tài liệu kỹ thuật / Báo cáo giải pháp PWA Offline Âm thanh
- **Số dòng:** 312 dòng (11.804 bytes)

---

## A. HÀM / CLASS / METHOD
*(Script phụ trợ trong tài liệu: Google Apps Script tải âm thanh từ Drive)*
| ID | Tên hàm | File:Dòng tham chiếu | Tham số | Mô tả một câu | Nơi gọi / Kích hoạt | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F001_F08** | `downloadAllAudioToFolder` | `Bao_cao_giai_phap_PWA.md:74` | Không | Quét cột D của sheet `Tu_Dien` và tải blob âm thanh sang thư mục `GitHub_Audio_Export` với tên `{driveId}.webm` | Chạy thủ công trên Google Apps Script Console | Ghi file vào Google Drive, hiển thị Alert thông báo tiến độ |

## B. EVENT & BINDING
*Không có trong giao diện runtime.*

## C. PHẦN TỬ HTML TƯƠNG TÁC & SELECTORS
| ID | Cấu trúc Markup đề xuất | Selector tham chiếu | Hành vi / Mô tả |
| :--- | :--- | :--- | :--- |
| **B001_F08** | `<audio controls preload="none">` | `.audio-player-container audio` | Trình phát âm thanh HTML5 native thay thế cho `<iframe>` Google Drive |
| **B002_F08** | `<source src="./audio/${driveId}.webm">` | `.audio-player-container source` | Nạp file âm thanh cục bộ theo đường dẫn `./audio/{driveId}.webm` |

## D. STATE & DỮ LIỆU
| ID | Tên cấu hình / Logic | Kiểu | Giá trị / Đường dẫn | Mô tả vai trò |
| :--- | :--- | :--- | :--- | :--- |
| **S001_F08** | Sheet Name | String | `Tu_Dien` | Tên trang tính chứa từ điển và Drive ID tại cột D |
| **S002_F08** | Export Folder Name | String | `GitHub_Audio_Export` | Tên folder Drive lưu trữ các tệp audio tải về |
| **S003_F08** | Local Audio Path Pattern | String Pattern | `./audio/${driveId}.webm` | Cấu trúc định danh tệp âm thanh ngoại tuyến |
| **S004_F08** | SW Version Bump | String | `10.0.0` (từ `9.1.0`) | Phiên bản Service Worker nâng cấp để kích hoạt cache audio |

## E. LUỒNG KHỞI TẠO & BẤT ĐỒNG BỘ
- Apps Script: Thực thi giới hạn thời gian 5 phút (`maxTimeMs = 5 * 60 * 1000`), cơ chế resumable dựa vào `existingFiles` map để tránh tải trùng.
- Audio Preload: `preload="none"` trên thẻ `<audio>` để tối ưu băng thông di động.

## F. UI LOGIC
- Khi click nghe phát âm: Thay thế việc tải iframe Drive (`https://drive.google.com/file/d/{DriveID}/preview`) bằng thẻ `<audio controls>` nạp trực tiếp file tĩnh `.webm` cục bộ.

## G. CSS
- Cung cấp style inline: `style="width:100%; border-radius:8px;"` cho container `.audio-player-container`.

## H. PHỤ THUỘC & THỨ TỰ NẠP
- Phụ thuộc: Thư mục `audio/` trên GitHub Pages và `service-worker.js` phiên bản `10.0.x`.

---

## BƯỚC 2: Tự kiểm đếm CLI
- Lệnh kiểm tra: `Get-Content C:\Users\umnuar\Downloads\tudien-goc\Bao_cao_giai_phap_PWA.md | Measure-Object -Line`
- Kết quả thực tế: 312 dòng.
- Số hàm tài liệu: 1 hàm (F001_F08), 2 phần tử HTML (B001_F08, B002_F08), 4 mục state (S001_F08 đến S004_F08).
- Trạng thái khớp: 100%.
