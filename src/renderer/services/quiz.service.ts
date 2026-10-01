/**
 * Quiz Service
 * Handles quiz questions extraction, topic grouping, question selection, and score calculation.
 */

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number; // 1-indexed (1, 2, 3, 4)
    topic: string;
}

export interface QuizEvaluationItem {
    question: string;
    userAnswer: number | null;
    correctAnswer: number;
    options: string[];
    isCorrect: boolean;
}

export interface QuizSummary {
    score: number;
    total: number;
    percentage: number;
    title: string;
    description: string;
    details: QuizEvaluationItem[];
}

/**
 * Parses raw Google Sheet rows into QuizQuestion array.
 */
export function parseQuizRows(rows: string[][]): QuizQuestion[] {
    return rows.map((row, index) => ({
        id: row[0] || String(index + 1),
        question: row[1] || 'Câu hỏi',
        options: [
            row[2] || '',
            row[3] || '',
            row[4] || '',
            row[5] || ''
        ],
        correctAnswer: parseInt(row[6], 10) || 1,
        topic: (row[7] || 'Khác').trim()
    })).filter(q => q.question && q.options.some(opt => opt.length > 0));
}

/**
 * Groups questions by their topic name.
 */
export function groupQuestionsByTopic(questions: QuizQuestion[]): Map<string, QuizQuestion[]> {
    const topics = new Map<string, QuizQuestion[]>();
    for (const q of questions) {
        const topic = q.topic || 'Khác';
        if (!topics.has(topic)) {
            topics.set(topic, []);
        }
        topics.get(topic)!.push(q);
    }
    return topics;
}

/**
 * Selects up to `count` questions randomly from a topic pool.
 */
export function selectQuizQuestions(pool: QuizQuestion[], count: number = 5): QuizQuestion[] {
    if (pool.length <= count) {
        return [...pool];
    }
    // Fisher-Yates shuffle copy
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
}

/**
 * Evaluates user answers and returns a complete score summary.
 */
export function evaluateQuiz(
    questions: QuizQuestion[],
    userAnswers: (number | null)[]
): QuizSummary {
    let score = 0;
    const details: QuizEvaluationItem[] = [];

    questions.forEach((question, index) => {
        const userAnswer = userAnswers[index] ?? null;
        const isCorrect = userAnswer === question.correctAnswer;

        if (isCorrect) {
            score++;
        }

        details.push({
            question: question.question,
            userAnswer,
            correctAnswer: question.correctAnswer,
            options: question.options,
            isCorrect
        });
    });

    let title = '';
    let description = '';

    if (score === questions.length) {
        title = 'Xuất sắc! 🎉';
        description = 'Bạn đã trả lời đúng tất cả các câu hỏi!';
    } else if (score >= 4) {
        title = 'Rất tốt! 👏';
        description = 'Bạn đã nắm rất vững kiến thức phần này.';
    } else if (score >= 3) {
        title = 'Khá tốt! 👍';
        description = 'Bạn đã vượt qua bài kiểm tra. Hãy ôn tập thêm để đạt điểm cao hơn!';
    } else {
        title = 'Cần cố gắng thêm! 📚';
        description = 'Hãy xem lại các câu trả lời sai và ôn tập lại nhé!';
    }

    return {
        score,
        total: questions.length,
        percentage: questions.length > 0 ? Math.round((score / questions.length) * 100) : 0,
        title,
        description,
        details
    };
}
