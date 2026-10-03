/**
 * Flashcard Component Controller
 * Manages 3D card flip, study progress, and persistence.
 */

import type { QuizQuestion } from '@/renderer/services/quiz.service';
import { loadStudyProgress, saveStudyProgress } from '@/renderer/services/storage.service';
import { getLucideIcon } from '@/renderer/utils/icons';

export interface StudyCard {
    index: number;
    question: string;
    fullQuestion: string;
    answer: string;
}

export class FlashcardManager {
    private cards: StudyCard[] = [];
    private currentIndex = 0;
    private currentTopic = '';
    private studiedCards = new Set<number>();
    private allTopicProgress: Map<string, Set<string>> = new Map();

    private onProgressChange?: (percent: number, isReady: boolean) => void;

    constructor(onProgressChange?: (percent: number, isReady: boolean) => void) {
        this.onProgressChange = onProgressChange;
        this.allTopicProgress = loadStudyProgress();
    }

    setCards(topic: string, questions: QuizQuestion[]): void {
        this.currentTopic = topic;
        this.currentIndex = 0;

        // Convert questions to study cards
        this.cards = questions.map((q, idx) => ({
            index: idx,
            question: q.question,
            fullQuestion: q.question,
            answer: q.options[q.correctAnswer] || q.options[0] || ''
        }));

        // Load previously studied cards for this topic
        const savedIndices = this.allTopicProgress.get(topic) || new Set<string>();
        this.studiedCards = new Set<number>(Array.from(savedIndices).map(Number));

        this.updateCardDisplay();
        this.updateProgress();
    }

    flipCard(): void {
        const flashcard = document.getElementById('flashcard');
        if (!flashcard) return;

        flashcard.classList.toggle('flipped');

        // If flipped, mark as studied
        if (flashcard.classList.contains('flipped')) {
            this.markCurrentCardStudied();
        }
    }

    prevCard(): void {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateCardDisplay();
        }
    }

    nextCard(): void {
        if (this.currentIndex < this.cards.length - 1) {
            this.currentIndex++;
            this.updateCardDisplay();
        }
    }

    private markCurrentCardStudied(): void {
        const currentCard = this.cards[this.currentIndex];
        if (!currentCard) return;

        if (!this.studiedCards.has(currentCard.index)) {
            this.studiedCards.add(currentCard.index);

            // Tick mark
            const frontTick = document.getElementById('frontTick');
            const backTick = document.getElementById('backTick');
            if (frontTick) frontTick.classList.add('visible');
            if (backTick) backTick.classList.add('visible');

            // Save progress
            this.allTopicProgress.set(this.currentTopic, new Set(Array.from(this.studiedCards).map(String)));
            saveStudyProgress(this.allTopicProgress);

            this.updateProgress();
        }
    }

    private updateCardDisplay(): void {
        if (this.cards.length === 0) return;
        const card = this.cards[this.currentIndex];
        const isStudied = this.studiedCards.has(card.index);
        const total = this.cards.length;
        const num = this.currentIndex + 1;

        // DOM elements
        const currentCardNum = document.getElementById('currentStudyCardNumber');
        const frontCardNum = document.getElementById('frontCardNumber');
        const backCardNum = document.getElementById('backCardNumber');
        const frontTick = document.getElementById('frontTick');
        const backTick = document.getElementById('backTick');
        const questionText = document.getElementById('flashcardQuestion');
        const questionFull = document.getElementById('flashcardQuestionFull');
        const answerText = document.getElementById('flashcardAnswer');
        const flashcard = document.getElementById('flashcard');
        const prevBtn = document.getElementById('prevCardBtn') as HTMLButtonElement | null;
        const nextBtn = document.getElementById('nextCardBtn') as HTMLButtonElement | null;
        const sessionProgress = document.getElementById('studySessionProgressFill');

        if (currentCardNum) currentCardNum.textContent = String(num);
        if (frontCardNum) frontCardNum.textContent = `${num}/${total}`;
        if (backCardNum) backCardNum.textContent = `${num}/${total}`;

        if (questionText) questionText.textContent = card.question;
        if (questionFull) questionFull.textContent = card.fullQuestion;
        if (answerText) answerText.textContent = card.answer;

        if (frontTick) {
            if (isStudied) frontTick.classList.add('visible');
            else frontTick.classList.remove('visible');
        }
        if (backTick) {
            if (isStudied) backTick.classList.add('visible');
            else backTick.classList.remove('visible');
        }

        // Reset flip
        if (flashcard) {
            flashcard.classList.remove('flipped');
        }

        if (prevBtn) prevBtn.disabled = this.currentIndex === 0;
        if (nextBtn) nextBtn.disabled = this.currentIndex === total - 1;

        if (sessionProgress) {
            const percent = ((this.currentIndex + 1) / total) * 100;
            sessionProgress.style.width = `${percent}%`;
        }
    }

    private updateProgress(): void {
        const total = this.cards.length;
        const studied = this.studiedCards.size;
        const percent = total > 0 ? Math.round((studied / total) * 100) : 0;

        const studyProgressFill = document.getElementById('studyProgressFill');
        const studyCompletion = document.getElementById('studyCompletion');
        const startQuizBtn = document.getElementById('startQuizBtn') as HTMLButtonElement | null;

        if (studyProgressFill) studyProgressFill.style.width = `${percent}%`;
        if (studyCompletion) studyCompletion.textContent = `${percent}% đã học`;

        const isReady = percent >= 70;
        if (startQuizBtn) {
            startQuizBtn.disabled = !isReady;
            if (isReady) {
                startQuizBtn.innerHTML = `${getLucideIcon('play', 'lucide-icon', 18)} <span>Bắt đầu kiểm tra</span>`;
            } else {
                startQuizBtn.innerHTML = `${getLucideIcon('play', 'lucide-icon', 18)} <span>Bắt đầu kiểm tra (cần học thêm ${70 - percent}%)</span>`;
            }
        }

        if (this.onProgressChange) {
            this.onProgressChange(percent, isReady);
        }
    }
}
