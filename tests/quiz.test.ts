import { describe, it, expect } from 'vitest';
import {
    parseQuizRows,
    groupQuestionsByTopic,
    selectQuizQuestions,
    evaluateQuiz
} from '@/renderer/services/quiz.service';

describe('Quiz Service Unit Tests', () => {
    const rawRows = [
        ['1', 'Từ "chào" trong tiếng Xơ Đăng là gì?', 'Bơ rơ ha', 'Brơi', 'Ka me', 'Hnam', '1', 'Chào hỏi'],
        ['2', 'Từ "tạm biệt" là gì?', 'Hnam', 'Brơi', 'Mê', 'Đak', '2', 'Chào hỏi'],
        ['3', 'Từ "nước" là gì?', 'Pơ ro', 'Bri', 'Đak', 'Kông', '3', 'Thiên nhiên'],
        ['4', 'Từ "núi" là gì?', 'Kông', 'Ka', 'Hla', 'Long', '1', 'Thiên nhiên'],
        ['5', 'Từ "rừng" là gì?', 'Hnam', 'Mẹ', 'Bri', 'Rơ pu', '3', 'Thiên nhiên'],
        ['6', 'Từ "cây" là gì?', 'Long', 'Chêm', 'Khế', 'Bri', '1', 'Thiên nhiên']
    ];

    it('parses raw sheet rows into structured QuizQuestion objects', () => {
        const questions = parseQuizRows(rawRows);
        expect(questions.length).toBe(6);
        expect(questions[0].id).toBe('1');
        expect(questions[0].question).toBe('Từ "chào" trong tiếng Xơ Đăng là gì?');
        expect(questions[0].options).toEqual(['Bơ rơ ha', 'Brơi', 'Ka me', 'Hnam']);
        expect(questions[0].correctAnswer).toBe(1);
        expect(questions[0].topic).toBe('Chào hỏi');
    });

    it('groups questions correctly by topic', () => {
        const questions = parseQuizRows(rawRows);
        const grouped = groupQuestionsByTopic(questions);

        expect(grouped.size).toBe(2);
        expect(grouped.has('Chào hỏi')).toBe(true);
        expect(grouped.get('Chào hỏi')?.length).toBe(2);
        expect(grouped.has('Thiên nhiên')).toBe(true);
        expect(grouped.get('Thiên nhiên')?.length).toBe(4);
    });

    it('selects requested count of questions from pool', () => {
        const questions = parseQuizRows(rawRows);
        const selected = selectQuizQuestions(questions, 3);
        expect(selected.length).toBe(3);
    });

    it('evaluates quiz answers and calculates accurate score and messages', () => {
        const questions = parseQuizRows(rawRows).slice(0, 5);
        // Correct answers are [1, 2, 3, 1, 3]
        // User answers 4 correctly out of 5:
        const userAnswers = [1, 2, 3, 1, 4]; // 5th is wrong (4 instead of 3)

        const summary = evaluateQuiz(questions, userAnswers);

        expect(summary.score).toBe(4);
        expect(summary.total).toBe(5);
        expect(summary.percentage).toBe(80);
        expect(summary.title).toBe('Rất tốt! 👏');
        expect(summary.details.length).toBe(5);
        expect(summary.details[0].isCorrect).toBe(true);
        expect(summary.details[4].isCorrect).toBe(false);
    });

    it('evaluates perfect score (5/5) with "Xuất sắc!" message', () => {
        const questions = parseQuizRows(rawRows).slice(0, 5);
        const userAnswers = [1, 2, 3, 1, 3];

        const summary = evaluateQuiz(questions, userAnswers);

        expect(summary.score).toBe(5);
        expect(summary.percentage).toBe(100);
        expect(summary.title).toBe('Xuất sắc! 🎉');
    });
});
