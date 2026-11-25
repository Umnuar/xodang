export interface SnapshotDictionaryEntry {
    viet: string;
    ethnic: string;
    pronunciation?: string;
    driveId?: string;
    exampleViet?: string;
    exampleEthnic?: string;
}

export interface SnapshotFallbackType {
    dictionary: SnapshotDictionaryEntry[] | null;
    quiz: string[][] | null;
    chat: string[][] | null;
}

export const snapshotFallback: SnapshotFallbackType = {
    "dictionary": [
        {
            "viet": "Bố",
            "ethnic": "Pa",
            "pronunciation": "Pa",
            "driveId": "1pwc9ekEEbhttVq8wHTs0nHptCOayJpSk",
            "exampleViet": "Bố em làm việc để nuôi gia đình.",
            "exampleEthnic": "Pa ó lám pêi cheă va pán rơpõ hngêi."
        },
        {
            "viet": "Làm cha, làm mẹ",
            "ethnic": "Pro pa, pro nôu",
            "pronunciation": "P-ro pa pro nu",
            "driveId": "1FeYKd8SxlRecz6fS0xrdtPXoJ-lIg60p",
            "exampleViet": "Làm cha, làm mẹ phải có nghĩa vụ chăm sóc, dạy dỗ con cái.",
            "exampleEthnic": "Pa nôu, pro nôu athế ái tơdroă bro, hne kuén né."
        },
        {
            "viet": "Cơm",
            "ethnic": "hme",
            "pronunciation": "hơ-me",
            "driveId": "1VqHGx1jEoUx48XzHa8fzzRSYzBm75lbm",
            "exampleViet": "Nấu cơm",
            "exampleEthnic": "pế hme"
        },
        {
            "viet": "Ăn",
            "ethnic": "Ka",
            "pronunciation": "Ka",
            "driveId": "1nXvlbUe9iM5X59wTDPLn1p4QbsNMQI0s",
            "exampleViet": "Em ăn cơm cùng gia đình mỗi tối.",
            "exampleEthnic": "O ka hme 'bă rơpõ hngêi rem kơmáng."
        },
        {
            "viet": "Uống",
            "ethnic": "Âu",
            "pronunciation": "Âu",
            "driveId": "1A6YSdYdd0ATfoFzb7uXCE2t0kNTqkzMJ",
            "exampleViet": "Đàn trâu đang uống nước bên suối.",
            "exampleEthnic": "Khu Kơbâu dế âu tea tíng têa."
        },
        {
            "viet": "Uống nước",
            "ethnic": "Âu têa",
            "pronunciation": "Âu tê-a",
            "driveId": "1XbDDuKnswKTFCRKenrjtWX0c0iDGFww0",
            "exampleViet": "Bé cần uống nước đầy đủ mỗi ngày.",
            "exampleEthnic": "Kuế kál âu tea be rem hai."
        },
        {
            "viet": "Nhà",
            "ethnic": "Hngêi",
            "pronunciation": "H-ngêi",
            "driveId": "1raUfN0CewaGXr0GTORjCblECdbcSc6M-",
            "exampleViet": "Mỗi tối, em ở nhà ôn bài.",
            "exampleEthnic": "Môi kơmáng, o ối hngêi gá hok bai."
        },
        {
            "viet": "Núi",
            "ethnic": "Ngo",
            "pronunciation": "Ngo",
            "driveId": "1PBtKxPfoNB3DehveREyjlxGQgtFtoSuT",
            "exampleViet": "Núi cao nằm xa xa phía chân trời.",
            "exampleEthnic": "Ngo xón ối a hơngế pếa pa chêang pleng tui lui."
        },
        {
            "viet": "Sông",
            "ethnic": "Kroáng",
            "pronunciation": "K-ro-áng",
            "driveId": "1NLp5AXAYQt4RMkIVtRw5GcHhrAcufT3i",
            "exampleViet": "Dòng sông chảy êm đềm qua làng.",
            "exampleEthnic": "Kroáng tea hiu hơniap lua pơlê."
        },
        {
            "viet": "Suối",
            "ethnic": "Têa kuề",
            "pronunciation": "Tê-a kuề",
            "driveId": "1iiOLCJRSvMaKK3EF_qfK8q_h8lyH32pO",
            "exampleViet": "Suối chảy róc rách qua khu rừng.",
            "exampleEthnic": "Têa kuề hiu róc róc lua tung kong."
        },
        {
            "viet": "Con trâu",
            "ethnic": "Kuê̆ kơpô",
            "pronunciation": "Kuề kơ-pô",
            "driveId": "1Frke5d1Q8MkxguY2IcpHC7ng_Wfi18Ov",
            "exampleViet": "Con trâu có đôi sừng cong vút.",
            "exampleEthnic": "Kuễ kơpốu ái túa kái gut xón."
        },
        {
            "viet": "Con bò",
            "ethnic": "Kuê̆ ro",
            "pronunciation": "Kuề ro",
            "driveId": "13XWzNOd4XeJfFKsR1f4p5Kn76It4ktKt",
            "exampleViet": "Con bò cái nhà em vừa đẻ con.",
            "exampleEthnic": "Kuê̆ ro kì hngêi o nếu ái Kuê̆."
        },
        {
            "viet": "Con cá",
            "ethnic": "Kuê̆ Ká",
            "pronunciation": "Ká",
            "driveId": "1Q3AET2oVHkIRybxLXwoGW_eYCeRU1pzK",
            "exampleViet": "Em nuôi cá trong bể thủy sinh.",
            "exampleEthnic": "O pán ká tung kơbê thụy tinh."
        },
        {
            "viet": "Chim",
            "ethnic": "Chêm",
            "pronunciation": "Chêm",
            "driveId": "1lb-FwrSo0AbMzqfT53G1wBDB0l_wgfrA",
            "exampleViet": "Tiếng chim hót vui tai vào buổi sáng.",
            "exampleEthnic": "Rơkong chêm hot lẽ ko tuẽ 'tang mot kaso."
        },
        {
            "viet": "Cây",
            "ethnic": "Loă",
            "pronunciation": "Loă",
            "driveId": "1c5F7OvuINy9zZYWyqpaZI_DAYfTqWtQ2",
            "exampleViet": "Những cây xanh giúp không khí trong lành.",
            "exampleEthnic": "Hen loă dreh veă rơxoh krúa lẽ."
        },
        {
            "viet": "Lá chuối",
            "ethnic": "Hlá",
            "pronunciation": "H-lá",
            "driveId": "1zv9hh2buK7I2HzYbKeFFfEhY6WyqzPU9",
            "exampleViet": "Lá chuối có màu xanh tươi.",
            "exampleEthnic": "Hlá priet ái mau dreh lẽ."
        },
        {
            "viet": "Cảm ơn",
            "ethnic": "Mơnê",
            "pronunciation": "Mơ-nê",
            "driveId": "1Z97HroP6_KLBMjazrPdgkJq2g-vQKbvS",
            "exampleViet": "Em cảm ơn khi được giúp đỡ.",
            "exampleEthnic": "O mơnê dế vai veă xêh."
        },
        {
            "viet": "Anh em",
            "ethnic": "Ngoh o",
            "pronunciation": "Ngoh o",
            "driveId": "1QTr4se19GDyu-FpeALikKocay6W8Rx3e",
            "exampleViet": "Anh em như thể tay chân.",
            "exampleEthnic": "Ngoh o môi tiah kŏ chêng."
        },
        {
            "viet": "Chào hỏi",
            "ethnic": "Koh eng",
            "pronunciation": "Koh eng",
            "driveId": "1DxyQMV6LFEpJPkOSNehXXHZLVmm39ftu",
            "exampleViet": "Em chào hỏi mọi người khi đến lớp.",
            "exampleEthnic": "O koh eng túm kơ mơngế dế trôh a lâm."
        },
        {
            "viet": "Tháng",
            "ethnic": "Khế",
            "pronunciation": "Khế",
            "driveId": "1aS5KOpey5Noa7kfSapyVTYGVNEEZS1Q7",
            "exampleViet": "Một năm có 12 tháng.",
            "exampleEthnic": "Môi hơnám ái môi chat péa khế."
        },
        {
            "viet": "Số một (1)",
            "ethnic": "Môi",
            "pronunciation": "Môi",
            "driveId": "1wSXlN8dMnLq3g-zZc0dsGuNHHtooJy5G"
        },
        {
            "viet": "Số hai (2)",
            "ethnic": "Péa",
            "pronunciation": "Pé-a",
            "driveId": "1T1fSCF3-pHB19Cx7ScENDNvOHsO_o_Ec",
            "exampleViet": "Em làm xong hai bài tập Toán.",
            "exampleEthnic": "O pêi klei péa tơdróang hriam rien."
        },
        {
            "viet": "Số ba (3)",
            "ethnic": "Pái",
            "pronunciation": "Pái",
            "driveId": "1qcEyRhRuOMwyr2L-X_ALA5Cdyndc3yTb",
            "exampleViet": "Em có ba bạn thân trong lớp.",
            "exampleEthnic": "O ái pái to chiang hma tung lâm."
        },
        {
            "viet": "Số bốn (4)",
            "ethnic": "Pún",
            "pronunciation": "Pún",
            "driveId": "1uNCu48WUuK9eFdSRiXheqxSTR-qwfREn",
            "exampleViet": "Em đọc xong bốn chương sách.",
            "exampleEthnic": "O ngán híang kle pún hla mơ-éa."
        },
        {
            "viet": "Số năm (5)",
            "ethnic": "Pơtám",
            "pronunciation": "pơ-tám",
            "driveId": "128ljjKgnWllpSIpoeryoqGKXik4XHd7I"
        },
        {
            "viet": "Số sáu (6)",
            "ethnic": "Tơdrốu",
            "pronunciation": "Tơ-đrốu",
            "driveId": "1drFf-_X4AoN_I5paNJMJugX4NsCuKsWx",
            "exampleViet": "Em hoàn thành bài tập trong sáu phút.",
            "exampleEthnic": "O pơklei tơdroă hriam tung tơdrốu phút."
        },
        {
            "viet": "Số bảy (7)",
            "ethnic": "Tơpah",
            "pronunciation": "Tơ-pah",
            "driveId": "1BLE9w7Zvi1gx7RtzZANTOmacX-yOG96h",
            "exampleViet": "Em có bảy quyển sách trên kệ.",
            "exampleEthnic": "O ái tơpah hla mơ-éa kơpêng a ke."
        },
        {
            "viet": "Số tám (8)",
            "ethnic": "Tơhéam",
            "pronunciation": "Tơ-hé-am",
            "driveId": "1rret_MU3PEeEJAsez08mah91dcKCxr8y",
            "exampleViet": "Có tám học sinh tham gia buổi học.",
            "exampleEthnic": "O ái tơhéam hok trò mot 'bă rơnó hok."
        },
        {
            "viet": "Số chính (9)",
            "ethnic": "Tơchéan",
            "pronunciation": "Tơ-ché-an",
            "driveId": "1doXn7Zu0l2xN5Twh3QthAtFbQZxwI8EC",
            "exampleViet": "Em giải được chín bài toán.",
            "exampleEthnic": "O pro hốm tơchéan bai Toán."
        },
        {
            "viet": "Số mười (10)",
            "ethnic": "Môi chat",
            "pronunciation": "Môi chat",
            "driveId": "1IVypzLkY0yiMlTHqUBq7j5q8zFCpFAa4",
            "exampleViet": "Em đạt điểm mười trong kỳ thi vừa rồi.",
            "exampleEthnic": "O hiă xet môi chat tung ky thi nếu hlua."
        },
        {
            "viet": "Sáng sớm",
            "ethnic": "Kơso máng",
            "pronunciation": "Kơ-so máng",
            "driveId": "1hTNMmMkzYSkr_mnvZNzaNf6CI9iWM6zt",
            "exampleViet": "Em thức dậy vào sáng sớm.",
            "exampleEthnic": "O xông koi dế kơso má."
        },
        {
            "viet": "Sao chép",
            "ethnic": "Cheh tíu",
            "pronunciation": "Cheh tíu",
            "driveId": "1Bk7kjBirHLPtZMhmPshSomkG_Gh8ILvp",
            "exampleViet": "Em sao chép tài liệu để nghiên cứu.",
            "exampleEthnic": "O cheh tíu bối hla mơ-éa va ti tá troă lẽ."
        },
        {
            "viet": "Sắp xếp",
            "ethnic": "Rơnêu",
            "pronunciation": "Rơ-nêu",
            "driveId": "1VtwJuEi1XGYA0HTz8LtpskG_pAPRMemy",
            "exampleViet": "Sắp xếp gọn gàng giúp em làm việc hiệu quả.",
            "exampleEthnic": "Rơnêu tung nai veă o pêi chiang xet."
        },
        {
            "viet": "Sau đó",
            "ethnic": "A kơnai me",
            "pronunciation": "A kơ-nai me",
            "driveId": "168ulD8UiXTEvmB0Eymsjz0LgS8CnBA3Z",
            "exampleViet": "Sau đó, em ôn lại bài cũ.",
            "exampleEthnic": "A kơnai me, o mơhriam nếu bai hok ton."
        },
        {
            "viet": "Sáu mươi",
            "ethnic": "Tơdrốu chat",
            "pronunciation": "Tơ-đrốu chat",
            "driveId": "13pgqjMF12xHOXcE6UVNoJ5pv799AK8jE",
            "exampleViet": "Em có sáu mươi phút để làm bài thi.",
            "exampleEthnic": "O ái tơdrốu chat phút va pro bai cheh."
        },
        {
            "viet": "Sau này",
            "ethnic": "So ah hmôi",
            "pronunciation": "So a h-môi",
            "driveId": "1bbcCcWXwL5a6xaywq9_Q3F9tN2V6HBbR",
            "exampleViet": "Sau này em lớn, sẽ trở thành giáo viên.",
            "exampleEthnic": "So ah hmôi o kan, o ái chiang thái cô hne hok."
        }
    ],
    "quiz": [
        [
            "1",
            "Trong tiếng Xê Đăng, \"Thứ Hai\" được gọi là gì?",
            "Hai péa",
            "Hai pái",
            "Hai pŭn",
            "Hai tiếu",
            "A",
            "Thứ ngày"
        ],
        [
            "2",
            "Từ \"Thứ Ba\" dịch sang tiếng Xê Đăng là từ nào?",
            "Hai pái",
            "Hai péa",
            "Hai tơ-drốu",
            "Hai pơ-tă",
            "A",
            "Thứ ngày"
        ],
        [
            "3",
            "Để nói \"Thứ Tư\", em chọn từ nào sau đây?",
            "Hai pŭn",
            "Hai pái",
            "Hai tơ-pah",
            "Hai kố",
            "A",
            "Thứ ngày"
        ],
        [
            "14",
            "\"Con trâu\" được gọi là gì?",
            "Kuê̆ kơpô",
            "Kuê̆ kơ-pái",
            "Kuê̆ kơ-tỏng",
            "Kuê̆ kơ-la",
            "A",
            "Con vật"
        ],
        [
            "15",
            "Để gọi \"Con bò\", người Xê Đăng dùng từ nào?",
            "Kuê̆ ro",
            "Kuê̆ rui",
            "Kuê̆ rơ-ke",
            "Kuê̆ rơ-tôu",
            "A",
            "Con vật"
        ],
        [
            "18",
            "\"Con chim\" bay trên trời gọi là:",
            "Kuê̆ chêm",
            "Kuê̆ cá",
            "Kuê̆ chu",
            "Kuê̆ chó",
            "A",
            "Con vật"
        ],
        [
            "29",
            "Từ nào sau đây chỉ số \"Bốn\" (4)?",
            "Pún",
            "Pơ-tám",
            "Tơ-héam",
            "Tơ-chěn",
            "A",
            "Số đếm"
        ],
        [
            "36",
            "Trong tiếng Xê Đăng, \"Bố\" (Cha) được gọi là gì?",
            "Pa",
            "Pốa",
            "Pái",
            "Pơ-lê",
            "A",
            "Gia đình"
        ],
        [
            "37",
            "Từ nào sau đây dùng để gọi \"Mẹ\"?",
            "Nôu",
            "Na",
            "Ngoh",
            "O",
            "A",
            "Gia đình"
        ],
        [
            "54",
            "Hành động \"Ăn\" (ăn cơm) dịch sang tiếng Xê Đăng là từ nào?",
            "Ka",
            "Ốu",
            "Koi",
            "Lám",
            "A",
            "Sinh hoạt hằng ngày"
        ],
        [
            "55",
            "Hành động \"Uống\" (uống nước, uống thuốc) là từ nào?",
            "Ốu",
            "Ka",
            "Huam",
            "Pe",
            "A",
            "Sinh hoạt hằng ngày"
        ],
        [
            "211",
            "\"Cơm\" ăn hàng ngày là từ nào?",
            "Hme",
            "Tơxông",
            "Phơ",
            "Cháu",
            "A",
            "Ẩm thực"
        ]
    ],
    "chat": [
        [
            "Ứng dụng này là gì?",
            "📱 Đây là Hệ thống hỗ trợ học tiếng Xơ Đăng trên nền tảng PWA, giúp bạn tra cứu từ điển, luyện phát âm và ôn tập kiến thức qua trò chơi tương tác."
        ],
        [
            "Mục đích của dự án là gì?",
            "❤️ Chúng mình muốn bảo tồn ngôn ngữ, văn hóa Xơ Đăng và hỗ trợ các bạn học sinh, thầy cô giáo trong việc dạy và học tiếng dân tộc một cách hiện đại."
        ],
        [
            "Ứng dụng có thu phí không?",
            "💸 Dạ không ạ. Ứng dụng hoàn toàn miễn phí 100% và không có quảng cáo, vì đây là dự án phi lợi nhuận phục vụ cộng đồng."
        ],
        [
            "Tôi muốn liên hệ tác giả?",
            "📧 Bạn có thể liên hệ qua phần Footer (cuối trang) của ứng dụng, chúng mình có để link Facebook và Email hỗ trợ nhé!"
        ],
        [
            "Làm sao để cài ứng dụng?",
            "📲 Trên Android: Nhấn dấu 3 chấm góc trên ➝ Chọn \"Thêm vào màn hình chính\".🍎 Trên iPhone: Nhấn nút Chia sẻ ➝ Chọn \"Thêm vào màn hình chính\"."
        ],
        [
            "Ứng dụng có cần mạng không?",
            "📶 Nhờ công nghệ PWA, bạn có thể tra cứu các từ đã lưu cache ngay cả khi Offline. Tuy nhiên, để nghe âm thanh mới hoặc gửi đóng góp, bạn cần có mạng nhé."
        ],
        [
            "Tại sao không nghe được tiếng?",
            "🔊 Bạn kiểm tra xem điện thoại có bật chế độ Im lặng không nhé? Một số trình duyệt cũng yêu cầu bạn phải chạm vào màn hình một lần trước khi cho phép phát âm thanh."
        ],
        [
            "Dùng trên máy tính được không?",
            "💻 Được chứ ạ! Hệ thống chạy tốt trên mọi thiết bị: Điện thoại, Máy tính bảng, Laptop và PC thông qua trình duyệt web."
        ],
        [
            "Làm sao bật chế độ tối?",
            "🌙 Bạn nhìn lên thanh Menu (hoặc nút 3 gạch trên điện thoại), chọn nút \"Dark Mode\" để chuyển sang giao diện nền tối bảo vệ mắt nhé."
        ],
        [
            "Nếu trả lời sai thì sao?",
            "📝 Đừng lo! Nếu chưa qua ải, hệ thống sẽ hiện màn hình Ôn tập liệt kê các từ vựng quan trọng để bạn học lại trước khi thử sức lần nữa."
        ]
    ]
};

export const vocabSnapshot = snapshotFallback.dictionary;
export const quizSnapshot = snapshotFallback.quiz;
export const chatSnapshot = snapshotFallback.chat;
