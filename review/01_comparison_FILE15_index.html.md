# BÁO CÁO ĐỐI CHIẾU: FILE15 — `index.html` (MASTER MONOLITH)

- **Tập tin gốc:** `C:\Users\umnuar\Downloads\tudien-goc\index.html` (7.380 dòng)
- **Tập tin mới:** Dự án mới `c:\Users\umnuar\Downloads\tudien-main\` (Kiến trúc phân rã Vite + TypeScript)

---

## BẢNG ĐỐI CHIẾU TỪNG MỤC THEO ID

### 1. Phân hệ Chung, Điều hướng, PWA Shell & SEO
| ID | Tên hàm gốc | Trạng thái | Vị trí file:dòng mới | Ghi chú & Trích đoạn đối chiếu |
| :--- | :--- | :---: | :--- | :--- |
| **F001_F15** | `showSection` | ✅ GIỮ NGUYÊN | `src/renderer/router.ts:15`, `navbar.ts:25` | Điều hướng theo Hash `#home`, `#contribute`, `#quiz`, `#game`, `#chat` |
| **F002_F15** | `checkEnvironment` | ✅ GIỮ NGUYÊN | `src/renderer/components/install-modal/install-modal.ts:15` | Phát hiện iOS/Android/Standalone để hướng dẫn cài đặt |
| **F003_F15** | `window.closeInstallModal` | ✅ GIỮ NGUYÊN | `install-modal.ts:45` | Đóng modal cài đặt PWA |
| **F004_F15** | `showAppLoading` | ✅ GIỮ NGUYÊN | `src/renderer/components/loading-overlay.ts:8` | Hiển thị spinner toàn màn hình |
| **F005_F15** | `window.skipLoading` | ✅ GIỮ NGUYÊN | `loading-overlay.ts:15` | Tự động ẩn khi router mount xong |
| **F006_F15** | `checkGameAvailable` | ✅ GIỮ NGUYÊN | `src/renderer/features/games/games.ts:110` | Kiểm tra sẵn sàng của module game |

### 2. Phân hệ 1: Tra cứu Từ điển, Nhận diện Giọng nói & Tải Ngoại Tuyến (IIFE 1)
| ID | Tên hàm gốc | Trạng thái | Vị trí file:dòng mới | Ghi chú & Trích đoạn đối chiếu |
| :--- | :--- | :---: | :--- | :--- |
| **F007_F15** | `showLoading` | ✅ GIỮ NGUYÊN | `features/home/home.ts:85` | Hiện loading spinner tra cứu |
| **F008_F15** | `hideLoading` | ✅ GIỮ NGUYÊN | `features/home/home.ts:89` | Ẩn loading spinner tra cứu |
| **F009_F15** | `showError` | ✅ GIỮ NGUYÊN | `features/home/home.ts:93` | Thông báo lỗi không tìm thấy từ |
| **F010_F15** | `clearResults` | ✅ GIỮ NGUYÊN | `features/home/home.ts:98` | Xóa danh sách thẻ từ |
| **F011_F15** | `showToast` | ✅ GIỮ NGUYÊN | `src/renderer/components/toast.ts:10` | Toast dùng chung toàn app |
| **F012_F15** | `fetchDictionary` | ✅ GIỮ NGUYÊN | `services/dictionary.service.ts:25` | Nạp từ Sheets API kết hợp cache fallback |
| **F013_F15** | `smartSearch` | ✅ GIỮ NGUYÊN | `services/dictionary.service.ts:50` | Giữ nguyên 100% thuật toán tìm kiếm đa chiều (Pass test `golden-search.test.ts`) |
| **F014_F15** | `renderCard` | ✅ GIỮ NGUYÊN | `features/home/word-card.ts:30` | Render thẻ `WordCard` HTML5 audio cục bộ |
| **F015_F15** | `renderInitialResults` | ✅ GIỮ NGUYÊN | `features/home/home.ts:120` | Phân trang kết quả tra cứu |
| **F016_F15** | `handleSearch` | ✅ GIỮ NGUYÊN | `features/home/home.ts:140` | Xử lý input với debounce 300ms |
| **F017_F15** | `initAutocomplete` | ✅ GIỮ NGUYÊN | `features/home/home.ts:160` | Gợi ý từ khóa thông minh |
| **F018_F15** | `initSpeechRecognition` | ✅ GIỮ NGUYÊN | `services/speech.service.ts:15` | Web Speech API tiếng Việt |
| **F019_F15** | `playSound` (Mic beep) | ✅ GIỮ NGUYÊN | `services/audio.service.ts:75` | Âm thanh bíp Web Audio API |
| **F020_F15** | `initOfflineDownloader` | ❌ THIẾU | Không có trong UI mới | Nút `#btn-download-offline` tải toàn bộ audio vào cache chưa được đưa vào `home.html` |
| **F021_F15** | `checkOfflineStatus` | ❌ THIẾU | Không có trong UI mới | Kiểm tra số lượng audio đã nạp |
| **F022_F15** | `downloadNext` | ❌ THIẾU | Không có trong UI mới | Tải tuần tự file audio vào cache |
| **F023_F15** | `updateProgress` | ❌ THIẾU | Không có trong UI mới | Cập nhật thanh tiến độ tải offline |

### 3. Phân hệ 2: Đóng góp Từ vựng, Ghi âm & Tải tệp (IIFE 2)
| ID | Tên hàm gốc | Trạng thái | Vị trí file:dòng mới | Ghi chú & Trích đoạn đối chiếu |
| :--- | :--- | :---: | :--- | :--- |
| **F024_F15** | `showToast` (Contribute) | ✅ GIỮ NGUYÊN | `components/toast.ts:10` | Sử dụng module Toast dùng chung |
| **F025_F15** | `showLoading` (Contribute)| ✅ GIỮ NGUYÊN | `components/loading-overlay.ts:8` | Lớp phủ tải |
| **F026_F15** | `hideLoading` (Contribute)| ✅ GIỮ NGUYÊN | `components/loading-overlay.ts:12` | Ẩn lớp phủ |
| **F027_F15** | `sanitizeFilename` | ✅ GIỮ NGUYÊN | `features/contribute/contribute.ts:60` | Khử dấu tiếng Việt đặt tên file |
| **F028_F15** | `initVisualizer` | ✅ GIỮ NGUYÊN | `features/contribute/visualizer.ts:10` | Canvas sóng âm MediaStream |
| **F029_F15** | `updateVisualizer` | ✅ GIỮ NGUYÊN | `features/contribute/visualizer.ts:25` | Vẽ sóng âm thanh chuyển động |
| **F030_F15** | `stopAllAudio` | ✅ GIỮ NGUYÊN | `features/contribute/contribute.ts:95` | Dừng âm thanh trước khi thu âm |
| **F031_F15** | `startRecording` | ✅ GIỮ NGUYÊN | `features/contribute/contribute.ts:110` | MediaRecorder ghi âm micro |
| **F032_F15** | `animate` (Waveform) | ✅ GIỮ NGUYÊN | `features/contribute/visualizer.ts:35` | Vòng lặp `requestAnimationFrame` |
| **F033_F15** | `stopRecording` | ✅ GIỮ NGUYÊN | `features/contribute/contribute.ts:150` | Tạo `audioBlob` `.webm` |
| **F034_F15** | `animatePlay` | ✅ GIỮ NGUYÊN | `features/contribute/visualizer.ts:45` | Hoạt ảnh khi nghe lại bản thu |
| **F035_F15** | `updateBatchUI` | ✅ GIỮ NGUYÊN | `features/contribute/contribute.ts:220` | Vẽ bảng hàng đợi đóng góp |
| **F036_F15** | `window.playBatchQueueItem`| ✅ GIỮ NGUYÊN | `features/contribute/contribute.ts:260` | Phát bản ghi của từ trong queue |
| **F037_F15** | `animatePlay` (Batch) | ✅ GIỮ NGUYÊN | `features/contribute/visualizer.ts:50` | Sóng âm cho item hàng đợi |
| **F038_F15** | `stopBatchAudio` | ✅ GIỮ NGUYÊN | `features/contribute/contribute.ts:280` | Dừng nghe thử hàng đợi |
| **F039_F15** | `window.deleteQueueItem` | ✅ GIỮ NGUYÊN | `features/contribute/contribute.ts:295` | Xóa từ khỏi hàng đợi |
| **F040_F15** | `convertBlobToBase64` | ✅ GIỮ NGUYÊN | `features/contribute/contribute.ts:320` | FileReader sang Base64 |
| **F041_F15** | `sendFile` | ✅ GIỮ NGUYÊN | `features/contribute/contribute.ts:340` | POST lên Google Apps Script Webhook kèm lưu hàng đợi offline |

### 4. Phân hệ 3: Trợ lý Chat AI / Chatbot (IIFE 3)
| ID | Tên hàm gốc | Trạng thái | Vị trí file:dòng mới | Ghi chú & Trích đoạn đối chiếu |
| :--- | :--- | :---: | :--- | :--- |
| **F042_F15** | `formatTime` | ✅ GIỮ NGUYÊN | `features/chat/chat.ts:40` | Định dạng giờ tin nhắn |
| **F043_F15** | `formatDateTime` | ✅ GIỮ NGUYÊN | `features/chat/chat.ts:45` | Định dạng ngày giờ |
| **F044_F15** | `displayMessage` | ✅ GIỮ NGUYÊN | `features/chat/chat.ts:55` | Render bong bóng tin nhắn |
| **F045_F15** | `showTypingIndicator` | ✅ GIỮ NGUYÊN | `features/chat/chat.ts:75` | 3 chấm chuyển động bot đang gõ |
| **F046_F15** | `hideTypingIndicator` | ✅ GIỮ NGUYÊN | `features/chat/chat.ts:85` | Xóa 3 chấm khi có phản hồi |
| **F047_F15** | `loadChatData` | ✅ GIỮ NGUYÊN | `services/faq.service.ts:15` | Nạp dữ liệu hỏi đáp từ sheet `Data_Chat` |
| **F048_F15** | `getRandomQuestions` | ✅ GIỮ NGUYÊN | `services/faq.service.ts:35` | Lấy danh sách câu hỏi FAQ ngẫu nhiên |
| **F049_F15** | `getNewRandomQuestion`| ✅ GIỮ NGUYÊN | `features/chat/chat.ts:110` | Đổi câu hỏi gợi ý |
| **F050_F15** | `displayWelcomeWithQuestions`| ✅ GIỮ NGUYÊN | `features/chat/chat.ts:125` | Hiện lời chào kèm 4 pills câu hỏi |
| **F051_F15** | `findAnswer` | ✅ GIỮ NGUYÊN | `services/faq.service.ts:50` | So khớp độ tương đồng văn bản |
| **F052_F15** | `handleUserMessage` | ✅ GIỮ NGUYÊN | `features/chat/chat.ts:145` | Nhận tin nhắn, trả lời, cuộn đáy |

### 5. Phân hệ 4: Học tập & Trắc nghiệm (Flashcard & Quiz) (IIFE 4)
| ID | Tên hàm gốc | Trạng thái | Vị trí file:dòng mới | Ghi chú & Trích đoạn đối chiếu |
| :--- | :--- | :---: | :--- | :--- |
| **F053_F15** | `playFlipSound` | ✅ GIỮ NGUYÊN | `features/quiz/flashcard.ts:30` | Âm thanh lật thẻ Web Audio API |
| **F054_F15** | `showToast` (Quiz) | ✅ GIỮ NGUYÊN | `components/toast.ts:10` | Dùng chung toast |
| **F055_F15** | `showLoading` (Quiz) | ✅ GIỮ NGUYÊN | `features/quiz/quiz.ts:60` | Spinner nạp câu hỏi trắc nghiệm |
| **F056_F15** | `hideLoading` (Quiz) | ✅ GIỮ NGUYÊN | `features/quiz/quiz.ts:65` | Ẩn spinner trắc nghiệm |
| **F057_F15** | `formatTime` (Quiz) | ✅ GIỮ NGUYÊN | `features/quiz/quiz.ts:70` | Format `mm:ss` cho đồng hồ |
| **F058_F15** | `fetchStudyQuizData` | ✅ GIỮ NGUYÊN | `services/quiz.service.ts:20` | Nạp câu hỏi từ `Data_Tracnghiem` |
| **F059_F15** | `loadStudyProgressFromStorage`| ✅ GIỮ NGUYÊN | `features/quiz/quiz.ts:90` | Nạp tiến độ học từ LocalStorage |
| **F060_F15** | `saveStudyProgressToStorage`| ✅ GIỮ NGUYÊN | `features/quiz/quiz.ts:105` | Lưu tiến độ học vào LocalStorage |
| **F061_F15** | `loadSampleData` | ✅ GIỮ NGUYÊN | `services/quiz.service.ts:40` | Nạp dữ liệu mẫu khi offline |
| **F062_F15** | `displayTopics` | ✅ GIỮ NGUYÊN | `features/quiz/quiz.ts:120` | Render danh mục chủ đề học |
| **F063_F15** | `selectTopic` | ✅ GIỮ NGUYÊN | `features/quiz/quiz.ts:140` | Chọn chủ đề học/thi |
| **F064_F15** | `shuffleArray` | ✅ GIỮ NGUYÊN | `features/quiz/quiz.ts:160` | Xáo trộn ngẫu nhiên câu hỏi & đáp án |
| **F065_F15** | `displayStudyCard` | ✅ GIỮ NGUYÊN | `features/quiz/flashcard.ts:50` | Render thẻ Flashcard 3D |
| **F066_F15** | `updateStudyProgress`| ✅ GIỮ NGUYÊN | `features/quiz/flashcard.ts:80` | Thanh tiến độ học từ |
| **F067_F15** | `markCardAsStudied` | ✅ GIỮ NGUYÊN | `features/quiz/flashcard.ts:95` | Đánh dấu đã thuộc từ vựng |
| **F068_F15** | `getRandomQuestions` (Quiz)| ✅ GIỮ NGUYÊN | `features/quiz/quiz.ts:175` | Rút ngẫu nhiên đề thi 10 câu |
| **F069_F15** | `startTimer` | ✅ GIỮ NGUYÊN | `features/quiz/quiz.ts:190` | Đếm ngược 15 giây cho câu hỏi |
| **F070_F15** | `displayQuestion` | ✅ GIỮ NGUYÊN | `features/quiz/quiz.ts:210` | Render câu hỏi và 4 đáp án A-B-C-D |
| **F071_F15** | `selectOption` | ✅ GIỮ NGUYÊN | `features/quiz/quiz.ts:230` | Chọn đáp án, lưu điểm, sang câu mới |
| **F072_F15** | `calculateScore` | ✅ GIỮ NGUYÊN | `features/quiz/quiz.ts:250` | Tính tổng điểm trắc nghiệm |
| **F073_F15** | `showResults` | ✅ GIỮ NGUYÊN | `features/quiz/quiz.ts:265` | Màn hình kết quả và huy hiệu khen thưởng |
| **F074_F15** | `initStudyQuiz` | ✅ GIỮ NGUYÊN | `features/quiz/quiz.ts:30` | Gắn toàn bộ listener phân hệ trắc nghiệm |

---

## C. ĐỐI CHIẾU SEO SCHEMA MARKUP (ĐÃ XÁC MINH TRỰC TIẾP TRONG `index.html`)

1. **`WebApplication` Schema:** `index.html:71-113` $\rightarrow$ ✅ GIỮ NGUYÊN (Khai báo ứng dụng PWA, rating 4.9, tên dự án).
2. **`Course` Schema:** `index.html:115-133` $\rightarrow$ ✅ GIỮ NGUYÊN (Khóa học tiếng Xơ Đăng trực tuyến miễn phí).
3. **`BreadcrumbList` Schema:** `index.html:135-161` $\rightarrow$ ✅ GIỮ NGUYÊN (Cấu trúc phân cấp Trang chủ $\rightarrow$ Từ điển).
4. **`FAQPage` Schema:** `index.html:163-211` $\rightarrow$ ✅ GIỮ NGUYÊN (4 câu hỏi đáp thường gặp cho Google Search Snippets).
5. **`EducationalOrganization` Schema:** `index.html:213-250` $\rightarrow$ ✅ GIỮ NGUYÊN (Trường THCS Chu Văn An).

---

## KẾT LUẬN FILE15
- **Tỷ lệ bảo toàn:** 70/74 hàm (94.6%) ✅ GIỮ NGUYÊN.
- **Điểm khuyết thiếu duy nhất (4 hàm):**
  - Cụm `initOfflineDownloader`, `checkOfflineStatus`, `downloadNext`, `updateProgress` (F020-F023) gắn với nút `#btn-download-offline`. Trong bản mới, âm thanh vẫn được tải on-demand và cache qua Service Worker, nhưng giao diện người dùng không còn nút bấm tải toàn bộ 40MB âm thanh một lần như bản gốc.
- **Toàn bộ 5 khối Schema SEO JSON-LD** quan trọng phục vụ thi KHKT và tối ưu hóa công cụ tìm kiếm đã được bảo toàn 100% trong `index.html`.
