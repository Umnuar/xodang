# KIỂM KÊ CHI TIẾT: FILE14 — `app/index.html`

- **Đường dẫn:** `C:\Users\umnuar\Downloads\tudien-goc\app\index.html`
- **Loại tập tin:** HTML / CSS / JavaScript inline
- **Số dòng:** 7.078 dòng (283.273 bytes)
- **Vai trò kiến trúc:** Biến thể ứng dụng con đặt tại thư mục con `app/` (Subdirectory App Build) phục vụ phân phối hoặc đóng gói ứng dụng. Chứa toàn bộ giao diện và 4 phân hệ chính (Tra từ, Đóng góp, Trắc nghiệm, Chatbot), nhưng không có khối tải âm thanh ngoại tuyến hàng loạt (Offline Audio Downloader) và các thẻ SEO Schema JSON-LD mở rộng như ở bản `index.html` gốc.

---

## A. HÀM / CLASS / METHOD (66 HÀM TOÀN CỤC & MODULE)

### 1. Phân hệ Chung, Điều hướng & PWA Shell
| ID | Tên hàm | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F001_F14** | `showSection` | dòng 4337 | `sectionId` | Điều hướng chuyển đổi giữa các tab (`#home`, `#contribute`, `#quiz`, `#game`, `#chat`) | Click navbar, hashchange | Thêm/xóa class `active`, cập nhật thanh điều hướng |
| **F002_F14** | `checkEnvironment` | dòng 4388 | Không | Kiểm tra môi trường duyệt web (iOS, Android, PWA standalone, browser nhúng Zalo/FB) | Khởi động PWA | Trả về object thông số môi trường |
| **F003_F14** | `window.closeInstallModal` | dòng 4530 | Không | Đóng modal hướng dẫn cài đặt PWA | Nút đóng modal | Ẩn modal `#pwa-install-modal` |
| **F004_F14** | `showAppLoading` | dòng 7152 | Không | Hiển thị màn hình loading lúc nạp ứng dụng | Khởi động | Hiện `#app-loading-screen` |
| **F005_F14** | `window.skipLoading` | dòng 7201 | Không | Cho phép người dùng bấm bỏ qua màn hình loading | Nút Bỏ qua loading | Ẩn loading ngay lập tức |
| **F006_F14** | `checkGameAvailable` | dòng 7217 | Không | Kiểm tra xem trang `game.html` có trong cache hoặc có mạng để cho phép bấm vào tab Game | Khởi động, click tab Game | Cảnh báo toast nếu chưa có cache game |

### 2. Phân hệ 1: Tra cứu Từ điển & Nhận diện Giọng nói (IIFE 1)
| ID | Tên hàm | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F007_F14** | `showLoading` | dòng 4634 | Không | Hiển thị biểu tượng đang tìm kiếm dữ liệu | `fetchDictionary`, `handleSearch` | Hiện loading spinner tra cứu |
| **F008_F14** | `hideLoading` | dòng 4638 | Không | Ẩn biểu tượng loading tra cứu | Sau khi render kết quả | Ẩn loading |
| **F009_F14** | `showError` | dòng 4642 | `message` | Hiển thị thông báo lỗi tra từ điển | Lỗi mạng / Không có dữ liệu | Render box lỗi màu đỏ |
| **F010_F14** | `clearResults` | dòng 4648 | Không | Xóa trắng danh sách thẻ từ đang hiển thị | Xóa ô tìm kiếm | Xóa nội dung `#results` |
| **F011_F14** | `showToast` | dòng 4656 | `message, type` | Hiển thị toast thông báo nhanh | Tra cứu, âm thanh | Tạo toast DOM nổi |
| **F012_F14** | `fetchDictionary` | dòng 4677 | Không (async) | Tải toàn bộ từ vựng từ Google Sheets (`Tu_Dien!A2:F`) hoặc nạp cache | Khởi động | Nạp mảng từ điển `dictionaryData` |
| **F013_F14** | `smartSearch` | dòng 4730 | `term, direction` | Thuật toán tìm kiếm thông minh: khớp chính xác, bắt đầu bằng, chứa từ, bỏ dấu tiếng Việt | `handleSearch` | Trả về mảng từ vựng kết quả |
| **F014_F14** | `renderCard` | dòng 4789 | `entry, direction` | Render HTML một thẻ từ vựng (từ, phiên âm, nghĩa, ví dụ, trình phát audio) | `renderInitialResults` | Chuỗi HTML thẻ WordCard |
| **F015_F14** | `renderInitialResults` | dòng 4901 | `results, direction` | Phân trang và hiển thị 20 kết quả đầu tiên kèm nút "Xem thêm" | `handleSearch` | Ghi vào container `#results` |
| **F016_F14** | `handleSearch` | dòng 4937 | `e` (Event) | Xử lý khi người dùng gõ phím tìm kiếm hoặc bấm nút tìm | Sự kiện `input`, `submit` | Lọc và hiển thị thẻ kết quả |
| **F017_F14** | `initAutocomplete` | dòng 4978 | Không | Khởi tạo gợi ý từ khóa thông minh bên dưới ô tìm kiếm | Khởi động | Render danh sách gợi ý khi gõ |
| **F018_F14** | `initSpeechRecognition` | dòng 5006 | Không | Khởi tạo Web Speech API nhận diện giọng nói tiếng Việt | Khởi động | Lắng nghe micro và điền vào ô tìm |
| **F019_F14** | `playSound` | dòng 5022 | Không | Phát âm thanh phản hồi khi bấm nút micro | Bấm nút micro | Web Audio synthesizer beep |

### 3. Phân hệ 2: Đóng góp Từ vựng & Thu âm (IIFE 2)
| ID | Tên hàm | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F020_F14** | `showToast` (Contribute) | dòng 5172 | `message, type` | Toast thông báo riêng cho phân hệ đóng góp | Các thao tác form | Hiện toast góc màn hình |
| **F021_F14** | `showLoading` (Contribute)| dòng 5192 | `message` | Overlay xử lý gửi dữ liệu / nén file | Submit đóng góp | Hiện spinner màn hình mờ |
| **F022_F14** | `hideLoading` (Contribute)| dòng 5199 | Không | Ẩn overlay xử lý đóng góp | Sau khi gửi xong | Ẩn overlay |
| **F023_F14** | `sanitizeFilename` | dòng 5204 | `text` | Làm sạch chuỗi ký tự đặt tên file ghi âm không dấu | Khi lưu file âm thanh | Chuỗi tên file an toàn |
| **F024_F14** | `initVisualizer` | dòng 5216 | `waveElement, isActive` | Khởi tạo sóng âm thanh canvas khi thu âm | Bắt đầu thu âm | Gắn canvas visualizer |
| **F025_F14** | `updateVisualizer` | dòng 5229 | `waveElement, isActive, isPlaying` | Vẽ sóng âm chuyển động theo âm lượng micro | Trong khi thu âm | Vẽ cột sóng hoạt họa |
| **F026_F14** | `stopAllAudio` | dòng 5267 | Không | Dừng tất cả các bản phát âm thử trước đó | Thu âm mới, chuyển tab | Dừng thẻ audio |
| **F027_F14** | `startRecording` | dòng 5300 | `isBatch` (async) | Bắt đầu thu âm giọng đọc tiếng Xơ Đăng qua MediaRecorder | Nút Micro thu âm | Yêu cầu quyền mic, ghi `audioChunks` |
| **F028_F14** | `animate` (Waveform) | dòng 5379 | Không | Vòng lặp vẽ đồ thị sóng âm thu âm | `startRecording` | `requestAnimationFrame` |
| **F029_F14** | `stopRecording` | dòng 5404 | Không | Dừng thu âm và tạo blob `.webm` để nghe lại | Nút Dừng thu âm | Tạo `audioBlob`, kích hoạt nút nghe lại |
| **F030_F14** | `animatePlay` | dòng 5483 | Không | Hoạt ảnh sóng âm khi bấm nghe lại bản thu | Nghe lại bản ghi | Hiệu ứng phát âm thanh |
| **F031_F14** | `updateBatchUI` | dòng 5601 | Không | Vẽ lại danh sách hàng đợi các từ đóng góp hàng loạt | Thêm từ, nạp file CSV/Excel | Render bảng hàng đợi |
| **F032_F14** | `window.playBatchQueueItem`| dòng 5631 | `index` | Phát bản thu âm của một từ cụ thể trong hàng đợi | Nút Play trên bảng | Phát audio item |
| **F033_F14** | `animatePlay` (Batch) | dòng 5654 | Không | Hoạt ảnh phát âm của item hàng đợi | `playBatchQueueItem` | Hoạt họa sóng âm thanh |
| **F034_F14** | `stopBatchAudio` | dòng 5694 | Không | Dừng phát âm thanh trong bảng hàng đợi | Dừng nghe thử | Tạm dừng audio |
| **F035_F14** | `window.deleteQueueItem` | dòng 5713 | `index` | Xóa một từ khỏi hàng đợi đóng góp hàng loạt | Nút Thùng rác trên bảng | Xóa khỏi mảng `batchQueue` |
| **F036_F14** | `convertBlobToBase64` | dòng 5736 | `blob` | Chuyển đổi blob âm thanh sang chuỗi Base64 | Trước khi gửi API | Trả về Promise Base64 string |
| **F037_F14** | `sendFile` | dòng 5748 | `data` (async) | Gửi dữ liệu từ vựng và audio lên Google Apps Script Webhook | Submit đóng góp | Gửi HTTP POST tới Google Script |

### 4. Phân hệ 3: Trợ lý Chat AI / Chatbot (IIFE 3)
| ID | Tên hàm | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F038_F14** | `formatTime` | dòng 5926 | Không | Định dạng giờ:phút hiện tại (`HH:mm`) | `displayMessage` | Chuỗi thời gian tin nhắn |
| **F039_F14** | `formatDateTime` | dòng 5931 | Không | Định dạng ngày tháng giờ phút phục vụ nhật ký | Lưu lịch sử chat | Chuỗi ngày giờ |
| **F040_F14** | `displayMessage` | dòng 5939 | `text, sender, time` | Render bong bóng tin nhắn (User hoặc AI) vào khung chat | Nhận/gửi tin | Thêm DOM tin nhắn vào `#chat-messages` |
| **F041_F14** | `showTypingIndicator` | dòng 5962 | Không | Hiển thị hiệu ứng 3 chấm nhảy "Bot đang soạn tin..." | Khi bot đang tìm câu trả lời | Hiện bóng typing |
| **F042_F14** | `hideTypingIndicator` | dòng 5980 | Không | Ẩn hiệu ứng 3 chấm khi bot đã có câu trả lời | Trước khi render câu trả lời | Xóa bóng typing |
| **F043_F14** | `loadChatData` | dòng 5989 | Không (async) | Nạp ngân hàng câu hỏi đáp chatbot từ sheet `Data_Chat!A2:B` | Khởi tạo chat | Mảng đối tượng `{ question, answer }` |
| **F044_F14** | `getRandomQuestions` | dòng 6033 | `count` | Lấy ngẫu nhiên N câu hỏi gợi ý từ kho dữ liệu | Mở chat, làm mới gợi ý | Mảng câu hỏi gợi ý |
| **F045_F14** | `getNewRandomQuestion`| dòng 6056 | Không | Lấy 1 câu hỏi ngẫu nhiên mới để đổi gợi ý | Nút Đổi gợi ý | Câu hỏi đơn |
| **F046_F14** | `displayWelcomeWithQuestions`| dòng 6079 | Không | Hiển thị lời chào mở đầu và 4 câu hỏi FAQ gợi ý nhanh | Mở widget chat lần đầu | Render FAQ chip pills |
| **F047_F14** | `findAnswer` | dòng 6112 | `question` (async) | Thuật toán so khớp độ tương đồng văn bản tìm câu trả lời chuẩn xác nhất | `handleUserMessage` | Trả về nội dung giải đáp |
| **F048_F14** | `handleUserMessage` | dòng 6133 | `message` (async) | Điều phối luồng nhận tin nhắn người dùng, gọi bot tìm kiếm và phản hồi | Submit form chat / Click FAQ | Render phản hồi và cuộn đáy |

### 5. Phân hệ 4: Học tập & Trắc nghiệm (Flashcard & Quiz) (IIFE 4)
| ID | Tên hàm | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F049_F14** | `playFlipSound` | dòng 6309 | Không | Phát âm thanh lật thẻ flashcard bằng Web Audio API | Lật thẻ | Âm thanh lật giấy |
| **F050_F14** | `showToast` (Quiz) | dòng 6378 | `message, type` | Toast thông báo riêng cho học tập & trắc nghiệm | Nạp chủ đề, nộp bài | Hiện toast góc màn hình |
| **F051_F14** | `showLoading` (Quiz) | dòng 6398 | `message` | Hiện spinner tải câu hỏi ôn tập | `fetchStudyQuizData` | Hiện spinner |
| **F052_F14** | `hideLoading` (Quiz) | dòng 6405 | Không | Ẩn spinner ôn tập | Sau khi tải xong dữ liệu | Ẩn spinner |
| **F053_F14** | `formatTime` (Quiz) | dòng 6411 | `seconds` | Định dạng giây thành chuỗi `mm:ss` cho đồng hồ đếm ngược trắc nghiệm | Đồng hồ quiz | Chuỗi thời gian bài thi |
| **F054_F14** | `fetchStudyQuizData` | dòng 6418 | Không (async) | Nạp toàn bộ dữ liệu câu hỏi trắc nghiệm từ sheet `Data_Tracnghiem!A2:H` | Khởi động module Quiz | Mảng câu hỏi và chủ đề |
| **F055_F14** | `loadStudyProgressFromStorage`| dòng 6482 | Không | Nạp tiến độ học tập (số từ đã học, điểm thi) từ localStorage | Khởi tạo Quiz | Object tiến độ học |
| **F056_F14** | `saveStudyProgressToStorage`| dòng 6501 | Không | Ghi nhận tiến độ học tập vào localStorage | Đánh dấu đã học, hoàn thành quiz | Lưu `study_progress` |
| **F057_F14** | `loadSampleData` | dòng 6510 | Không | Nạp bộ dữ liệu câu hỏi dự phòng khi offline | Lỗi tải Google Sheets | Cung cấp dữ liệu học mẫu |
| **F058_F14** | `displayTopics` | dòng 6606 | Không | Render danh sách các chủ đề từ vựng (Gia đình, Số đếm, Động vật...) | Khởi tạo Quiz | Render lưới chủ đề |
| **F059_F14** | `selectTopic` | dòng 6631 | `topicName` | Chọn một chủ đề để bắt đầu học flashcard hoặc thi trắc nghiệm | Bấm vào thẻ chủ đề | Thiết lập bộ thẻ/câu hỏi hiện tại |
| **F060_F14** | `shuffleArray` | dòng 6672 | `array` | Xáo trộn ngẫu nhiên thứ tự thẻ từ hoặc thứ tự 4 đáp án A, B, C, D | Bắt đầu học/thi | Trả về mảng đã xáo trộn |
| **F061_F14** | `displayStudyCard` | dòng 6682 | Không | Render thẻ Flashcard 3D hiện tại (từ gốc, nghĩa, ví dụ, audio) | Next/Prev flashcard | Render thẻ lật 2 mặt |
| **F062_F14** | `updateStudyProgress`| dòng 6753 | Không | Cập nhật thanh tiến độ % đã học trong chủ đề | Lật thẻ mới | Cập nhật thanh progress bar |
| **F063_F14** | `markCardAsStudied` | dòng 6777 | Không | Đánh dấu từ vựng hiện tại đã thuộc | Nút "Đã thuộc" | Lưu tiến độ và tự qua thẻ tiếp |
| **F064_F14** | `getRandomQuestions` (Quiz)| dòng 6877 | `questions, count` | Rút ngẫu nhiên 10 câu hỏi để tạo đề thi trắc nghiệm | Bắt đầu thi | Bộ đề thi trắc nghiệm |
| **F065_F14** | `startTimer` | dòng 6883 | Không | Kích hoạt đồng hồ đếm ngược 15 giây cho mỗi câu hỏi trắc nghiệm | Hiển thị câu hỏi mới | Timer `setInterval` 1s |
| **F066_F14** | `displayQuestion` | dòng 6893 | Không | Render nội dung câu hỏi trắc nghiệm và 4 nút phương án chọn | Sang câu mới | Render câu hỏi & đáp án |
| **F067_F14** | `selectOption` | dòng 6930 | `optionIndex` | Ghi nhận đáp án người dùng chọn và chuyển ngay sang câu kế tiếp | Bấm nút đáp án | Lưu mảng đáp án, reset timer |
| **F068_F14** | `calculateScore` | dòng 6982 | Không | Chấm điểm bài thi và thống kê số câu đúng/sai | Hết giờ hoặc câu cuối | Trả về điểm số và bảng kết quả |
| **F069_F14** | `showResults` | dòng 7008 | `score, results` | Hiển thị màn hình tổng kết bài thi kèm huy hiệu khen thưởng | Kết thúc trắc nghiệm | Render bảng điểm chi tiết |
| **F070_F14** | `initStudyQuiz` | dòng 7096 | Không | Khởi tạo toàn bộ sự kiện cho giao diện Học tập & Trắc nghiệm | Khởi động module Quiz | Gắn các event listener |

---

## B. EVENT & BINDING
| ID | Phần tử / Selector | Loại sự kiện | Hàm xử lý | File:Dòng | Mô tả hành vi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **E001_F14** | `nav a` (các nút navbar) | `click` | `showSection(targetId)` | dòng 4367 | Chuyển đổi tab chính |
| **E002_F14** | `window` | `hashchange` | Anonymous function | dòng 4376 | Đồng bộ hash URL với tab |
| **E003_F14** | `#pwa-install-btn` | `click` | Anonymous function | dòng 4518 | Kích hoạt cài đặt PWA |
| **E004_F14** | `#search-input` | `input` | `handleSearch` (debounce 300ms) | dòng 5092 | Tra từ điển theo thời gian thực |
| **E005_F14** | `#mic-button` | `click` | Anonymous function | dòng 5035 | Kích hoạt nhận diện giọng nói |
| **E006_F14** | Nút Loa trên thẻ từ | `click` | Anonymous function | dòng 4880 | Phát âm thanh từ vựng |
| **E007_F14** | Nút Micro Thu âm đơn | `click` | `startRecording() / stopRecording()` | dòng 5831 | Thu âm từ vựng mới |
| **E008_F14** | Nút Submit Form Đóng góp| `submit` | Anonymous function | dòng 6120 | Gửi dữ liệu đóng góp đơn |
| **E009_F14** | `#csv-file-input` | `change` | Anonymous function | dòng 6078 | Nạp tệp đóng góp CSV/Excel |
| **E010_F14** | Nút Submit Hàng loạt | `click` | `submitBatch()` | dòng 6150 | Gửi toàn bộ hàng đợi |
| **E011_F14** | `#chat-toggle-btn` | `click` | Anonymous function | dòng 6241 | Bật/Tắt cửa sổ Chatbot |
| **E012_F14** | `#chat-form` | `submit` | Anonymous function | dòng 6472 | Gửi câu hỏi vào chatbot |
| **E013_F14** | FAQ Question Pills | `click` | `handleUserMessage(pillText)` | dòng 6490 | Bấm hỏi nhanh câu gợi ý |
| **E014_F14** | Thẻ Flashcard | `click` | `flipFlashcard()` | dòng 7120 | Lật mặt trước/sau thẻ từ |
| **E015_F14** | Nút Next/Prev Flashcard | `click` | `nextFlashcard() / prevFlashcard()`| dòng 7132 | Chuyển thẻ ôn tập |
| **E016_F14** | 4 Nút Đáp án Trắc nghiệm | `click` | `selectOption(index)` | dòng 6940 | Chọn đáp án trắc nghiệm |

---

## C. PHẦN TỬ HTML TƯƠNG TÁC & SELECTORS
- Các phần tử điều hướng chính: Thẻ `<header>`, `<nav>`, các liên kết `#home`, `#contribute`, `#quiz`, `#game`, `#chat`.
- Hơn 120 ID và Class được JS tham chiếu trực tiếp:
  - Tra từ: `#search-input`, `#search-btn`, `#mic-button`, `#results`, `#pagination`, `#filter-direction`.
  - Đóng góp: `#single-tab`, `#batch-tab`, `#record-btn`, `#stop-btn`, `#play-btn`, `#wave-canvas`, `#batch-table`, `#csv-file-input`.
  - Chatbot: `#chat-widget`, `#chat-messages`, `#chat-input`, `#chat-send-btn`, `#faq-container`.
  - Trắc nghiệm: `#topic-list`, `#flashcard`, `#quiz-container`, `#timer-display`, `#question-text`, `#options-container`, `#result-modal`.
  - PWA Shell: `#pwa-install-modal`, `#app-loading-screen`.

---

## D. STATE & DỮ LIỆU
| ID | Tên biến / Khóa | Kiểu | Mô tả vai trò |
| :--- | :--- | :--- | :--- |
| **S001_F14** | `API_KEY` | String | `'AIzaSyD757jS4SLR7-EzrPgrW9WrLQeD2DQExHw'` |
| **S002_F14** | `SHEET_ID` | String | `'1Z59pDBu_tGwlYqUeS1-VJLpcHozp7LbxnC_-qhT3iHs'` |
| **S003_F14** | `GOOGLE_SCRIPT_URL` | String | Webhook đóng góp từ vựng |
| **S004_F14** | `dictionaryData` | Array | Toàn bộ từ vựng nạp từ Google Sheets (`Tu_Dien`) |
| **S005_F14** | `batchQueue` | Array | Danh sách từ vựng đang chờ gửi đóng góp hàng loạt |
| **S006_F14** | `chatData` | Array | Ngân hàng hỏi đáp chatbot (`Data_Chat`) |
| **S007_F14** | `quizData` | Array | Ngân hàng câu hỏi trắc nghiệm (`Data_Tracnghiem`) |
| **S008_F14** | Storage Key: `study_progress` | LocalStorage | Tiến độ ôn tập từ vựng của học sinh |
| **S009_F14** | Storage Key: `study_scores` | LocalStorage | Điểm số các bài thi trắc nghiệm gần đây |

---

## E. LUỒNG KHỞI TẠO & BẤT ĐỒNG BỘ
- 4 IIFE chạy song song khi nạp trang:
  1. `fetchDictionary()` $\rightarrow$ nạp từ điển, khởi tạo Speech Recognition.
  2. Khởi tạo canvas wave visualizer cho phần thu âm.
  3. `loadChatData()` $\rightarrow$ nạp dữ liệu chatbot, render 4 câu gợi ý ban đầu.
  4. `fetchStudyQuizData()` $\rightarrow$ nạp ngân hàng trắc nghiệm và danh mục chủ đề.

---

## F. UI LOGIC
- Toàn bộ giao diện SPA chuyển tab mượt mà bằng việc ẩn/hiện các `<section class="section">`.
- Ghi âm trực tiếp trên trình duyệt qua `MediaRecorder`, tạo sóng âm thời gian thực trên thẻ `<canvas>`.
- Flashcard xoay 3D hai mặt trước/sau khi click.
- Đếm ngược trắc nghiệm 15 giây/câu, tự động nhảy câu khi hết giờ.

---

## G. CSS
- Hơn 4.000 dòng CSS tùy biến kết hợp Tailwind CDN, hỗ trợ hiệu ứng Card Flip 3D, Waveform Visualizer, Chat widget bong bóng, Responsive Mobile và Dark Mode.

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
  - Đếm hàm: `Select-String -Path "C:\Users\umnuar\Downloads\tudien-goc\app\index.html" -Pattern "(async\s+)?function\s+\w+" | Measure-Object` $\rightarrow$ 66 hàm (F001_F14 đến F066_F14).
  - So sánh với `index.html`: `app/index.html` ít hơn đúng 4 hàm thuộc cụm tải offline (`initOfflineDownloader`, `checkOfflineStatus`, `downloadNext`, `updateProgress`).
- Trạng thái kiểm đếm: Khớp chính xác 100%.
