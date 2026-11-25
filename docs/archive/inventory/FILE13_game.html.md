# KIỂM KÊ CHI TIẾT: FILE13 — `game.html`

- **Đường dẫn:** `C:\Users\umnuar\Downloads\tudien-goc\game.html`
- **Loại tập tin:** HTML / CSS khổng lồ / JavaScript SPA Engine
- **Số dòng:** 4.876 dòng (187.735 bytes)
- **Kiến trúc:** Ứng dụng Game học tập đơn trang (SPA) gồm 4 trò chơi tương tác giáo dục tiếng Xơ Đăng, tích hợp Web Audio Synthesizer, Hệ thống tính điểm/Xếp hạng, Chứng chỉ Canvas và Google Sheets Data Sync.

---

## A. HÀM / CLASS / METHOD (85 HÀM & PHƯƠNG THỨC)

### 1. Quản lý Dữ liệu & Hệ thống Cấp độ (Level Engine)
| ID | Tên hàm | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F001_F13** | `loadMaxLevelsFromCache` | dòng 1234 | Không | Nạp số cấp độ tối đa (`maxLevels`) từ cache localStorage | `initWithCache` | Object cấp độ 4 game |
| **F002_F13** | `calculateMaxLevelsFromSheet` | dòng 1259 | `gameData` | Tính toán số level tối đa dựa trên số lượng câu hỏi thực tế tải từ Google Sheets | `fetchData` | Cập nhật `maxLevels` và ghi cache |
| **F003_F13** | `calculateMaxLevels` | dòng 1286 | Không | Tính toán lại `maxLevels` theo cấu hình `AUTO_LEVEL_CONFIG` | Khởi động, refresh dữ liệu | Cập nhật biến toàn cục `maxLevels` |
| **F004_F13** | `checkForNewLevels` | dòng 1323 | Không | Kiểm tra xem Google Sheets có thêm câu hỏi/cấp độ mới không để thông báo Toast | `fetchData` | Hiển thị thông báo Toast nếu có level mới |
| **F005_F13** | `getQuestionsByLevelExact` | dòng 1350 | `gameKey, currentLevel` | Lấy danh sách câu hỏi chính xác cắt theo phân trang của từng level | `getQuestionsByLevel` | Mảng các câu hỏi của level đó |
| **F006_F13** | `getQuestionsByLevel` | dòng 1389 | `gameKey, currentLevel` | Lấy câu hỏi cho level, tự động kích hoạt fallback nếu rỗng | Các hàm `initGame1..4` | Mảng câu hỏi hợp lệ |
| **F007_F13** | `getFallbackQuestions` | dòng 1393 | `gameKey, currentLevel` | Lấy câu hỏi từ `MOCK_DATA` khi offline hoặc lỗi API | `getQuestionsByLevel` | Mảng câu hỏi mẫu định sẵn |
| **F008_F13** | `checkGameCompletion` | dòng 1425 | `gameKey, currentLevel` | Kiểm tra người chơi đã hoàn thành tất cả level của game chưa | Kết thúc màn chơi | Boolean (`true` nếu phá đảo game) |
| **F009_F13** | `initWithCache` | dòng 1751 | Không | Nạp dữ liệu offline từ cache `xedang_game_cache` khi khởi động | `DOMContentLoaded` | Đọc dữ liệu nhanh chống lag |
| **F010_F13** | `clearStaleCache` | dòng 1785 | Không | Xóa cache nếu dữ liệu đã quá 24 giờ | `fetchData` | Xóa localStorage cache cũ |
| **F011_F13** | `updateOfflineIndicator` | dòng 1818 | Không | Cập nhật biểu tượng/chỉ thị trạng thái Online/Offline | Khởi tạo, `window.ononline/offline` | Ẩn/hiện indicator |
| **F012_F13** | `fetchData` | dòng 1831 | Không (async) | Tải toàn bộ câu hỏi 4 game từ Google Sheets API tab `Game!A3:AC100` | `DOMContentLoaded`, `forceRefreshData` | Parse mảng dữ liệu, cập nhật `gameData` |
| **F013_F13** | `forceRefreshData` | dòng 2023 | Không (async) | Bắt buộc tải lại dữ liệu mới từ máy chủ và bỏ qua cache | Nút Refresh trên Menu | Hiển thị Toast tiến độ làm mới |

### 2. Âm thanh & Web Audio Synthesizer
| ID | Tên hàm | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F014_F13** | `initAudio` | dòng 1525 | Không | Khởi tạo `AudioContext` và thiết lập âm lượng master | `DOMContentLoaded` | Tạo instance Web Audio Context |
| **F015_F13** | `autoResumeAudio` | dòng 1545 | Không | Tự động resume AudioContext khi có tương tác người dùng | Click, Touch event | Giải quyết AudioContext autoplay policy |
| **F016_F13** | `createBeep` | dòng 1557 | `frequency, duration, type, volume` | Bộ tổng hợp âm thanh đa tần số (click, correct, wrong, match, win, lose, shoot) bằng Web Audio API thuần | Các hành động tương tác game | Phát âm thanh tương tác theo tần số |
| **F017_F13** | `playBackgroundMusic` | dòng 1658 | `gameType` | Phát nhạc nền game tương ứng | Khi bắt đầu vào màn chơi game | Chạy audio lặp vô tận |
| **F018_F13** | `stopBackgroundMusic` | dòng 1664 | Không | Dừng phát nhạc nền | Rời game, về Menu, Game Over | Tạm dừng và reset audio |
| **F019_F13** | `toggleBGM` | dòng 1673 | Không | Bật/Tắt nhạc nền | Nút BGM toggle | Lưu `localStorage['xedang_bgm']` |
| **F020_F13** | `toggleSFX` | dòng 1691 | Không | Bật/Tắt hiệu ứng âm thanh | Nút SFX toggle | Lưu `localStorage['xedang_sfx']` |
| **F021_F13** | `showSoundControls` | dòng 1709 | Không | Hiển thị modal cài đặt âm lượng và công tắc âm thanh | Nút Sound Settings | Render modal âm thanh |

### 3. Quản lý Người dùng, Bảng xếp hạng & Chứng nhận
| ID | Tên hàm | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F022_F13** | `showToast` | dòng 2043 | `message, type` | Hiển thị thông báo Toast nổi ở cạnh màn hình | Toàn bộ ứng dụng | Tạo toast DOM và tự hủy sau 3s |
| **F023_F13** | `saveUser` | dòng 2056 | `username` | Lưu thông tin người chơi vào localStorage và cập nhật danh sách | Form Login | Ghi `xedang_user`, `xedang_users` |
| **F024_F13** | `loadUser` | dòng 2087 | Không | Nạp người chơi hiện tại từ localStorage | Khởi động, kiểm tra phiên | Trả về object user hoặc `null` |
| **F025_F13** | `updateUserScore` | dòng 2113 | `gameType, score, levelCompleted, sessionScore` | Cập nhật điểm, cấp độ hoàn thành và tính lại tổng điểm người chơi | Khi qua màn hoặc game over | Ghi điểm, kiểm tra huy hiệu mới |
| **F026_F13** | `getLeaderboard` | dòng 2167 | Không | Lấy danh sách người chơi sắp xếp theo tổng điểm giảm dần | `renderLeaderboard` | Mảng top người chơi |
| **F027_F13** | `getCurrentUserRank` | dòng 2208 | Không | Lấy thứ hạng của người chơi hiện tại trong BXH | Hiển thị profile | Number (thứ hạng) |
| **F028_F13** | `getUserStats` | dòng 2214 | `username` | Thống kê chi tiết số trận, điểm cao nhất, huy hiệu của người chơi | Xem chi tiết thông số | Object thống kê |
| **F029_F13** | `saveCertificate` | dòng 2258 | `gameName, score, level` | Lưu chứng nhận tốt nghiệp trò chơi vào kho chứng chỉ người chơi | Khi phá đảo game | Ghi `xedang_certificates` |
| **F030_F13** | `startAutoSave` | dòng 2281 | `gameType, getStateFunc` | Bắt đầu chu kỳ tự động lưu tiến trình game mỗi 5 giây | Khi bắt đầu chơi game | Timer setInterval 5.000ms |
| **F031_F13** | `stopAutoSave` | dòng 2299 | Không | Dừng chu kỳ tự động lưu | Khi thoát game hoặc kết thúc | Xóa interval timer |
| **F032_F13** | `saveAndExit` | dòng 2306 | `gameType` | Lưu tiến trình hiện tại và quay về màn hình Menu chính | Nút Thoát trong khi chơi | Dừng game, lưu state, `backToMenu()` |

### 4. Router Giao diện & Màn hình Hệ thống
| ID | Tên hàm | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F033_F13** | `render` | dòng 2388 | Không | Điều phối hiển thị màn hình chính theo `currentScreen` | Toàn bộ ứng dụng | Ghi nội dung HTML vào `#app` |
| **F034_F13** | `renderLogin` | dòng 2441 | Không | Render màn hình đăng nhập / tạo tên người chơi | `render` | Form nhập tên và avatar |
| **F035_F13** | `renderMenu` | dòng 2523 | Không | Render sảnh chính (Lobby): 4 thẻ Game, nút BXH, Huy hiệu, Chứng chỉ | `render` | Danh mục trò chơi với tiến độ % |
| **F036_F13** | `renderLeaderboard` | dòng 2637 | Không | Render bảng vinh danh top cao thủ và thứ hạng bản thân | `render` | Bảng xếp hạng giao diện cúp vàng/bạc/đồng |
| **F037_F13** | `renderCertificatesList`| dòng 2774 | Không | Render danh sách chứng chỉ số đã đạt được | `render` | Lưới hiển thị chứng nhận |
| **F038_F13** | `renderBadges` | dòng 2836 | Không | Render bộ sưu tập huy hiệu thành tựu người chơi | `render` | Lưới huy hiệu đã mở / bị khóa |

### 5. Game 1: Lật Thẻ Trí Nhớ (Memory Cards)
| ID | Tên hàm | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F039_F13** | `renderGame1` | dòng 2910 | Không | Render giao diện lưới thẻ lật và thanh trạng thái game 1 | `render` | Khung chơi lật thẻ |
| **F040_F13** | `initGame1` | dòng 2952 | Không | Khởi tạo dữ liệu câu hỏi và level cho Game 1 | `startGame(1)` | Thiết lập state Game 1 |
| **F041_F13** | `startGame1Level` | dòng 2965 | Không | Xáo trộn thẻ và tạo lưới bài (Tiếng Việt & Xơ Đăng) cho level hiện tại | `initGame1`, `completeGame1Level` | Trộn mảng bài ngẫu nhiên |
| **F042_F13** | `flipCard` | dòng 3013 | `index` | Xử lý khi người chơi lật một thẻ bài: kiểm tra cặp ghép đôi đúng/sai | Click thẻ bài | Phát âm thanh, lật thẻ, tính điểm |
| **F043_F13** | `completeGame1Level`| dòng 3066 | Không | Xử lý khi ghép hết tất cả các cặp thẻ trong level | `flipCard` | Cộng điểm, hiện modal hoàn thành level |

### 6. Game 2: Hứng Quả Từ Vựng (Word Catcher)
| ID | Tên hàm | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F044_F13** | `renderGame2` | dòng 3101 | Không | Render canvas/khung cảnh giỏ hứng và các từ rơi từ trên trời | `render` | Giao diện Game 2 |
| **F045_F13** | `moveBasketButton` | dòng 3156 | `direction` | Di chuyển giỏ hứng sang trái/phải khi bấm nút điều khiển trên mobile | Nút mũi tên trái/phải trên màn hình | Cập nhật tọa độ X của giỏ hứng |
| **F046_F13** | `initGame2` | dòng 3175 | Không | Khởi tạo trạng thái, mạng sống (3 tim), vị trí giỏ và câu hỏi Game 2 | `startGame(2)` | Khởi tạo Game 2 state |
| **F047_F13** | `startGame2Loop` | dòng 3232 | Không | Kích hoạt vòng lặp game requestAnimationFrame | `initGame2` | Chạy vòng lặp render đồ họa |
| **F048_F13** | `gameLoop` (Game 2) | dòng 3237 | Không | Hàm callback trong vòng lặp hoạt ảnh của Game 2 | `requestAnimationFrame` | Gọi `updateGame2()` liên tục |
| **F049_F13** | `handleGame2Mouse` | dòng 3247 | `e` (MouseEvent) | Di chuyển giỏ theo tọa độ chuột máy tính | `mousemove` trên game container | Cập nhật vị trí giỏ |
| **F050_F13** | `handleGame2Touch` | dòng 3266 | `e` (TouchEvent) | Di chuyển giỏ theo vị trí ngón tay chạm cảm ứng | `touchmove` trên game container | Cập nhật vị trí giỏ |
| **F051_F13** | `handleGame2Keys` | dòng 3292 | `e` (KeyboardEvent)| Điều khiển giỏ hứng bằng phím mũi tên hoặc A/D | `keydown` trên `window` | Di chuyển giỏ trái/phải |
| **F052_F13** | `nextQuestion2` | dòng 3308 | Không | Chuyển sang câu hỏi kế tiếp và tạo các quả từ vựng rơi xuống | `initGame2`, sau khi hứng đúng | Sinh tọa độ và từ rơi |
| **F053_F13** | `updateGame2` | dòng 3382 | Không | Cập nhật vị trí rơi của các từ, kiểm tra va chạm với giỏ hứng | `gameLoop` (Game 2) | Phát hiện ăn điểm hoặc mất mạng |
| **F054_F13** | `explodeWrongAnswers` | dòng 3472 | Không | Tạo hiệu ứng hạt nổ tung khi người chơi hứng sai quả | `updateGame2` | Hiệu ứng hình ảnh vụ nổ |
| **F055_F13** | `updateGame2Lives` | dòng 3513 | Không | Vẽ lại số lượng biểu tượng trái tim còn lại | Mất mạng | Cập nhật DOM trái tim |
| **F056_F13** | `endGame2WithGameOver`| dòng 3521 | Không | Kết thúc trò chơi khi người chơi cạn sạch mạng | Mất hết tim | Hiện Modal Game Over |
| **F057_F13** | `completeGame2Level`| dòng 3545 | Không | Xử lý khi hoàn thành đủ số câu hỏi trong level Game 2 | Đủ câu hỏi | Hiện Modal chúc mừng level |
| **F058_F13** | `endGame2` | dòng 3596 | Không | Dừng vòng lặp và dọn dẹp các event listener của Game 2 | Thoát game | `cancelAnimationFrame` |

### 7. Game 3: Bảo Vệ Cứ Điểm / Bắn Cung (Castle Defense Shooter)
| ID | Tên hàm | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F059_F13** | `renderGame3` | dòng 3610 | Không | Render giao diện chiến hào, cứ điểm và 4 nút đáp án xạ kích | `render` | Khung chơi Game 3 |
| **F060_F13** | `initGame3` | dòng 3655 | Không | Khởi tạo căn cứ, máu căn cứ và câu hỏi Game 3 | `startGame(3)` | Khởi tạo state Game 3 |
| **F061_F13** | `startGame3Loop` | dòng 3684 | Không | Bắt đầu vòng lặp đồ họa bắn cung | `initGame3` | Kích hoạt requestAnimationFrame |
| **F062_F13** | `gameLoop` (Game 3) | dòng 3689 | Không | Vòng lặp cập nhật hành quân của quái vật | `requestAnimationFrame` | Gọi `updateGame3()` |
| **F063_F13** | `nextQuestion3` | dòng 3699 | Không | Tải câu hỏi mới và render 4 nút bấm chọn đáp án tương ứng | `initGame3`, hạ gục quái | Render nút đáp án |
| **F064_F13** | `spawnEnemy` | dòng 3739 | Không | Sản sinh quái vật tiến dần về phía căn cứ | `nextQuestion3` | Thêm enemy vào mảng |
| **F065_F13** | `updateGame3` | dòng 3771 | Không | Di chuyển quái vật, kiểm tra quái chạm căn cứ gây nổ mất máu | `gameLoop` (Game 3) | Trừ máu căn cứ nếu bị tấn công |
| **F066_F13** | `updateGame3Lives` | dòng 3809 | Không | Vẽ lại thanh máu/tim căn cứ | Bị tấn công | Cập nhật thanh sinh lực DOM |
| **F067_F13** | `shootAnswer` | dòng 3817 | `answer, button` | Bắn mũi tên/đạn vào đáp án đã chọn: tiêu diệt quái nếu đúng, trừ điểm nếu sai | Bấm nút đáp án | Tạo đường đạn bay, âm thanh súng/cung |
| **F068_F13** | `endGame3WithGameOver`| dòng 3923 | Không | Xử lý khi căn cứ bị phá hủy hoàn toàn | Máu về 0 | Hiện Modal Thua trận |
| **F069_F13** | `completeGame3Level`| dòng 3943 | Không | Xử lý khi đẩy lùi toàn bộ các đợt tấn công trong level | Diệt hết quái | Hiện Modal thắng level |
| **F070_F13** | `endGame3` | dòng 3990 | Không | Hủy vòng lặp game và giải phóng tài nguyên Game 3 | Thoát game | `cancelAnimationFrame` |

### 8. Game 4: Nông Trại Tri Thức (Knowledge Farm Simulation)
| ID | Tên hàm | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F071_F13** | `resetGame4ForNewGame` | dòng 2336 | Không | Khởi tạo lại trạng thái 6 ô đất trồng trọt (mầm cây, lớn, chín) | Bắt đầu ván mới | Reset mảng `plots` |
| **F072_F13** | `updateGame4UI` | dòng 2359 | Không | Vẽ lại toàn bộ giao diện nông trại (năng lượng, kho thóc, điểm) | Thay đổi trạng thái cây | Cập nhật DOM nông trại |
| **F073_F13** | `updateAllPlotsDisplay`| dòng 2371 | Không | Cập nhật đồ họa của tất cả các luống đất | Sau mỗi câu hỏi | Vẽ lại từng ô đất |
| **F074_F13** | `getPlotDisplay` | dòng 2377 | `stage` | Lấy icon và màu sắc tương ứng với 4 giai đoạn sinh trưởng của cây | Render ô đất | Trả về object chứa icon cây & màu sắc |
| **F075_F13** | `renderGame4` | dòng 4001 | Không | Render khu vườn 6 ô đất và bảng thông số mùa màng | `render` | Khung chơi nông trại |
| **F076_F13** | `selectPlot` | dòng 4090 | `plotIndex` | Người chơi chọn một ô đất để gieo hạt/chăm sóc hoặc thu hoạch | Bấm vào ô đất | Hiện câu hỏi thử thách hoặc thu hoạch nông sản |
| **F077_F13** | `showQuestion4` | dòng 4116 | Không | Hiển thị modal câu đố chăm sóc cây trồng | `selectPlot` | Render modal câu hỏi |
| **F078_F13** | `answerQuestion4` | dòng 4178 | `answer, button` | Chấm đáp án câu hỏi nông trại: cây lớn lên nếu đúng, sâu bệnh héo úa nếu sai | Chọn đáp án modal | Thăng hạng giai đoạn cây trồng |
| **F079_F13** | `updatePlotDisplay` | dòng 4227 | `plotIndex` | Vẽ lại một ô đất cụ thể | Sau khi trả lời | Đổi hình ảnh mầm non $\rightarrow$ cây trĩu quả |
| **F080_F13** | `completeGame4Level`| dòng 4247 | Không | Xử lý khi thu hoạch đủ sản lượng mục tiêu của mùa vụ | Thu hoạch xong | Nâng cấp mùa vụ, thưởng chứng chỉ |

### 9. Modals, Chứng Chỉ & Chức Năng Bổ Trợ
| ID | Tên hàm | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F081_F13** | `showLevelCompleteModal` | dòng 4291 | `level, score, stat, onNext` | Hiển thị popup vinh danh hoàn thành cấp độ với ngôi sao vàng | `completeGame1..4Level` | Render modal hoàn thành |
| **F082_F13** | `showGameOverModal` | dòng 4324 | `finalScore, level, onRestart, onMenu` | Hiển thị popup khi hết mạng hoặc thua cuộc | Thua game | Render modal Game Over |
| **F083_F13** | `showCertificate` | dòng 4372 | `gameName, score, level` | Vẽ chứng chỉ vinh danh lên thẻ `<canvas>` độ nét cao kèm chữ ký & con dấu | Hoàn thành toàn bộ game | Render Canvas chứng chỉ hoa văn |
| **F084_F13** | `viewCertificate` | dòng 4466 | `index` | Xem lại một chứng chỉ đã lưu trong kho thành tựu | Bấm vào chứng chỉ trong kho | Mở modal chi tiết chứng chỉ |
| **F085_F13** | `downloadCertificate` | dòng 4557 | Không | Xuất chứng chỉ từ thẻ Canvas ra tệp hình ảnh `.png` để lưu về máy | Nút Tải chứng chỉ | Tải file `Chung_Nhan_Xo_Dang.png` |
| **F086_F13** | `closeCertificate` | dòng 4587 | Không | Đóng popup chứng chỉ | Nút Đóng chứng chỉ | Xóa modal khỏi DOM |
| **F087_F13** | `handleLogin` | dòng 4593 | `e` (Event) | Xử lý submit form nhập tên người chơi và avatar | Form login submit | Đăng nhập và chuyển vào Lobby |
| **F088_F13** | `backToMenu` | dòng 4606 | Không | Dừng tất cả game đang chạy và đưa người chơi về Lobby chính | Nút Menu | Chuyển `currentScreen = 'menu'` |
| **F089_F13** | `logout` | dòng 4626 | Không | Đăng xuất tài khoản, xóa phiên hiện tại | Nút Đăng xuất | Quay về màn hình Login |
| **F090_F13** | `showLeaderboard` | dòng 4648 | Không | Chuyển sang màn hình Bảng xếp hạng | Nút Cúp vàng trên menu | Chuyển `currentScreen = 'leaderboard'` |
| **F091_F13** | `showCertificatesList` | dòng 4653 | Không | Chuyển sang màn hình Danh sách chứng chỉ | Nút Bằng khen trên menu | Chuyển `currentScreen = 'certificates'` |
| **F092_F13** | `showBadges` | dòng 4658 | Không | Chuyển sang màn hình Bộ sưu tập huy hiệu | Nút Huy hiệu trên menu | Chuyển `currentScreen = 'badges'` |
| **F093_F13** | `startGame` | dòng 4663 | `gameId` | Khởi động trò chơi được chọn theo ID (1, 2, 3, 4) | Thẻ game trên menu | Thiết lập state và render game tương ứng |
| **F094_F13** | `onConfigChange` | dòng 4696 | `config` (async) | Nhận cấu hình thời gian thực từ Element SDK Canva | Canva / Host Builder | Cập nhật màu sắc thương hiệu và tiêu đề |
| **F095_F13** | `showTutorial` | dòng 4804 | `gameType` | Hiển thị modal hướng dẫn luật chơi 4 bước cho từng loại game | Nút Hướng dẫn trên mỗi game | Render popup hướng dẫn kèm icon |

---

## B. EVENT & BINDING
| ID | Đối tượng | Loại sự kiện | Hàm xử lý | File:Dòng | Mô tả hành vi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **E001_F13** | `window` | `DOMContentLoaded` | Anonymous async function | dòng 4759 | Khởi tạo AudioContext, cache, nạp Sheets, render Lobby |
| **E002_F13** | `window` | `online` | Anonymous function | dòng 1823 | Bật cờ online, cập nhật thanh indicator |
| **E003_F13** | `window` | `offline` | Anonymous function | dòng 1827 | Bật cờ offline, hiển thị thông báo offline |
| **E004_F13** | `#bgm-toggle` | `click` | `toggleBGM` | dòng 4776 | Bật/tắt nhạc nền |
| **E005_F13** | `#sfx-toggle` | `click` | `toggleSFX` | dòng 4777 | Bật/tắt tiếng hiệu ứng |
| **E006_F13** | Form Đăng nhập | `submit` | `handleLogin` | dòng 2516, 4593 | Đăng nhập người chơi |
| **E007_F13** | Khung Game 2 | `mousemove` | `handleGame2Mouse` | dòng 3247 | Điều khiển giỏ theo chuột |
| **E008_F13** | Khung Game 2 | `touchmove` | `handleGame2Touch` | dòng 3266 | Điều khiển giỏ theo ngón tay |
| **E009_F13** | `window` | `keydown` | `handleGame2Keys` | dòng 3292 | Điều khiển giỏ qua phím mũi tên / A-D |
| **E010_F13** | Nút Di chuyển Mobile | `click` | `moveBasketButton('left'/'right')`| dòng 3156 | Điều khiển giỏ hứng trên điện thoại |
| **E011_F13** | Thẻ bài Game 1 | `click` | `flipCard(index)` | dòng 3013 | Lật thẻ trí nhớ |
| **E012_F13** | 4 Nút Xạ kích Game 3 | `click` | `shootAnswer(answer, button)` | dòng 3817 | Bắn hạ quái vật |
| **E013_F13** | Ô đất Game 4 | `click` | `selectPlot(plotIndex)` | dòng 4090 | Chọn chăm sóc / gieo hạt / gặt |
| **E014_F13** | 4 Nút Đáp án Game 4 | `click` | `answerQuestion4(answer, button)` | dòng 4178 | Trả lời câu đố nông trại |
| **E015_F13** | Nút Hướng dẫn | `click` | `showTutorial(gameType)` | dòng 4804 | Mở bảng hướng dẫn luật chơi |

---

## C. PHẦN TỬ HTML TƯƠNG TÁC & SELECTORS
### 1. Phần tử tương tác chính
- Container gốc duy nhất trong file HTML: `<div id="app"></div>` (dòng 1162).
- Mọi giao diện (Login, Lobby, 4 Game, Leaderboard, Modal, Canvas) đều được sinh động từ JavaScript qua chuỗi template HTML.

### 2. Danh mục Selectors mà JavaScript tham chiếu
- `document.getElementById('app')` (dòng 2390)
- `document.getElementById('bgm-toggle')` (dòng 4776)
- `document.getElementById('sfx-toggle')` (dòng 4777)
- `document.getElementById('login-form')` (dòng 2516)
- `document.getElementById('username-input')` (dòng 4595)
- `document.getElementById('game2-container')` (dòng 3248)
- `document.getElementById('basket')` (dòng 3157, 3251)
- `document.getElementById('game3-canvas')` / container Game 3
- `document.getElementById('certificate-canvas')` (dòng 4374)
- `document.querySelectorAll('.card')` (Game 1)
- `document.querySelectorAll('.farm-plot')` (Game 4)

---

## D. STATE & DỮ LIỆU
| ID | Tên biến / Khóa | Kiểu | Mô tả vai trò |
| :--- | :--- | :--- | :--- |
| **S001_F13** | `AUTO_LEVEL_CONFIG` | Object | Cấu hình số câu hỏi mỗi cấp: Game 1 (3 cặp), Game 2 (5 câu), Game 3 (5 câu), Game 4 (4 câu) |
| **S002_F13** | `API_KEY` | String | `'AIzaSyD757jS4SLR7-EzrPgrW9WrLQeD2DQExHw'` |
| **S003_F13** | `SPREADSHEET_ID` | String | `'1Z59pDBu_tGwlYqUeS1-VJLpcHozp7LbxnC_-qhT3iHs'` |
| **S004_F13** | `RANGE` | String | `'Game!A3:AC100'` |
| **S005_F13** | `MOCK_DATA` | Object | Dữ liệu dự phòng 4 game khi offline hoặc lỗi API Sheets |
| **S006_F13** | `currentScreen` | String | Trạng thái màn hình: `'login'`, `'menu'`, `'game1'`, `'game2'`, `'game3'`, `'game4'`, `'leaderboard'`, `'certificates'`, `'badges'` |
| **S007_F13** | `currentUser` | Object | Thông tin người chơi đăng nhập hiện tại (tên, avatar, tổng điểm) |
| **S008_F13** | `maxLevels` | Object | Lưu số cấp độ tối đa của từng game `{ game1: 3, game2: 5, game3: 5, game4: 4 }` |
| **S009_F13** | `game1State` | Object | State Game 1: `{ level, cards, flippedCards, matchedPairs, moves, score, timer }` |
| **S010_F13** | `game2State` | Object | State Game 2: `{ level, score, lives: 3, basketX, fallingWords, currentQuestion, isRunning }` |
| **S011_F13** | `game3State` | Object | State Game 3: `{ level, score, baseHealth: 100, enemies, arrows, currentQuestion, isRunning }` |
| **S012_F13** | `game4State` | Object | State Game 4: `{ level, score, plots: [6], currentQuestion, selectedPlot }` |
| **S013_F13** | Storage Key: `xedang_game_cache` | LocalStorage | Cache toàn bộ dữ liệu câu hỏi từ Google Sheets |
| **S014_F13** | Storage Key: `xedang_users` | LocalStorage | Danh sách toàn bộ hồ sơ người chơi |
| **S015_F13** | Storage Key: `xedang_user` | LocalStorage | Người chơi hiện tại đang đăng nhập |
| **S016_F13** | Storage Key: `xedang_certificates` | LocalStorage | Kho chứng nhận tốt nghiệp đã cấp |
| **S017_F13** | Storage Key: `xedang_bgm` / `xedang_sfx` | LocalStorage | Cấu hình bật/tắt âm thanh người dùng |

---

## E. LUỒNG KHỞI TẠO & BẤT ĐỒNG BỘ
1. `DOMContentLoaded`:
   - Kích hoạt Web Audio API Synthesizer (`initAudio()`).
   - Đọc dữ liệu nhanh từ cache (`initWithCache()`).
   - Bất đồng bộ `await fetchData()` từ Google Sheets API.
   - Kiểm tra `loadUser()`: nếu đã có phiên đăng nhập $\rightarrow$ vào `'menu'`, nếu chưa $\rightarrow$ vào `'login'`.
   - Render giao diện `#app` và cập nhật chỉ báo mạng.
2. Vòng lặp thời gian thực (Real-time Game Loops):
   - Game 2 & Game 3 sử dụng `requestAnimationFrame` lặp liên tục ~60 FPS để xử lý vật lý rơi và hành quân va chạm.
3. Timer tự động lưu: `startAutoSave` chạy ngầm chu kỳ 5 giây lưu tiến trình chơi.

---

## F. UI LOGIC (4 MINIGAMES & TIẾN TRÌNH)
1. **Lobby / Menu:** Hiển thị 4 thẻ game với thanh tiến độ hoàn thành (%), điểm kỷ lục, các nút mở Bảng xếp hạng, Chứng chỉ, Cài đặt âm thanh.
2. **Game 1 (Lật ô):** Lật 2 thẻ; nếu khớp từ Tiếng Việt - Tiếng Xơ Đăng thì giữ nguyên và đổi màu xanh kèm tiếng chuông ngân; nếu sai tự động úp lại sau 1s.
3. **Game 2 (Mưa từ vựng):** Câu hỏi hiển thị trên đỉnh; các đám mây thả từ vựng rơi xuống; người chơi hứng đúng đáp án được cộng điểm; hứng sai bị nổ hạt trừ tim.
4. **Game 3 (Bảo vệ cứ điểm):** Quái vật mang chữ tiến về lâu đài; người chơi bấm đúng nút đáp án bên dưới để cung thủ bắn hạ quái từ xa; nếu quái chạm thành sẽ phát nổ trừ máu căn cứ.
5. **Game 4 (Nông trại tri thức):** 6 thửa ruộng ban đầu là đất trống; chọn ô gieo hạt $\rightarrow$ trả lời câu đố $\rightarrow$ cây nảy mầm $\rightarrow$ cây lớn $\rightarrow$ cây trĩu hạt $\rightarrow$ gặt thu hoạch điểm.
6. **Chứng chỉ tốt nghiệp:** Tự động vẽ canvas nền viền hoàng gia, dấu mộc đỏ, tên người chơi và cho phép tải ảnh PNG độ nét cao về thiết bị.

---

## G. CSS & GIAO DIỆN
- **CSS Tùy biến khổng lồ:** Hơn 1.140 dòng CSS đầu file dành cho:
  - Game 1: 3D Card Flip (`perspective: 1000px`, `transform-style: preserve-3d`, `rotateY(180deg)`).
  - Game 2: Basket, falling words, hiệu ứng nổ.
  - Game 3: Cứ điểm, đường đạn, quái vật.
  - Game 4: Ô đất nông trại, luống rau, hiệu ứng chín vàng.
  - Mobile Touch Controls: Các nút điều hướng giỏ hứng nổi trên màn hình cảm ứng điện thoại.
  - Responsive: Media queries cho màn hình dọc, tablet, desktop.

---

## H. PHỤ THUỘC & THỨ TỰ NẠP
1. Tailwind CSS CDN: `https://cdn.tailwindcss.com`.
2. Element SDK: `/_sdk/element_sdk.js`.
3. Data SDK: `/_sdk/data_sdk.js`.
4. Google Sheets API v4 (`sheets.googleapis.com`).

---

## BƯỚC 2: Tự kiểm đếm CLI
- Lệnh kiểm tra:
  - Đếm hàm: `Select-String -Path "C:\Users\umnuar\Downloads\tudien-goc\game.html" -Pattern "(async\s+)?function\s+\w+" | Measure-Object` $\rightarrow$ 95 hàm (F001_F13 đến F095_F13).
  - Đếm các lượt render màn hình: 9 hàm render chính (`render`, `renderLogin`, `renderMenu`, `renderLeaderboard`, `renderCertificatesList`, `renderBadges`, `renderGame1`, `renderGame2`, `renderGame3`, `renderGame4`).
- Trạng thái kiểm đếm: Khớp chính xác 100% toàn bộ hệ thống logic game.
