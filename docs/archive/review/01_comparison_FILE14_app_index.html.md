# BÁO CÁO ĐỐI CHIẾU: FILE14 — `app/index.html`

- **Tập tin gốc:** `C:\Users\umnuar\Downloads\tudien-goc\app\index.html` (7.078 dòng)
- **Tập tin mới:** Dự án mới `c:\Users\umnuar\Downloads\tudien-main\src\renderer\` (63 modules)

---

## 1. ĐẶC ĐIỂM KIẾN TRÚC & PHÂN TÍCH QUAN HỆ

`app/index.html` là một bản build nhánh (subdirectory distribution) của `index.html` gốc, được tạo ra nhằm mục đích phục vụ chạy trong thư mục con `/app/`.
- **Số lượng hàm trong bản gốc:** 66 hàm/phương thức.
- **Sự khác biệt cốt lõi với `index.html` gốc:** Không có khối tải âm thanh ngoại tuyến hàng loạt (`initOfflineDownloader` gồm 4 hàm) và không có các thẻ Schema JSON-LD mở rộng.
- **Tình trạng đối chiếu với dự án mới (`tudien-main`):**
  Trong kiến trúc mới, toàn bộ 4 phân hệ Tra cứu, Đóng góp, Trắc nghiệm, Chatbot và Shell điều hướng đã được chuẩn hóa và hội tụ thành một kiến trúc duy nhất tại `src/renderer/`. Vì vậy, mọi chức năng có mặt trong `app/index.html` đều được ánh xạ trực tiếp sang các module TypeScript tương ứng như trong `FILE15`.

---

## 2. BẢNG ĐỐI CHIẾU TỔNG HỢP THEO PHÂN HỆ

| Phân hệ chức năng | Số hàm gốc | Trạng thái trong `tudien-main` | Vị trí module mới |
| :--- | :---: | :---: | :--- |
| **Shell & Điều hướng** | 6 | ✅ GIỮ NGUYÊN | `src/renderer/main.ts`, `router.ts`, `components/navbar/` |
| **Tra cứu & Nhận diện Giọng nói** | 13 | ✅ GIỮ NGUYÊN | `features/home/home.ts`, `word-card.ts`, `services/dictionary.service.ts`, `services/speech.service.ts` |
| **Đóng góp Từ vựng & Ghi âm** | 18 | ✅ GIỮ NGUYÊN | `features/contribute/contribute.ts`, `visualizer.ts`, `services/offline-sync.service.ts` |
| **Trợ lý Chat AI (FAQ Bot)** | 11 | ✅ GIỮ NGUYÊN | `features/chat/chat.ts`, `services/faq.service.ts` |
| **Học tập & Trắc nghiệm** | 18 | ✅ GIỮ NGUYÊN | `features/quiz/quiz.ts`, `flashcard.ts`, `services/quiz.service.ts` |
| **TỔNG CỘNG** | **66/66** | **HOÀN TOÀN ĐƯỢC CHUYỂN DỜI HỢP NHẤT** | **Kiến trúc mô-đun hóa hiện đại** |

---

## KẾT LUẬN FILE14
- Không có bất kỳ tính năng nghiệp vụ nào của `app/index.html` bị thất lạc trong quá trình refactor.
- Việc loại bỏ bản sao tĩnh phân mảnh `app/index.html` để quy tụ về một SPA duy nhất chạy qua Vite và Electron là một bước đi tái cấu trúc đúng đắn và chuẩn mực.
