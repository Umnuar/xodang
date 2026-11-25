export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
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

function parseCorrectAnswer(rawAnswer: string | undefined, optionCount: number): number {
    if (optionCount <= 0) return 1;
    const normalized = (rawAnswer ?? '').trim().toUpperCase();
    let parsed = 1;
    if (/^[A-D]$/.test(normalized)) {
        parsed = normalized.charCodeAt(0) - 64;
    } else {
        const numeric = Number.parseInt(normalized, 10);
        if (!Number.isNaN(numeric)) {
            parsed = numeric;
        }
    }
    if (parsed < 1 || parsed > optionCount) {
        return 1;
    }
    return parsed;
}

export function parseQuizRows(rows: string[][]): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    rows.forEach((row, index) => {
        const question = (row[1] ?? '').trim();
        const options = [row[2], row[3], row[4], row[5]]
            .map((opt) => (opt ?? '').trim())
            .filter((opt) => opt.length > 0);
        if (!question || options.length === 0) return;

        const rawId = (row[0] ?? '').trim();
        const id = rawId || String(index + 1);
        const correctAnswer = parseCorrectAnswer(row[6], options.length);
        const topic = (row[7] ?? '').trim() || 'Khác';

        questions.push({
            id,
            question,
            options,
            correctAnswer,
            topic
        });
    });
    return questions;
}

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

export function shuffleQuestionOptions(question: QuizQuestion): QuizQuestion {
    if (question.options.length <= 1) {
        return {
            ...question,
            options: [...question.options],
            correctAnswer: 1
        };
    }

    const indexed = question.options.map((text, idx) => ({
        text,
        isCorrect: idx + 1 === question.correctAnswer
    }));

    for (let i = indexed.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
    }

    const newCorrectIndex = indexed.findIndex((item) => item.isCorrect);
    return {
        ...question,
        options: indexed.map((item) => item.text),
        correctAnswer: newCorrectIndex >= 0 ? newCorrectIndex + 1 : 1
    };
}

export function selectQuizQuestions(pool: QuizQuestion[], count: number = 5): QuizQuestion[] {
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const selected = shuffled.length <= count ? shuffled : shuffled.slice(0, count);
    return selected.map(shuffleQuestionOptions);
}

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

    const total = questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    let title = '';
    let description = '';

    if (total > 0 && percentage === 100) {
        title = 'Xuất sắc!';
        description = 'Bạn đã trả lời đúng tất cả các câu hỏi!';
    } else if (percentage >= 80) {
        title = 'Rất tốt!';
        description = 'Bạn đã nắm rất vững kiến thức phần này.';
    } else if (percentage >= 60) {
        title = 'Khá tốt!';
        description = 'Bạn đã vượt qua bài kiểm tra. Hãy ôn tập thêm để đạt điểm cao hơn!';
    } else {
        title = 'Cần cố gắng thêm!';
        description = 'Hãy xem lại các câu trả lời sai và ôn tập lại nhé!';
    }

    return {
        score,
        total,
        percentage,
        title,
        description,
        details
    };
}
