import { describe, it, expect, vi, afterEach } from 'vitest';
import {
    parseQuizRows,
    groupQuestionsByTopic,
    selectQuizQuestions,
    evaluateQuiz
} from '@/services/quiz.service';
import { FlashcardManager } from '@/features/quiz/flashcard';
import { initQuiz } from '@/features/quiz/quiz';
import quizHtml from '@/features/quiz/quiz.html?raw';
import * as sheetsService from '@/services/sheets.service';
import { eventBus } from '@/utils/event-bus';

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

    it('evaluates 2-question and 10-question pools using percentage thresholds', () => {
        const twoQuestions = parseQuizRows(rawRows).slice(0, 2);
        expect(evaluateQuiz(twoQuestions, [1, 2]).title).toBe('Xuất sắc! 🎉');
        expect(evaluateQuiz(twoQuestions, [1, 1]).title).toBe('Cần cố gắng thêm! 📚');

        const tenQuestions = Array.from({ length: 10 }, (_, idx) => ({
            id: String(idx + 1),
            question: `Q${idx + 1}`,
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 1,
            topic: 'Tổng hợp'
        }));
        const eightRight = [1, 1, 1, 1, 1, 1, 1, 1, 2, 2];
        const sixRight = [1, 1, 1, 1, 1, 1, 2, 2, 2, 2];
        const fiveRight = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2];
        expect(evaluateQuiz(tenQuestions, eightRight).title).toBe('Rất tốt! 👏');
        expect(evaluateQuiz(tenQuestions, sixRight).title).toBe('Khá tốt! 👍');
        expect(evaluateQuiz(tenQuestions, fiveRight).title).toBe('Cần cố gắng thêm! 📚');
    });

    it('maps 1-indexed correctAnswer accurately to flashcard answer text', () => {
        document.body.innerHTML = quizHtml;
        const manager = new FlashcardManager();
        const questions = parseQuizRows([
            ['1', 'Chào', 'Bơ rơ ha', 'Brơi', 'Ka me', 'Hnam', '1', 'Chào hỏi'],
            ['2', 'Đáp án 4', 'Opt1', 'Opt2', 'Opt3', 'Opt4', '4', 'Chào hỏi']
        ]);

        manager.setCards('Chào hỏi', questions);
        expect(document.getElementById('flashcardAnswer')?.textContent).toBe('Bơ rơ ha');

        manager.nextCard();
        expect(document.getElementById('flashcardAnswer')?.textContent).toBe('Opt4');
    });
});

describe('Quiz UI Controller Tests', () => {
    afterEach(() => {
        eventBus.clear();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('avoids duplicate "/5" in question counter, updates maxScore dynamically, and stops timer on tab change', async () => {
        vi.useFakeTimers();
        document.body.innerHTML = `<div id="toastContainer"></div>${quizHtml}`;
        vi.spyOn(sheetsService, 'fetchQuizData').mockResolvedValue([
            ['1', 'Q1', 'A1', 'B1', 'C1', 'D1', '1', 'Chủ đề 2 câu'],
            ['2', 'Q2', 'A2', 'B2', 'C2', 'D2', '2', 'Chủ đề 2 câu']
        ]);

        await initQuiz();
        eventBus.emit('tab:change', 'quiz');
        await vi.waitFor(() => {
            expect(document.querySelectorAll('.study-quiz-topic-card').length).toBe(1);
        });

        (document.querySelector('.study-quiz-topic-card') as HTMLElement).click();

        const flashcard = document.getElementById('flashcard')!;
        flashcard.click();
        document.getElementById('nextCardBtn')!.click();
        flashcard.click();

        const startBtn = document.getElementById('startQuizBtn') as HTMLButtonElement;
        expect(startBtn.disabled).toBe(false);
        startBtn.click();

        const badgeText = document.querySelector('.quiz-progress-badge')?.textContent?.replace(/\s+/g, ' ').trim();
        expect(badgeText).toBe('Câu 1/2');

        vi.advanceTimersByTime(3000);
        expect(document.getElementById('quizTimer')?.textContent).toBe('00:03');

        eventBus.emit('tab:change', 'home');
        vi.advanceTimersByTime(4000);
        expect(document.getElementById('quizTimer')?.textContent).toBe('00:03');

        eventBus.emit('tab:change', 'quiz');
        const options = document.querySelectorAll('#optionsContainer .option');
        (options[0] as HTMLElement).click();
        document.getElementById('nextQuestionBtn')!.click();
        (document.querySelectorAll('#optionsContainer .option')[1] as HTMLElement).click();
        document.getElementById('submitQuizBtn')!.click();

        expect(document.getElementById('finalScore')?.textContent).toBe('2');
        expect(document.getElementById('maxScore')?.textContent).toBe('/2');
    });
});
