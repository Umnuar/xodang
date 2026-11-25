import type { QuizQuestion } from '@/services/quiz.service';
import { loadStudyProgress, saveStudyProgress } from '@/services/storage.service';
import { getLucideIcon } from '@/utils/icons';

export interface StudyCard {
    id: string;
    index: number;
    question: string;
    answer: string;
}

export class FlashcardManager {
    private cards: StudyCard[] = [];
    private currentIndex = 0;
    private currentTopic = '';
    private studiedCards = new Set<string>();
    private allTopicProgress: Map<string, Set<string>> = new Map();
    private allTopicsQuestions: Map<string, QuizQuestion[]> = new Map();
    private completionTimerId: ReturnType<typeof setTimeout> | null = null;

    private onProgressChange?: (percent: number, isReady: boolean) => void;

    constructor(onProgressChange?: (percent: number, isReady: boolean) => void) {
        this.onProgressChange = onProgressChange;
        this.allTopicProgress = loadStudyProgress();
    }

    setAllTopics(topicsMap: Map<string, QuizQuestion[]>): void {
        this.allTopicsQuestions = new Map(topicsMap);
        let anyMigrated = false;

        this.allTopicsQuestions.forEach((questions, topic) => {
            const { ids, migrated } = this.resolveTopicStudiedIds(topic, questions);
            if (migrated) {
                anyMigrated = true;
                if (ids.size > 0) {
                    this.allTopicProgress.set(topic, ids);
                } else {
                    this.allTopicProgress.delete(topic);
                }
            }
        });

        if (anyMigrated) {
            saveStudyProgress(this.allTopicProgress);
        }

        this.updateOverallProgress();
    }

    private resolveTopicStudiedIds(topic: string, questions: QuizQuestion[]): { ids: Set<string>; migrated: boolean } {
        const validIds = new Set(questions.map((q) => q.id));
        const saved = this.allTopicProgress.get(topic);
        if (!saved || saved.size === 0) {
            return { ids: new Set<string>(), migrated: false };
        }

        const entries = Array.from(saved);
        const hasLegacyZero = !validIds.has('0') && saved.has('0');
        const allInvalidAsIds = entries.every((entry) => !validIds.has(entry));
        const shouldMigrateLegacyIndices =
            (hasLegacyZero || allInvalidAsIds) &&
            entries.some((entry) => /^\d+$/.test(entry) && Number(entry) >= 0 && Number(entry) < questions.length);

        const resolved = new Set<string>();
        if (shouldMigrateLegacyIndices) {
            entries.forEach((entry) => {
                if (/^\d+$/.test(entry)) {
                    const idx = Number(entry);
                    if (idx >= 0 && idx < questions.length) {
                        resolved.add(questions[idx].id);
                    }
                } else if (validIds.has(entry)) {
                    resolved.add(entry);
                }
            });
        } else {
            entries.forEach((entry) => {
                if (validIds.has(entry)) {
                    resolved.add(entry);
                }
            });
        }

        const migrated =
            resolved.size !== saved.size ||
            Array.from(resolved).some((id) => !saved.has(id));

        return { ids: resolved, migrated };
    }

    setCards(topic: string, questions: QuizQuestion[]): void {
        this.currentTopic = topic;
        this.currentIndex = 0;

        if (!this.allTopicsQuestions.has(topic)) {
            this.allTopicsQuestions.set(topic, questions);
        }

        this.cards = questions.map((q, idx) => ({
            id: q.id,
            index: idx,
            question: q.question,
            answer: q.options[q.correctAnswer - 1] ?? q.options[0] ?? ''
        }));

        const { ids, migrated } = this.resolveTopicStudiedIds(topic, questions);
        this.studiedCards = ids;

        if (migrated) {
            if (ids.size > 0) {
                this.allTopicProgress.set(topic, new Set(ids));
            } else {
                this.allTopicProgress.delete(topic);
            }
            saveStudyProgress(this.allTopicProgress);
        }

        this.updateCardDisplay();
        this.updateProgress();
    }

    flipCard(): void {
        const flashcard = document.getElementById('flashcard');
        if (!flashcard) return;

        const isFlipped = flashcard.classList.toggle('flipped');
        flashcard.setAttribute('aria-pressed', isFlipped ? 'true' : 'false');

        const flipBtn = document.getElementById('flipCardBtn');
        if (flipBtn) {
            flipBtn.setAttribute('aria-pressed', isFlipped ? 'true' : 'false');
        }

        if (isFlipped) {
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

        if (!this.studiedCards.has(currentCard.id)) {
            this.studiedCards.add(currentCard.id);

            const frontTick = document.getElementById('frontTick');
            const backTick = document.getElementById('backTick');
            if (frontTick) frontTick.classList.add('visible');
            if (backTick) backTick.classList.add('visible');

            const completionEffect = document.getElementById('cardCompletionEffect');
            if (completionEffect) {
                if (this.completionTimerId) clearTimeout(this.completionTimerId);
                completionEffect.classList.add('active');
                this.completionTimerId = setTimeout(() => {
                    completionEffect.classList.remove('active');
                    this.completionTimerId = null;
                }, 400);
            }

            this.allTopicProgress.set(this.currentTopic, new Set(this.studiedCards));
            saveStudyProgress(this.allTopicProgress);

            this.updateProgress();
        }
    }

    private updateCardDisplay(): void {
        if (this.cards.length === 0) return;
        const card = this.cards[this.currentIndex];
        const isStudied = this.studiedCards.has(card.id);
        const total = this.cards.length;
        const num = this.currentIndex + 1;

        const currentCardNum = document.getElementById('currentStudyCardNumber');
        const frontCardNum = document.getElementById('frontCardNumber');
        const backCardNum = document.getElementById('backCardNumber');
        const frontTick = document.getElementById('frontTick');
        const backTick = document.getElementById('backTick');
        const questionText = document.getElementById('flashcardQuestion');
        const questionFull = document.getElementById('flashcardQuestionFull');
        const answerText = document.getElementById('flashcardAnswer');
        const flashcard = document.getElementById('flashcard');
        const flipBtn = document.getElementById('flipCardBtn');
        const prevBtn = document.getElementById('prevCardBtn') as HTMLButtonElement | null;
        const nextBtn = document.getElementById('nextCardBtn') as HTMLButtonElement | null;
        const sessionProgress = document.getElementById('studySessionProgressFill');

        if (flashcard) {
            if (flashcard.classList.contains('flipped')) {
                flashcard.style.transition = 'none';
                flashcard.classList.remove('flipped');
                void flashcard.offsetWidth;
                flashcard.style.transition = '';
            } else {
                flashcard.classList.remove('flipped');
            }
            flashcard.setAttribute('aria-pressed', 'false');
        }
        if (flipBtn) {
            flipBtn.setAttribute('aria-pressed', 'false');
        }

        if (currentCardNum) currentCardNum.textContent = String(num);
        if (frontCardNum) frontCardNum.textContent = `${num}/${total}`;
        if (backCardNum) backCardNum.textContent = `${num}/${total}`;

        if (questionText) questionText.textContent = card.question;
        if (questionFull) questionFull.textContent = card.question;
        if (answerText) answerText.textContent = card.answer;

        if (frontTick) {
            frontTick.classList.toggle('visible', isStudied);
        }
        if (backTick) {
            backTick.classList.toggle('visible', isStudied);
        }

        if (prevBtn) prevBtn.disabled = this.currentIndex === 0;
        if (nextBtn) nextBtn.disabled = this.currentIndex === total - 1;

        if (sessionProgress) {
            const percent = Math.min(100, Math.round(((this.currentIndex + 1) / total) * 100));
            sessionProgress.style.width = `${percent}%`;
            const progressBar = sessionProgress.closest('[role="progressbar"]');
            if (progressBar) {
                progressBar.setAttribute('aria-valuenow', String(percent));
            }
        }
    }

    updateOverallProgress(): void {
        let totalCards = 0;
        let totalStudied = 0;

        if (this.allTopicsQuestions.size > 0) {
            this.allTopicsQuestions.forEach((questions, topic) => {
                totalCards += questions.length;
                const { ids } = this.resolveTopicStudiedIds(topic, questions);
                totalStudied += Math.min(ids.size, questions.length);
            });
        } else {
            totalCards = this.cards.length;
            totalStudied = Math.min(this.studiedCards.size, totalCards);
        }

        const overallPercent = totalCards > 0 ? Math.min(100, Math.round((totalStudied / totalCards) * 100)) : 0;
        const studyProgressFill = document.getElementById('studyProgressFill');
        if (studyProgressFill) {
            studyProgressFill.style.width = `${overallPercent}%`;
            const progressBar = studyProgressFill.closest('[role="progressbar"]');
            if (progressBar) {
                progressBar.setAttribute('aria-valuenow', String(overallPercent));
            }
        }
    }

    private updateProgress(): void {
        const total = this.cards.length;
        const studied = Math.min(this.studiedCards.size, total);
        const percent = total > 0 ? Math.min(100, Math.round((studied / total) * 100)) : 0;

        const studyCompletion = document.getElementById('studyCompletion');
        const startQuizBtn = document.getElementById('startQuizBtn') as HTMLButtonElement | null;

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

        this.updateOverallProgress();

        if (this.onProgressChange) {
            this.onProgressChange(percent, isReady);
        }
    }
}
