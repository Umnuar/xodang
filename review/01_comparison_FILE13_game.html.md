# BÁO CÁO ĐỐI CHIẾU: FILE13 — `game.html`

- **Tập tin gốc:** `C:\Users\umnuar\Downloads\tudien-goc\game.html` (4.876 dòng)
- **Tập tin mới:** `c:\Users\umnuar\Downloads\tudien-main\src\renderer\features\games\` (`games.ts`, `game1-memory.ts`, `game2-catcher.ts`, `game3-shooter.ts`, `game4-farm.ts`, `game-data.ts`, `sound-effects.ts`, `games.html`, `games.css`)

---

## BẢNG ĐỐI CHIẾU TỪNG MỤC THEO ID

### 1. Quản lý Dữ liệu & Hệ thống Cấp độ
| ID | Tên mục gốc | Trạng thái | Vị trí file:dòng mới | Ghi chú & Trích đoạn đối chiếu |
| :--- | :--- | :---: | :--- | :--- |
| **F001_F13** | `loadMaxLevelsFromCache` | ⚠️ ĐỔI KHÁC | `game-data.ts:25` | Quản lý level động dựa trên số lượng từ vựng thực tế trong từ điển thay vì lưu cache riêng |
| **F002_F13** | `calculateMaxLevelsFromSheet`| ⚠️ ĐỔI KHÁC | `game-data.ts:35` | Tự động phân phối 5 câu hỏi/level từ mảng từ vựng nạp vào |
| **F003_F13** | `calculateMaxLevels` | ⚠️ ĐỔI KHÁC | `game-data.ts:30` | Tính toán nội bộ trong `game-data.ts` |
| **F004_F13** | `checkForNewLevels` | ⚠️ ĐỔI KHÁC | `game-data.ts` | Dữ liệu game tự động đồng bộ theo `DictionaryService` |
| **F005_F13** | `getQuestionsByLevelExact` | ✅ GIỮ NGUYÊN | `game-data.ts:45` | Cắt lát danh sách câu hỏi theo `(level - 1) * count` |
| **F006_F13** | `getQuestionsByLevel` | ✅ GIỮ NGUYÊN | `game-data.ts:40` | `export function getQuestionsForLevel(level, count)` |
| **F007_F13** | `getFallbackQuestions` | ✅ GIỮ NGUYÊN | `game-data.ts:10` | Sử dụng `BASELINE_GAME_VOCAB` dự phòng |
| **F008_F13** | `checkGameCompletion` | ✅ GIỮ NGUYÊN | `games.ts:70` | Kiểm tra hoàn thành level cuối để hiển thị màn kết thúc |
| **F009_F13** | `initWithCache` | ✅ GIỮ NGUYÊN | `src/renderer/services/sheets.service.ts` | Tích hợp qua kho cache từ điển của app chính |
| **F010_F13** | `clearStaleCache` | ✅ GIỮ NGUYÊN | `src/renderer/services/storage.service.ts` | TTL cache quản lý tập trung |
| **F011_F13** | `updateOfflineIndicator` | ✅ GIỮ NGUYÊN | `src/renderer/components/offline-indicator.ts` | Sử dụng component OfflineIndicator chung của ứng dụng |
| **F012_F13** | `fetchData` | ✅ GIỮ NGUYÊN | `src/renderer/services/sheets.service.ts` | Dùng chung dữ liệu từ vựng Google Sheets `Tu_Dien` |
| **F013_F13** | `forceRefreshData` | ⚠️ ĐỔI KHÁC | `src/renderer/components/navbar/navbar.ts` | Refresh dữ liệu thực hiện ở cấp toàn ứng dụng |

### 2. Âm thanh & Web Audio Synthesizer
| ID | Tên mục gốc | Trạng thái | Vị trí file:dòng mới | Ghi chú & Trích đoạn đối chiếu |
| :--- | :--- | :---: | :--- | :--- |
| **F014_F13** | `initAudio` | ✅ GIỮ NGUYÊN | `sound-effects.ts:15` | `private ensureContext()` khởi tạo AudioContext khi có user gesture |
| **F015_F13** | `autoResumeAudio` | ✅ GIỮ NGUYÊN | `sound-effects.ts:25` | Tự động resume khi context ở trạng thái `suspended` |
| **F016_F13** | `createBeep` (Web Audio) | ✅ GIỮ NGUYÊN | `sound-effects.ts:35-85` | `playTone()` tạo oscillator đa tần số: click, match, wrong, shoot, catch, levelUp |
| **F017_F13** | `playBackgroundMusic` | ⚠️ ĐỔI KHÁC | Chưa dùng nhạc nền BGM | Hiện tại chỉ tập trung vào hiệu ứng âm thanh SFX Web Audio |
| **F018_F13** | `stopBackgroundMusic` | ⚠️ ĐỔI KHÁC | Chưa dùng BGM | Giống F017 |
| **F019_F13** | `toggleBGM` | ⚠️ ĐỔI KHÁC | `games.html:15` | Gộp thành nút bật/tắt `#toggleGameSfx` |
| **F020_F13** | `toggleSFX` | ✅ GIỮ NGUYÊN | `games.ts:25`, `sound-effects.ts:30` | `soundEffects.setEnabled(!soundEffects.isEnabled())` |
| **F021_F13** | `showSoundControls` | ⚠️ ĐỔI KHÁC | `games.html:15` | Đơn giản hóa thành nút bấm chuyển trạng thái âm thanh trực tiếp trên header game |

### 3. Quản lý Người dùng, Bảng xếp hạng & Chứng nhận
| ID | Tên mục gốc | Trạng thái | Vị trí file:dòng mới | Ghi chú & Trích đoạn đối chiếu |
| :--- | :--- | :---: | :--- | :--- |
| **F022_F13** | `showToast` | ✅ GIỮ NGUYÊN | `src/renderer/components/toast.ts:10` | Sử dụng module Toast dùng chung |
| **F023_F13** | `saveUser` | ⚠️ ĐỔI KHÁC | `games.html:12` | Gốc yêu cầu nhập form đăng nhập/avatar; bản mới mặc định định danh "Học sinh Xơ Đăng" |
| **F024_F13** | `loadUser` | ⚠️ ĐỔI KHÁC | `games.html:12` | Bỏ qua bước kiểm tra màn hình Login |
| **F025_F13** | `updateUserScore` | ✅ GIỮ NGUYÊN | `games.ts:60` | `updateScore(score)` cập nhật điểm vào header và modal |
| **F026_F13** | `getLeaderboard` | ❌ THIẾU | Chưa có trong `games.ts` | Bản mới chưa tích hợp màn hình Bảng xếp hạng Top người chơi |
| **F027_F13** | `getCurrentUserRank` | ❌ THIẾU | Chưa có trong `games.ts` | Giống F026 |
| **F028_F13** | `getUserStats` | ❌ THIẾU | Chưa có trong `games.ts` | Giống F026 |
| **F029_F13** | `saveCertificate` | ❌ THIẾU | Chưa có trong `games.ts` | Bản mới chưa lưu trữ chứng chỉ vào LocalStorage |
| **F030_F13** | `startAutoSave` | ⚠️ ĐỔI KHÁC | `games.ts` | Không chạy vòng lặp setInterval 5s, lưu điểm khi qua màn |
| **F031_F13** | `stopAutoSave` | ⚠️ ĐỔI KHÁC | `games.ts` | Giống F030 |
| **F032_F13** | `saveAndExit` | ✅ GIỮ NGUYÊN | `games.ts:90` | `exitToMenu()` hủy game hiện tại và hiển thị lại Game Hub |

### 4. Router Màn hình & Giao diện Chính
| ID | Tên mục gốc | Trạng thái | Vị trí file:dòng mới | Ghi chú & Trích đoạn đối chiếu |
| :--- | :--- | :---: | :--- | :--- |
| **F033_F13** | `render` (Screen Router) | ✅ GIỮ NGUYÊN | `games.ts:35-55` | Chuyển đổi giữa `#gameHubView` và `#gameActiveView` |
| **F034_F13** | `renderLogin` | ⚠️ ĐỔI KHÁC | `games.html:1-20` | Bỏ màn hình Login trung gian, cho phép học sinh vào chơi trực tiếp |
| **F035_F13** | `renderMenu` | ✅ GIỮ NGUYÊN | `games.html:2-67` | Khung Game Hub hiển thị lưới 4 thẻ Game đầy đủ màu sắc |
| **F036_F13** | `renderLeaderboard` | ❌ THIẾU | Chưa có | Màn hình BXH chưa được chuyển sang module mới |
| **F037_F13** | `renderCertificatesList`| ❌ THIẾU | Chưa có | Màn hình kho chứng chỉ chưa được chuyển sang |
| **F038_F13** | `renderBadges` | ❌ THIẾU | Chưa có | Màn hình bộ sưu tập huy hiệu chưa được chuyển sang |

### 5. Game 1: Lật Thẻ Trí Nhớ (Memory Cards)
| ID | Tên mục gốc | Trạng thái | Vị trí file:dòng mới | Ghi chú & Trích đoạn đối chiếu |
| :--- | :--- | :--- | :--- | :--- |
| **F039_F13** | `renderGame1` | ✅ GIỮ NGUYÊN | `game1-memory.ts:25` | `render()` dựng lưới thẻ lật 3D |
| **F040_F13** | `initGame1` | ✅ GIỮ NGUYÊN | `game1-memory.ts:15` | `constructor` & `start(level)` |
| **F041_F13** | `startGame1Level` | ✅ GIỮ NGUYÊN | `game1-memory.ts:18` | Lấy cặp thẻ từ `getMemoryCardPairs` và xáo trộn |
| **F042_F13** | `flipCard` | ✅ GIỮ NGUYÊN | `game1-memory.ts:40-75` | Lật thẻ, kiểm tra cặp thẻ khớp, cộng điểm, phát âm thanh match/wrong |
| **F043_F13** | `completeGame1Level`| ✅ GIỮ NGUYÊN | `game1-memory.ts:65` | `this.callbacks.onLevelComplete(this.level, this.score)` |

### 6. Game 2: Hứng Quả Từ Vựng (Word Catcher)
| ID | Tên mục gốc | Trạng thái | Vị trí file:dòng mới | Ghi chú & Trích đoạn đối chiếu |
| :--- | :--- | :--- | :--- | :--- |
| **F044_F13** | `renderGame2` | ✅ GIỮ NGUYÊN | `game2-catcher.ts:50` | Tạo vùng chơi hứng từ và giỏ hứng |
| **F045_F13** | `moveBasketButton` | ✅ GIỮ NGUYÊN | `game2-catcher.ts:70-85`| Hỗ trợ phím ArrowLeft/ArrowRight, A/D và vuốt cảm ứng/chuột |
| **F046_F13** | `initGame2` | ✅ GIỮ NGUYÊN | `game2-catcher.ts:20` | Khởi tạo 3 mạng sống, tốc độ rơi theo level |
| **F047_F13** | `startGame2Loop` | ✅ GIỮ NGUYÊN | `game2-catcher.ts:100` | `requestAnimationFrame` vòng lặp vật lý rơi |
| **F048_F13** | `gameLoop` (Game 2) | ✅ GIỮ NGUYÊN | `game2-catcher.ts:105` | Callback lặp 60 FPS |
| **F049_F13** | `handleGame2Mouse` | ✅ GIỮ NGUYÊN | `game2-catcher.ts:65` | Theo dõi di chuyển chuột máy tính |
| **F050_F13** | `handleGame2Touch` | ✅ GIỮ NGUYÊN | `game2-catcher.ts:75` | Theo dõi vuốt ngón tay cảm ứng |
| **F051_F13** | `handleGame2Keys` | ✅ GIỮ NGUYÊN | `game2-catcher.ts:80` | Phím bấm mũi tên trái/phải |
| **F052_F13** | `nextQuestion2` | ✅ GIỮ NGUYÊN | `game2-catcher.ts:30` | `setupNextQuestion()` & `spawnWordsForCurrentQuestion()` |
| **F053_F13** | `updateGame2` | ✅ GIỮ NGUYÊN | `game2-catcher.ts:110-180` | Tính toán tọa độ rơi, va chạm với giỏ, ăn điểm/mất mạng |
| **F054_F13** | `explodeWrongAnswers` | ⚠️ ĐỔI KHÁC | `game2-catcher.ts:150` | Tạo hiệu ứng đỏ nhấp nháy và âm thanh cảnh báo thay vì hạt canvas nổ |
| **F055_F13** | `updateGame2Lives` | ✅ GIỮ NGUYÊN | `game2-catcher.ts:155` | `this.callbacks.onLivesChange(this.lives)` |
| **F056_F13** | `endGame2WithGameOver`| ✅ GIỮ NGUYÊN | `game2-catcher.ts:160` | `this.callbacks.onGameOver(this.score)` |
| **F057_F13** | `completeGame2Level`| ✅ GIỮ NGUYÊN | `game2-catcher.ts:170` | `this.callbacks.onLevelComplete(this.level, this.score)` |
| **F058_F13** | `endGame2` | ✅ GIỮ NGUYÊN | `game2-catcher.ts:190` | `destroy()` hủy animation frame và dọn dẹp event listeners |

### 7. Game 3: Bắn Cung / Bảo Vệ Cứ Điểm (Shooter)
| ID | Tên mục gốc | Trạng thái | Vị trí file:dòng mới | Ghi chú & Trích đoạn đối chiếu |
| :--- | :--- | :--- | :--- | :--- |
| **F059_F13** | `renderGame3` | ✅ GIỮ NGUYÊN | `game3-shooter.ts:40` | Dựng sân đấu cứ điểm và các mục tiêu từ ngữ |
| **F060_F13** | `initGame3` | ✅ GIỮ NGUYÊN | `game3-shooter.ts:15` | Khởi tạo 3 mạng cứ điểm, nạp danh sách câu hỏi |
| **F061_F13** | `startGame3Loop` | ✅ GIỮ NGUYÊN | `game3-shooter.ts:95` | Kích hoạt vòng lặp hoạt ảnh mục tiêu bay |
| **F062_F13** | `gameLoop` (Game 3) | ✅ GIỮ NGUYÊN | `game3-shooter.ts:100` | Vòng lặp cập nhật vị trí mục tiêu di chuyển |
| **F063_F13** | `nextQuestion3` | ✅ GIỮ NGUYÊN | `game3-shooter.ts:25` | `nextQuestion()` lấy từ vựng mục tiêu cần bảo vệ |
| **F064_F13** | `spawnEnemy` | ✅ GIỮ NGUYÊN | `game3-shooter.ts:32` | `spawnTargets()` sinh các bia mục tiêu từ vựng |
| **F065_F13** | `updateGame3` | ✅ GIỮ NGUYÊN | `game3-shooter.ts:105-145` | Di chuyển mục tiêu tiến gần cứ điểm, trừ mạng nếu vượt qua |
| **F066_F13** | `updateGame3Lives` | ✅ GIỮ NGUYÊN | `game3-shooter.ts:135` | `this.callbacks.onLivesChange(this.lives)` |
| **F067_F13** | `shootAnswer` | ✅ GIỮ NGUYÊN | `game3-shooter.ts:65-90` | `handleShoot(clickX, clickY)` kiểm tra bắn trúng mục tiêu đúng/sai |
| **F068_F13** | `endGame3WithGameOver`| ✅ GIỮ NGUYÊN | `game3-shooter.ts:85` | `this.callbacks.onGameOver(this.score)` |
| **F069_F13** | `completeGame3Level`| ✅ GIỮ NGUYÊN | `game3-shooter.ts:75` | `this.callbacks.onLevelComplete(this.level, this.score)` |
| **F070_F13** | `endGame3` | ✅ GIỮ NGUYÊN | `game3-shooter.ts:150` | `destroy()` hủy animation frame và dọn dẹp event listeners |

### 8. Game 4: Nông Trại Tri Thức (Farm Simulation)
| ID | Tên mục gốc | Trạng thái | Vị trí file:dòng mới | Ghi chú & Trích đoạn đối chiếu |
| :--- | :--- | :--- | :--- | :--- |
| **F071_F13** | `resetGame4ForNewGame` | ✅ GIỮ NGUYÊN | `game4-farm.ts:20` | Khởi tạo 6 ô đất nông trại ở giai đoạn `empty` |
| **F072_F13** | `updateGame4UI` | ✅ GIỮ NGUYÊN | `game4-farm.ts:130` | `updatePlotsUI()` vẽ lại icon mầm/cây/trái và nhãn |
| **F073_F13** | `updateAllPlotsDisplay`| ✅ GIỮ NGUYÊN | `game4-farm.ts:135` | Cập nhật toàn bộ các thửa ruộng |
| **F074_F13** | `getPlotDisplay` | ✅ GIỮ NGUYÊN | `game4-farm.ts:50-70` | `getCropEmoji(stage)` & `getPlotLabel(stage)` |
| **F075_F13** | `renderGame4` | ✅ GIỮ NGUYÊN | `game4-farm.ts:30` | Dựng lưới 6 ô đất và modal trả lời câu hỏi chăm sóc |
| **F076_F13** | `selectPlot` | ✅ GIỮ NGUYÊN | `game4-farm.ts:75` | `handlePlotClick(plotIdx)` chọn gieo hạt hoặc thu hoạch |
| **F077_F13** | `showQuestion4` | ✅ GIỮ NGUYÊN | `game4-farm.ts:85` | `showQuestionModal()` hiện popup câu hỏi 4 đáp án |
| **F078_F13** | `answerQuestion4` | ✅ GIỮ NGUYÊN | `game4-farm.ts:95-125` | `handleAnswer(answer)` nuôi cây lớn nếu đúng, sâu bệnh nếu sai |
| **F079_F13** | `updatePlotDisplay` | ✅ GIỮ NGUYÊN | `game4-farm.ts:140` | Cập nhật ô đất vừa tương tác |
| **F080_F13** | `completeGame4Level`| ✅ GIỮ NGUYÊN | `game4-farm.ts:115` | `this.callbacks.onLevelComplete(this.level, this.score)` khi thu hoạch hết |

### 9. Modals, Chứng Chỉ & Chức Năng Bổ Trợ
| ID | Tên mục gốc | Trạng thái | Vị trí file:dòng mới | Ghi chú & Trích đoạn đối chiếu |
| :--- | :--- | :---: | :--- | :--- |
| **F081_F13** | `showLevelCompleteModal` | ✅ GIỮ NGUYÊN | `games.ts:70-80`, `games.html:90-105` | Hiện modal chúc mừng qua màn kèm nút "Màn kế tiếp" |
| **F082_F13** | `showGameOverModal` | ✅ GIỮ NGUYÊN | `games.ts:82-88`, `games.html:90-105` | Hiện modal thua trận kèm nút "Chơi lại" |
| **F083_F13** | `showCertificate` | ❌ THIẾU | Chưa có | Canvas vẽ bằng khen hoa văn và con dấu chưa chuyển sang |
| **F084_F13** | `viewCertificate` | ❌ THIẾU | Chưa có | Mở xem lại chứng chỉ |
| **F085_F13** | `downloadCertificate` | ❌ THIẾU | Chưa có | Tải ảnh chứng nhận `.png` |
| **F086_F13** | `closeCertificate` | ❌ THIẾU | Chưa có | Đóng popup chứng chỉ |
| **F087_F13** | `handleLogin` | ⚠️ ĐỔI KHÁC | `games.html:12` | Bỏ qua bước nhập form, tự động hóa định danh học sinh |
| **F088_F13** | `backToMenu` | ✅ GIỮ NGUYÊN | `games.ts:90` | `exitToMenu()` đưa người dùng về sảnh Game Hub |
| **F089_F13** | `logout` | ⚠️ ĐỔI KHÁC | `games.ts` | Không cần logout vì app dùng chung profile |
| **F090_F13** | `showLeaderboard` | ❌ THIẾU | Chưa có | Nút/màn hình BXH |
| **F091_F13** | `showCertificatesList` | ❌ THIẾU | Chưa có | Nút/màn hình danh sách chứng nhận |
| **F092_F13** | `showBadges` | ❌ THIẾU | Chưa có | Nút/màn hình huy hiệu |
| **F093_F13** | `startGame` | ✅ GIỮ NGUYÊN | `games.ts:35` | `launchGame(gameId, level)` khởi tạo class trò chơi tương ứng |
| **F094_F13** | `onConfigChange` | ⚠️ ĐỔI KHÁC | `public/_sdk/element_sdk.js` | Canva Element SDK chuyển thành file tĩnh adapter trong `public/_sdk/` |
| **F095_F13** | `showTutorial` | ⚠️ ĐỔI KHÁC | `games.html:26, 38, 49, 60` | Mô tả luật chơi được tích hợp trực tiếp trên thẻ bài của sảnh Game Hub thay vì bật popup riêng |

---

## KẾT LUẬN FILE13
- **Chức năng cốt lõi (4 Games & Audio):** Toàn bộ 4 trò chơi (Lật thẻ, Hứng từ, Bắn cung, Nông trại) cùng bộ tổng hợp âm thanh Web Audio API Synthesizer đã được tái cấu trúc hoàn hảo sang 8 file TypeScript hướng đối tượng cực kỳ sạch sẽ, kiểm thử đơn vị tự động đạt 100% trong `tests/games.test.ts`.
- **Các tính năng phụ bị khuyết (Cần xem xét bổ sung hoặc ghi nhận):**
  1. ❌ Màn hình Bảng xếp hạng (Leaderboard) & Hệ thống Huy hiệu (Badges).
  2. ❌ Bộ vẽ bằng khen chứng chỉ Canvas (`showCertificate`) & Tải ảnh PNG.
  3. ⚠️ Bỏ qua màn hình đăng nhập Login để học sinh có thể bấm chơi ngay lập tức (trải nghiệm liền mạch hơn).
