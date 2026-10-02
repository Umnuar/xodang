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
    dictionary: [
        { viet: 'xin chào', ethnic: 'bơ rơ ha', pronunciation: 'bơ-rơ-ha', driveId: 'audio_1', exampleViet: 'Xin chào các bạn', exampleEthnic: 'Bơ rơ ha nhô ma' },
        { viet: 'cảm ơn', ethnic: 'hơ măn ơn', pronunciation: 'hơ-măn-ơn', driveId: 'audio_2', exampleViet: 'Cảm ơn bạn rất nhiều', exampleEthnic: 'Hơ măn ơn ih rơ bơ' },
        { viet: 'tạm biệt', ethnic: 'brơi', pronunciation: 'brơi', driveId: 'audio_3', exampleViet: 'Tạm biệt ngày mai gặp lại', exampleEthnic: 'Brơi phai mơ dâp' },
        { viet: 'nhà', ethnic: 'hnam', pronunciation: 'h-nam', driveId: 'audio_4', exampleViet: 'Nhà này rất đẹp', exampleEthnic: 'Hnam âu rơ dăk' },
        { viet: 'nước', ethnic: 'đak', pronunciation: 'đak', driveId: 'audio_5', exampleViet: 'Cho tôi xin nước uống', exampleEthnic: 'Ôi un đak ngôm' },
        { viet: 'cơm', ethnic: 'pơ ro', pronunciation: 'pơ-ro', driveId: 'audio_6', exampleViet: 'Ăn cơm cùng gia đình', exampleEthnic: 'Kơ pơ ro dăng hnam' },
        { viet: 'bố', ethnic: 'mê', pronunciation: 'mê', driveId: 'audio_7', exampleViet: 'Bố đi làm rẫy', exampleEthnic: 'Mê gô che mir' },
        { viet: 'mẹ', ethnic: 'mẹ', pronunciation: 'mẹ', driveId: 'audio_8', exampleViet: 'Mẹ nấu ăn ngon', exampleEthnic: 'Mẹ rang pơ ro dăk' },
        { viet: 'anh em', ethnic: 'nhô ma', pronunciation: 'nhô-ma', driveId: 'audio_9', exampleViet: 'Anh em đoàn kết', exampleEthnic: 'Nhô ma tơm gơ pôr' },
        { viet: 'núi', ethnic: 'kông', pronunciation: 'kông', driveId: 'audio_10', exampleViet: 'Núi rừng Tây Nguyên', exampleEthnic: 'Kông bri Tây Nguyên' },
        { viet: 'rừng', ethnic: 'bri', pronunciation: 'bri', driveId: 'audio_11', exampleViet: 'Bảo vệ rừng già', exampleEthnic: 'Kơ bri prôm' },
        { viet: 'mặt trời', ethnic: 'măt hơ ri', pronunciation: 'măt-hơ-ri', driveId: 'audio_12', exampleViet: 'Mặt trời mọc buổi sáng', exampleEthnic: 'Măt hơ ri rơ bơ prôi' },
        { viet: 'mặt trăng', ethnic: 'khế', pronunciation: 'khế', driveId: 'audio_13', exampleViet: 'Mặt trăng rằm sáng tỏ', exampleEthnic: 'Khế prôi plenh' },
        { viet: 'ngôi sao', ethnic: 'sơ măng', pronunciation: 'sơ-măng', driveId: 'audio_14', exampleViet: 'Ngôi sao lấp lánh trên trời', exampleEthnic: 'Sơ măng plenh mơ reng' },
        { viet: 'con bò', ethnic: 'rơ pu', pronunciation: 'rơ-pu', driveId: 'audio_15', exampleViet: 'Con bò gặm cỏ trên đồi', exampleEthnic: 'Rơ pu cha kơ nhơ' },
        { viet: 'con trâu', ethnic: 'kơ pau', pronunciation: 'kơ-pau', driveId: 'audio_16', exampleViet: 'Con trâu giúp kéo cày', exampleEthnic: 'Kơ pau dơ kơ le' },
        { viet: 'con chim', ethnic: 'chêm', pronunciation: 'chêm', driveId: 'audio_17', exampleViet: 'Con chim hót trên cành cây', exampleEthnic: 'Chêm hơ la kơ long' },
        { viet: 'con cá', ethnic: 'ka', pronunciation: 'ka', driveId: 'audio_18', exampleViet: 'Con cá bơi dưới suối', exampleEthnic: 'Ka lơi ti đak' },
        { viet: 'cây', ethnic: 'long', pronunciation: 'long', driveId: 'audio_19', exampleViet: 'Cây cối xanh tươi', exampleEthnic: 'Long kơ lo' },
        { viet: 'lá', ethnic: 'hla', pronunciation: 'hla', driveId: 'audio_20', exampleViet: 'Lá cây rụng mùa thu', exampleEthnic: 'Hla long rơ rôi' }
    ],
    quiz: [
        ['1', 'Từ "chào" trong tiếng Xơ Đăng là gì?', 'Bơ rơ ha', 'Brơi', 'Ka me', 'Hnam', '1', 'Chào hỏi'],
        ['2', 'Từ "tạm biệt" trong tiếng Xơ Đăng là gì?', 'Hnam', 'Brơi', 'Mê', 'Đak', '2', 'Chào hỏi'],
        ['3', 'Từ "nước" trong tiếng Xơ Đăng là gì?', 'Pơ ro', 'Bri', 'Đak', 'Kông', '3', 'Thiên nhiên'],
        ['4', 'Từ "núi" trong tiếng Xơ Đăng là gì?', 'Kông', 'Ka', 'Hla', 'Long', '1', 'Thiên nhiên'],
        ['5', 'Từ "rừng" trong tiếng Xơ Đăng là gì?', 'Hnam', 'Mẹ', 'Bri', 'Rơ pu', '3', 'Thiên nhiên'],
        ['6', 'Từ "cây" trong tiếng Xơ Đăng là gì?', 'Long', 'Chêm', 'Khế', 'Bri', '1', 'Thiên nhiên']
    ],
    chat: [
        ['Xin chào bằng tiếng Xơ Đăng là gì?', 'Bơ rơ ha'],
        ['Cảm ơn tiếng Xơ Đăng nói thế nào?', 'Hơ măn ơn'],
        ['Tạm biệt trong tiếng Xơ Đăng là gì?', 'Brơi'],
        ['Ứng dụng này có học offline được không?', 'Có, ứng dụng hỗ trợ lưu trữ cục bộ và hoạt động đầy đủ khi không có kết nối internet.'],
        ['Làm sao để nghe phát âm?', 'Bạn chỉ cần nhấn vào biểu tượng chiếc loa bên cạnh mỗi từ vựng để nghe âm thanh phát âm chuẩn.']
    ]
};

export const vocabSnapshot = snapshotFallback.dictionary;
export const quizSnapshot = snapshotFallback.quiz;
export const chatSnapshot = snapshotFallback.chat;
