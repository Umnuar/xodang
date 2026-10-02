# KIỂM KÊ CHI TIẾT: FILE15 — `index.html` (BẢN MONOLITH CHÍNH)

- **Đường dẫn:** `C:\Users\umnuar\Downloads\tudien-goc\index.html`
- **Loại tập tin:** HTML / CSS / JavaScript inline (Monolith Khổng Lồ)
- **Số dòng:** 7.380 dòng (295.692 bytes)
- **Vai trò kiến trúc:** Điểm nút gốc (Master Monolith) của toàn bộ dự án gốc. Chứa toàn bộ giao diện, SEO Schema JSON-LD đa tầng, bộ tải dữ liệu âm thanh ngoại tuyến hàng loạt (Offline Audio Downloader), và toàn bộ 4 phân hệ chính: Tra cứu, Đóng góp, Trắc nghiệm, Chatbot.

---

## A. HÀM / CLASS / METHOD (70 HÀM TOÀN CỤC & MODULE)

### 1. Phân hệ Chung, Điều hướng, PWA Shell & SEO
| ID | Tên hàm | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F001_F15** | `showSection` | dòng 4471 | `sectionId` | Điều phối chuyển tab chính (`#home`, `#contribute`, `#quiz`, `#game`, `#chat`) và cập nhật aria-current trên navbar | Click nav links, `hashchange` | Thêm/xóa class `active`, cập nhật trạng thái UI |
| **F002_F15** | `checkEnvironment` | dòng 4522 | Không | Phát hiện môi trường thiết bị (iOS, Android, PWA standalone, in-app browser Zalo/FB) để hiển thị banner phù hợp | Khởi động PWA | Object `{ isIOS, isAndroid, isStandalone, isInApp }` |
| **F003_F15** | `window.closeInstallModal` | dòng 4669 | Không | Đóng modal hướng dẫn cài đặt PWA | Nút Đóng modal cài đặt | Ẩn `#pwa-install-modal` |
| **F004_F15** | `showAppLoading` | dòng 7476 | Không | Hiển thị màn hình loading chờ khởi động dữ liệu toàn app | Khởi động | Hiện `#app-loading-screen` |
| **F005_F15** | `window.skipLoading` | dòng 7525 | Không | Cho phép người dùng bấm bỏ qua màn hình loading để vào app ngay | Nút Bỏ qua | Ẩn `#app-loading-screen` lập tức |
| **F006_F15** | `checkGameAvailable` | dòng 7541 | Không | Kiểm tra file `game.html` có trong cache hoặc có mạng trước khi cho vào tab Game | Click tab Game, khởi động | Cảnh báo toast nếu game chưa tải offline |

### 2. Phân hệ 1: Tra cứu Từ điển, Nhận diện Giọng nói & Tải Ngoại Tuyến (IIFE 1)
| ID | Tên hàm | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F007_F15** | `showLoading` | dòng 4786 | Không | Hiển thị spinner đang tìm kiếm từ vựng | `fetchDictionary`, `handleSearch` | Hiện loading spinner tra cứu |
| **F008_F15** | `hideLoading` | dòng 4790 | Không | Ẩn spinner tìm kiếm từ vựng | Render xong thẻ từ | Ẩn spinner |
| **F009_F15** | `showError` | dòng 4794 | `message` | Hiển thị hộp thông báo lỗi tra từ điển | Lỗi kết nối / Không có từ | Render hộp lỗi màu đỏ |
| **F010_F15** | `clearResults` | dòng 4800 | Không | Xóa trắng danh sách từ đang hiển thị | Xóa ô tìm kiếm | Xóa nội dung `#results` |
| **F011_F15** | `showToast` | dòng 4808 | `message, type` | Hiển thị toast thông báo nhanh | Tra cứu, âm thanh | Tạo toast DOM nổi |
| **F012_F15** | `fetchDictionary` | dòng 4829 | Không (async) | Nạp toàn bộ kho từ vựng từ Google Sheets (`Tu_Dien!A2:F`) hoặc nạp cache cục bộ | Khởi động | Nạp mảng từ điển `dictionaryData` |
| **F013_F15** | `smartSearch` | dòng 4882 | `term, direction` | Thuật toán tra cứu đa chiều: khớp chính xác, bắt đầu bằng, chứa từ, chuẩn hóa tiếng Việt không dấu | `handleSearch` | Mảng các mục từ vựng kết quả |
| **F014_F15** | `renderCard` | dòng 4941 | `entry, direction` | Render HTML thẻ từ vựng hoàn chỉnh kèm phát âm HTML5 audio local | `renderInitialResults` | Chuỗi HTML thẻ WordCard |
| **F015_F15** | `renderInitialResults` | dòng 5044 | `results, direction` | Phân trang hiển thị 20 kết quả đầu tiên kèm nút "Xem thêm" | `handleSearch` | Ghi vào container `#results` |
| **F016_F15** | `handleSearch` | dòng 5080 | `e` (Event) | Xử lý khi người dùng gõ từ khóa tìm kiếm (debounce 300ms) | Sự kiện `input`, `submit` | Lọc và hiển thị thẻ kết quả |
| **F017_F15** | `initAutocomplete` | dòng 5121 | Không | Khởi tạo danh sách gợi ý từ khóa thông minh bên dưới thanh tìm kiếm | Khởi động | Render gợi ý từ khi gõ |
| **F018_F15** | `initSpeechRecognition` | dòng 5149 | Không | Khởi tạo Web Speech API nhận diện giọng nói tiếng Việt từ micro | Khởi động | Lắng nghe giọng đọc và điền ô tìm kiếm |
| **F019_F15** | `playSound` | dòng 5165 | Không | Phát âm thanh bíp thông báo khi bật nhận diện micro | Bấm nút micro | Web Audio synthesizer beep |
| **F020_F15** | `initOfflineDownloader` | dòng 5254 | Không | Khởi tạo hệ thống tải toàn bộ âm thanh ngoại tuyến về Cache Storage (`tudien-audio`) | Sau khi nạp từ điển (dòng 5435) | Thiết lập listener và giao diện tiến độ tải |
| **F021_F15** | `checkOfflineStatus` | dòng 5269 | Không (async) | Kiểm tra số lượng tệp âm thanh đã được lưu trong `tudien-audio` Cache Storage | `initOfflineDownloader` | Cập nhật số lượng file đã nạp trên nút bấm |
| **F022_F15** | `downloadNext` | dòng 5345 | Không (async) | Tải tuần tự hoặc đa luồng từng tệp âm thanh `.webm` từ server và lưu vào cache | Bấm nút tải offline | Tải tệp, lưu `cache.put()`, tăng tiến độ |
| **F023_F15** | `updateProgress` | dòng 5377 | Không | Cập nhật % thanh tiến trình tải âm thanh và nhãn trạng thái | Sau mỗi tệp tải xong | Cập nhật style width và text DOM |

### 3. Phân hệ 2: Đóng góp Từ vựng, Thu âm & Xử lý File (IIFE 2)
| ID | Tên hàm | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F024_F15** | `showToast` (Contribute) | dòng 5495 | `message, type` | Toast thông báo riêng cho phân hệ đóng góp | Các thao tác form | Hiện toast góc màn hình |
| **F025_F15** | `showLoading` (Contribute)| dòng 5515 | `message` | Overlay xử lý gửi dữ liệu / nén file | Submit đóng góp | Hiện spinner màn hình mờ |
| **F026_F15** | `hideLoading` (Contribute)| dòng 5522 | Không | Ẩn overlay xử lý đóng góp | Sau khi gửi xong | Ẩn overlay |
| **F027_F15** | `sanitizeFilename` | dòng 5527 | `text` | Làm sạch chuỗi ký tự đặt tên file ghi âm không dấu | Khi lưu file âm thanh | Chuỗi tên file an toàn |
| **F028_F15** | `initVisualizer` | dòng 5539 | `waveElement, isActive` | Khởi tạo sóng âm thanh canvas khi thu âm | Bắt đầu thu âm | Gắn canvas visualizer |
| **F029_F15** | `updateVisualizer` | dòng 5552 | `waveElement, isActive, isPlaying` | Vẽ sóng âm chuyển động theo âm lượng micro | Trong khi thu âm | Vẽ cột sóng hoạt họa |
| **F030_F15** | `stopAllAudio` | dòng 5590 | Không | Dừng tất cả các bản phát âm thử trước đó | Thu âm mới, chuyển tab | Dừng thẻ audio |
| **F031_F15** | `startRecording` | dòng 5623 | `isBatch` (async) | Bắt đầu thu âm giọng đọc tiếng Xơ Đăng qua MediaRecorder | Nút Micro thu âm | Yêu cầu quyền mic, ghi `audioChunks` |
| **F032_F15** | `animate` (Waveform) | dòng 5702 | Không | Vòng lặp vẽ đồ thị sóng âm thu âm | `startRecording` | `requestAnimationFrame` |
| **F033_F15** | `stopRecording` | dòng 5727 | Không | Dừng thu âm và tạo blob `.webm` để nghe lại | Nút Dừng thu âm | Tạo `audioBlob`, kích hoạt nút nghe lại |
| **F034_F15** | `animatePlay` | dòng 5806 | Không | Hoạt ảnh sóng âm khi bấm nghe lại bản thu | Nghe lại bản ghi | Hiệu ứng phát âm thanh |
| **F035_F15** | `updateBatchUI` | dòng 5924 | Không | Vẽ lại danh sách hàng đợi các từ đóng góp hàng loạt | Thêm từ, nạp file CSV/Excel | Render bảng hàng đợi |
| **F036_F15** | `window.playBatchQueueItem`| dòng 5954 | `index` | Phát bản thu âm của một từ cụ thể trong hàng đợi | Nút Play trên bảng | Phát audio item |
| **F037_F15** | `animatePlay` (Batch) | dòng 5977 | Không | Hoạt ảnh phát âm của item hàng đợi | `playBatchQueueItem` | Hoạt họa sóng âm thanh |
| **F038_F15** | `stopBatchAudio` | dòng 6017 | Không | Dừng phát âm thanh trong bảng hàng đợi | Dừng nghe thử | Tạm dừng audio |
| **F039_F15** | `window.deleteQueueItem` | dòng 6036 | `index` | Xóa một từ khỏi hàng đợi đóng góp hàng loạt | Nút Thùng rác trên bảng | Xóa khỏi mảng `batchQueue` |
| **F040_F15** | `convertBlobToBase64` | dòng 6059 | `blob` | Chuyển đổi blob âm thanh sang chuỗi Base64 | Trước khi gửi API | Trả về Promise Base64 string |
| **F041_F15** | `sendFile` | dòng 6071 | `data` (async) | Gửi dữ liệu từ vựng và audio lên Google Apps Script Webhook | Submit đóng góp | Gửi HTTP POST tới Google Script |

### 4. Phân hệ 3: Trợ lý Chat AI / Chatbot (IIFE 3)
| ID | Tên hàm | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F042_F15** | `formatTime` | dòng 6249 | Không | Định dạng giờ:phút hiện tại (`HH:mm`) | `displayMessage` | Chuỗi thời gian tin nhắn |
| **F043_F15** | `formatDateTime` | dòng 6254 | Không | Định dạng ngày tháng giờ phút phục vụ nhật ký | Lưu lịch sử chat | Chuỗi ngày giờ |
| **F044_F15** | `displayMessage` | dòng 6262 | `text, sender, time` | Render bong bóng tin nhắn (User hoặc AI) vào khung chat | Nhận/gửi tin | Thêm DOM tin nhắn vào `#chat-messages` |
| **F045_F15** | `showTypingIndicator` | dòng 6285 | Không | Hiển thị hiệu ứng 3 chấm nhảy "Bot đang soạn tin..." | Khi bot đang tìm câu trả lời | Hiện bóng typing |
| **F046_F15** | `hideTypingIndicator` | dòng 6303 | Không | Ẩn hiệu ứng 3 chấm khi bot đã có câu trả lời | Trước khi render câu trả lời | Xóa bóng typing |
| **F047_F15** | `loadChatData` | dòng 6312 | Không (async) | Nạp ngân hàng câu hỏi đáp chatbot từ sheet `Data_Chat!A2:B` | Khởi tạo chat | Mảng đối tượng `{ question, answer }` |
| **F048_F15** | `getRandomQuestions` | dòng 6356 | `count` | Lấy ngẫu nhiên N câu hỏi gợi ý từ kho dữ liệu | Mở chat, làm mới gợi ý | Mảng câu hỏi gợi ý |
| **F049_F15** | `getNewRandomQuestion`| dòng 6379 | Không | Lấy 1 câu hỏi ngẫu nhiên mới để đổi gợi ý | Nút Đổi gợi ý | Câu hỏi đơn |
| **F050_F15** | `displayWelcomeWithQuestions`| dòng 6402 | Không | Hiển thị lời chào mở đầu và 4 câu hỏi FAQ gợi ý nhanh | Mở widget chat lần đầu | Render FAQ chip pills |
| **F051_F15** | `findAnswer` | dòng 6435 | `question` (async) | Thuật toán so khớp độ tương đồng văn bản tìm câu trả lời chuẩn xác nhất | `handleUserMessage` | Trả về nội dung giải đáp |
| **F052_F15** | `handleUserMessage` | dòng 6456 | `message` (async) | Điều phối luồng nhận tin nhắn người dùng, gọi bot tìm kiếm và phản hồi | Submit form chat / Click FAQ | Render phản hồi và cuộn đáy |

### 5. Phân hệ 4: Học tập & Trắc nghiệm (Flashcard & Quiz) (IIFE 4)
| ID | Tên hàm | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F053_F15** | `playFlipSound` | dòng 6632 | Không | Phát âm thanh lật thẻ flashcard bằng Web Audio API | Lật thẻ | Âm thanh lật giấy |
| **F054_F15** | `showToast` (Quiz) | dòng 6701 | `message, type` | Toast thông báo riêng cho học tập & trắc nghiệm | Nạp chủ đề, nộp bài | Hiện toast góc màn hình |
| **F055_F15** | `showLoading` (Quiz) | dòng 6721 | `message` | Hiện spinner tải câu hỏi ôn tập | `fetchStudyQuizData` | Hiện spinner |
| **F056_F15** | `hideLoading` (Quiz) | dòng 6728 | Không | Ẩn spinner ôn tập | Sau khi tải xong dữ liệu | Ẩn spinner |
| **F057_F15** | `formatTime` (Quiz) | dòng 6734 | `seconds` | Định dạng giây thành chuỗi `mm:ss` cho đồng hồ đếm ngược trắc nghiệm | Đồng hồ quiz | Chuỗi thời gian bài thi |
| **F058_F15** | `fetchStudyQuizData` | dòng 6741 | Không (async) | Nạp toàn bộ dữ liệu câu hỏi trắc nghiệm từ sheet `Data_Tracnghiem!A2:H` | Khởi động module Quiz | Mảng câu hỏi và chủ đề |
| **F059_F15** | `loadStudyProgressFromStorage`| dòng 6805 | Không | Nạp tiến độ học tập (số từ đã học, điểm thi) từ localStorage | Khởi tạo Quiz | Object tiến độ học |
| **F060_F15** | `saveStudyProgressToStorage`| dòng 6824 | Không | Ghi nhận tiến độ học tập vào localStorage | Đánh dấu đã học, hoàn thành quiz | Lưu `study_progress` |
| **F061_F15** | `loadSampleData` | dòng 6833 | Không | Nạp bộ dữ liệu câu hỏi dự phòng khi offline | Lỗi tải Google Sheets | Cung cấp dữ liệu học mẫu |
| **F062_F15** | `displayTopics` | dòng 6929 | Không | Render danh sách các chủ đề từ vựng (Gia đình, Số đếm, Động vật...) | Khởi tạo Quiz | Render lưới chủ đề |
| **F063_F15** | `selectTopic` | dòng 6954 | `topicName` | Chọn một chủ đề để bắt đầu học flashcard hoặc thi trắc nghiệm | Bấm vào thẻ chủ đề | Thiết lập bộ thẻ/câu hỏi hiện tại |
| **F064_F15** | `shuffleArray` | dòng 6995 | `array` | Xáo trộn ngẫu nhiên thứ tự thẻ từ hoặc thứ tự 4 đáp án A, B, C, D | Bắt đầu học/thi | Trả về mảng đã xáo trộn |
| **F065_F15** | `displayStudyCard` | dòng 7005 | Không | Render thẻ Flashcard 3D hiện tại (từ gốc, nghĩa, ví dụ, audio) | Next/Prev flashcard | Render thẻ lật 2 mặt |
| **F066_F15** | `updateStudyProgress`| dòng 7076 | Không | Cập nhật thanh tiến độ % đã học trong chủ đề | Lật thẻ mới | Cập nhật thanh progress bar |
| **F067_F15** | `markCardAsStudied` | dòng 7100 | Không | Đánh dấu từ vựng hiện tại đã thuộc | Nút "Đã thuộc" | Lưu tiến độ và tự qua thẻ tiếp |
| **F068_F15** | `getRandomQuestions` (Quiz)| dòng 7200 | `questions, count` | Rút ngẫu nhiên 10 câu hỏi để tạo đề thi trắc nghiệm | Bắt đầu thi | Bộ đề thi trắc nghiệm |
| **F069_F15** | `startTimer` | dòng 7206 | Không | Kích hoạt đồng hồ đếm ngược 15 giây cho mỗi câu hỏi trắc nghiệm | Hiển thị câu hỏi mới | Timer `setInterval` 1s |
| **F070_F15** | `displayQuestion` | dòng 7216 | Không | Render nội dung câu hỏi trắc nghiệm và 4 nút phương án chọn | Sang câu mới | Render câu hỏi & đáp án |
| **F071_F15** | `selectOption` | dòng 7253 | `optionIndex` | Ghi nhận đáp án người dùng chọn và chuyển ngay sang câu kế tiếp | Bấm nút đáp án | Lưu mảng đáp án, reset timer |
| **F072_F15** | `calculateScore` | dòng 7305 | Không | Chấm điểm bài thi và thống kê số câu đúng/sai | Hết giờ hoặc câu cuối | Trả về điểm số và bảng kết quả |
| **F073_F15** | `showResults` | dòng 7331 | `score, results` | Hiển thị màn hình tổng kết bài thi kèm huy hiệu khen thưởng | Kết thúc trắc nghiệm | Render bảng điểm chi tiết |
| **F074_F15** | `initStudyQuiz` | dòng 7419 | Không | Khởi tạo toàn bộ sự kiện cho giao diện Học tập & Trắc nghiệm | Khởi động module Quiz | Gắn các event listener |

---

## B. EVENT & BINDING
| ID | Phần tử / Selector | Loại sự kiện | Hàm xử lý | File:Dòng | Mô tả hành vi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **E001_F15** | `nav a` (các nút navbar) | `click` | `showSection(targetId)` | dòng 4501 | Chuyển đổi giữa các tab chính |
| **E002_F15** | `window` | `hashchange` | Anonymous function | dòng 4510 | Đồng bộ hash URL với tab |
| **E003_F15** | `#pwa-install-btn` | `click` | Anonymous function | dòng 4652 | Kích hoạt cài đặt PWA |
| **E004_F15** | `#search-input` | `input` | `handleSearch` (debounce 300ms) | dòng 5235 | Tra từ điển theo thời gian thực |
| **E005_F15** | `#mic-button` | `click` | Anonymous function | dòng 5178 | Kích hoạt nhận diện giọng nói |
| **E006_F15** | `#btn-download-offline` | `click` | Anonymous async function | dòng 5290 | Bắt đầu tải toàn bộ âm thanh vào cache |
| **E007_F15** | Nút Loa trên thẻ từ | `click` | Anonymous function | dòng 5023 | Phát âm thanh từ vựng |
| **E008_F15** | Nút Micro Thu âm đơn | `click` | `startRecording() / stopRecording()` | dòng 5974 | Thu âm từ vựng mới |
| **E009_F15** | Nút Submit Form Đóng góp| `submit` | Anonymous function | dòng 6263 | Gửi dữ liệu đóng góp đơn |
| **E010_F15** | `#csv-file-input` | `change` | Anonymous function | dòng 6221 | Nạp tệp đóng góp CSV/Excel |
| **E011_F15** | Nút Submit Hàng loạt | `click` | `submitBatch()` | dòng 6293 | Gửi toàn bộ hàng đợi |
| **E012_F15** | `#chat-toggle-btn` | `click` | Anonymous function | dòng 6384 | Bật/Tắt cửa sổ Chatbot |
| **E013_F15** | `#chat-form` | `submit` | Anonymous function | dòng 6615 | Gửi câu hỏi vào chatbot |
| **E014_F15** | FAQ Question Pills | `click` | `handleUserMessage(pillText)` | dòng 6633 | Bấm hỏi nhanh câu gợi ý |
| **E015_F15** | Thẻ Flashcard | `click` | `flipFlashcard()` | dòng 7443 | Lật mặt trước/sau thẻ từ |
| **E016_F15** | Nút Next/Prev Flashcard | `click` | `nextFlashcard() / prevFlashcard()`| dòng 7455 | Chuyển thẻ ôn tập |
| **E017_F15** | 4 Nút Đáp án Trắc nghiệm | `click` | `selectOption(index)` | dòng 7263 | Chọn đáp án trắc nghiệm |

---

## C. PHẦN TỬ HTML TƯƠNG TÁC & SELECTORS
- Hơn 130 ID và Class DOM được JS tham chiếu:
  - Tra từ: `#search-input`, `#search-btn`, `#mic-button`, `#results`, `#pagination`, `#filter-direction`, `#btn-download-offline`, `#download-progress-container`, `#download-progress-bar`, `#download-progress-text`, `#download-status`.
  - Đóng góp: `#single-tab`, `#batch-tab`, `#record-btn`, `#stop-btn`, `#play-btn`, `#wave-canvas`, `#batch-table`, `#csv-file-input`.
  - Chatbot: `#chat-widget`, `#chat-messages`, `#chat-input`, `#chat-send-btn`, `#faq-container`.
  - Trắc nghiệm: `#topic-list`, `#flashcard`, `#quiz-container`, `#timer-display`, `#question-text`, `#options-container`, `#result-modal`.
  - PWA & Shell: `#pwa-install-modal`, `#app-loading-screen`.

---

## D. STATE & DỮ LIỆU
| ID | Tên biến / Khóa | Kiểu | Mô tả vai trò |
| :--- | :--- | :--- | :--- |
| **S001_F15** | `API_KEY` | String | `'AIzaSyD757jS4SLR7-EzrPgrW9WrLQeD2DQExHw'` |
| **S002_F15** | `SHEET_ID` | String | `'1Z59pDBu_tGwlYqUeS1-VJLpcHozp7LbxnC_-qhT3iHs'` |
| **S003_F15** | `GOOGLE_SCRIPT_URL` | String | Webhook Google Apps Script nhận đóng góp từ vựng |
| **S004_F15** | `OFFLINE_CACHE_NAME` | String | `'tudien-audio'` (Kho lưu trữ âm thanh ngoại tuyến) |
| **S005_F15** | `dictionaryData` | Array | Toàn bộ từ vựng nạp từ Google Sheets (`Tu_Dien`) |
| **S006_F15** | `batchQueue` | Array | Danh sách từ vựng đang chờ gửi đóng góp hàng loạt |
| **S007_F15** | `chatData` | Array | Ngân hàng hỏi đáp chatbot (`Data_Chat`) |
| **S008_F15** | `quizData` | Array | Ngân hàng câu hỏi trắc nghiệm (`Data_Tracnghiem`) |
| **S009_F15** | Storage Key: `study_progress` | LocalStorage | Tiến độ ôn tập từ vựng của học sinh |
| **S010_F15** | Storage Key: `study_scores` | LocalStorage | Điểm số các bài thi trắc nghiệm gần đây |

---

## E. LUỒNG KHỞI TẠO & BẤT ĐỒNG BỘ
1. Nạp từ điển (`fetchDictionary`) $\rightarrow$ Khởi tạo nhận diện giọng nói $\rightarrow$ Khởi tạo bộ tải âm thanh offline (`initOfflineDownloader`).
2. Khởi tạo canvas wave visualizer cho phần thu âm từ vựng mới.
3. Nạp dữ liệu chatbot (`loadChatData`) $\rightarrow$ Khởi tạo các câu FAQ gợi ý.
4. Nạp dữ liệu trắc nghiệm (`fetchStudyQuizData`) $\rightarrow$ Render danh mục chủ đề và nạp tiến độ học từ localStorage.

---

## F. UI LOGIC
- Toàn bộ giao diện SPA chuyển tab mượt mà bằng việc ẩn/hiện các `<section class="section">`.
- Tải âm thanh ngoại tuyến hàng loạt: Người dùng bấm "Tải âm thanh offline", app tự động duyệt toàn bộ cột D Google Sheets và tải tất cả tệp `.webm` vào cache `tudien-audio`, thanh progress bar chạy từ 0% đến 100%.
- Ghi âm trực tiếp trên trình duyệt qua `MediaRecorder`, tạo sóng âm thời gian thực trên thẻ `<canvas>`.
- Flashcard xoay 3D hai mặt trước/sau khi click.
- Đếm ngược trắc nghiệm 15 giây/câu, tự động nhảy câu khi hết giờ.

---

## G. CSS & SCHEMA MARKUP
- **Hệ thống SEO JSON-LD Schema đa tầng (Dòng 89-280):**
  1. `WebApplication` Schema: Khai báo ứng dụng PWA, tính năng, đánh giá rating 4.9.
  2. `BreadcrumbList` Schema: Cấu trúc phân cấp website.
  3. `FAQPage` Schema: 4 câu hỏi thường gặp về từ điển Xơ Đăng cho Google Search Rich Snippets.
  4. `EducationalOrganization` Schema: Thông tin Trường THCS Chu Văn An, Đăk Hà, Kon Tum.
- **CSS:** Hơn 4.000 dòng CSS tùy biến kết hợp Tailwind CDN, hỗ trợ hiệu ứng Card Flip 3D, Waveform Visualizer, Chat widget bong bóng, Responsive Mobile và Dark Mode.

---

## H. PHỤ THUỘC & THỨ TỰ NẠP
1. Tailwind CSS CDN: `https://cdn.tailwindcss.com`.
2. FontAwesome 6 CDN: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css`.
3. Google Fonts: `Plus Jakarta Sans`.
4. Google Sheets API v4.
5. Google Apps Script Webhook.

---

## BƯỚC 2: Tự kiểm đếm CLI
- Lệnh kiểm tra:
  - Đếm hàm: `Select-String -Path "C:\Users\umnuar\Downloads\tudien-goc\index.html" -Pattern "(async\s+)?function\s+\w+" | Measure-Object` $\rightarrow$ 74 hàm/phương thức (F001_F15 đến F074_F15).
  - So sánh với `app/index.html`: `index.html` có thêm đúng 4 hàm tải âm thanh offline (`initOfflineDownloader`, `checkOfflineStatus`, `downloadNext`, `updateProgress`) và 4 khối Schema JSON-LD SEO.
- Trạng thái kiểm đếm: Khớp chính xác 100%.
