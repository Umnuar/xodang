import '@/styles/features/quiz.css';
import '@/styles/features/flashcard.css';
import { fetchQuizData } from '@/services/sheets.service';
import {
    parseQuizRows,
    groupQuestionsByTopic,
    selectQuizQuestions,
    evaluateQuiz,
    type QuizQuestion
} from '@/services/quiz.service';
import { FlashcardManager } from './flashcard';
import { showToast } from '@/components/toast';
import { showLoading, hideLoading } from '@/components/loading-overlay';
import { eventBus } from '@/utils/event-bus';
import { getLucideIcon } from '@/utils/icons';

let allQuestions: QuizQuestion[] = [];
let topicsMap = new Map<string, QuizQuestion[]>();
let currentTopic = '';
let currentQuizQuestions: QuizQuestion[] = [];
let currentQuestionIndex = 0;
let userAnswers: Array<number | null> = [];
let quizTimerId: ReturnType<typeof setInterval> | null = null;
let timeElapsedSeconds = 0;
let isQuizActive = false;
let isLoadingQuiz = false;

function formatTime(totalSeconds: number): string {
    const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
}

export async function initQuiz(): Promise<void> {
    allQuestions = [];
    topicsMap = new Map<string, QuizQuestion[]>();
    currentTopic = '';
    currentQuizQuestions = [];
    currentQuestionIndex = 0;
    userAnswers = [];
    timeElapsedSeconds = 0;
    isQuizActive = false;
    isLoadingQuiz = false;

    const topicSelection = document.getElementById('studyQuizTopicSelection');
    const topicsGrid = document.getElementById('studyQuizTopicsGrid');
    const studyInterface = document.getElementById('studyInterface');
    const quizInterface = document.getElementById('quizInterface');
    const quizResult = document.getElementById('quizResult');

    const flashcardElem = document.getElementById('flashcard');
    const flipCardBtn = document.getElementById('flipCardBtn');
    const prevCardBtn = document.getElementById('prevCardBtn');
    const nextCardBtn = document.getElementById('nextCardBtn');
    const startQuizBtn = document.getElementById('startQuizBtn');
    const backToTopicsFromStudyBtn = document.getElementById('backToTopicsFromStudyBtn');
    const backToTopicsFromQuizBtn = document.getElementById('backToTopicsFromQuizBtn');

    const questionText = document.getElementById('questionText');
    const optionsContainer = document.getElementById('optionsContainer');
    const prevQuestionBtn = document.getElementById('prevQuestionBtn') as HTMLButtonElement | null;
    const nextQuestionBtn = document.getElementById('nextQuestionBtn') as HTMLButtonElement | null;
    const submitQuizBtn = document.getElementById('submitQuizBtn') as HTMLButtonElement | null;
    const quizTimer = document.getElementById('quizTimer');

    const retryQuizBtn = document.getElementById('retryQuizBtn');
    const newTopicBtn = document.getElementById('newTopicBtn');
    const shareResultBtn = document.getElementById('shareResultBtn');

    const flashcardManager = new FlashcardManager();

    stopTimer();

    eventBus.on('tab:change', (sectionId: string) => {
        if (sectionId === 'quiz') {
            if (allQuestions.length === 0) {
                void loadQuizData();
            } else if (isQuizActive && quizInterface && quizInterface.style.display !== 'none') {
                startTimer(false);
            }
        } else {
            stopTimer();
        }
    });

    function renderTopicErrorState(): void {
        if (!topicsGrid) return;
        topicsGrid.replaceChildren();

        const errorBox = document.createElement('div');
        errorBox.className = 'quiz-load-error';

        const msg = document.createElement('p');
        msg.textContent = 'Không thể tải dữ liệu câu hỏi. Vui lòng kiểm tra kết nối và thử lại.';

        const retryBtn = document.createElement('button');
        retryBtn.type = 'button';
        retryBtn.className = 'quiz-retry-load-btn';
        retryBtn.innerHTML = `${getLucideIcon('rotate-ccw', 'lucide-icon', 16)} <span>Thử lại</span>`;
        retryBtn.addEventListener('click', () => {
            void loadQuizData();
        });

        errorBox.appendChild(msg);
        errorBox.appendChild(retryBtn);
        topicsGrid.appendChild(errorBox);
    }

    async function loadQuizData(): Promise<void> {
        if (isLoadingQuiz) return;
        isLoadingQuiz = true;
        showLoading('Đang tải câu hỏi trắc nghiệm...');
        try {
            const rawRows = await fetchQuizData();
            allQuestions = parseQuizRows(rawRows);
            topicsMap = groupQuestionsByTopic(allQuestions);
            flashcardManager.setAllTopics(topicsMap);
            renderTopicGrid();
        } catch (err: unknown) {
            console.error('Failed to load quiz data:', err);
            showToast('Không thể tải dữ liệu câu hỏi.', 'error');
            renderTopicErrorState();
        } finally {
            isLoadingQuiz = false;
            hideLoading();
        }
    }

    function renderTopicGrid(): void {
        if (!topicsGrid) return;
        topicsGrid.replaceChildren();

        if (topicsMap.size === 0) {
            renderTopicErrorState();
            return;
        }

        const fragment = document.createDocumentFragment();
        topicsMap.forEach((questions, topicName) => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'topic-card study-quiz-topic-card';

            const iconDiv = document.createElement('div');
            iconDiv.className = 'topic-icon';
            iconDiv.innerHTML = getLucideIcon('book-open', 'lucide-icon', 22);

            const title = document.createElement('h3');
            title.textContent = topicName;

            const count = document.createElement('p');
            count.textContent = `${questions.length} câu hỏi / từ vựng`;

            card.appendChild(iconDiv);
            card.appendChild(title);
            card.appendChild(count);

            card.addEventListener('click', () => {
                selectTopic(topicName);
            });

            fragment.appendChild(card);
        });

        topicsGrid.appendChild(fragment);
    }

    function returnToTopicSelection(): void {
        isQuizActive = false;
        stopTimer();
        if (studyInterface) studyInterface.style.display = 'none';
        if (quizInterface) quizInterface.style.display = 'none';
        if (quizResult) quizResult.style.display = 'none';
        if (topicSelection) topicSelection.style.display = 'block';
        flashcardManager.updateOverallProgress();
    }

    function selectTopic(topicName: string): void {
        isQuizActive = false;
        stopTimer();
        currentTopic = topicName;
        const topicQuestions = topicsMap.get(topicName) || [];

        if (topicQuestions.length === 0) {
            showToast('Chủ đề này chưa có câu hỏi.', 'warning');
            return;
        }

        if (topicSelection) topicSelection.style.display = 'none';
        if (quizInterface) quizInterface.style.display = 'none';
        if (quizResult) quizResult.style.display = 'none';
        if (studyInterface) studyInterface.style.display = 'block';

        const topicTitle = document.getElementById('currentStudyTopicTitle');
        const totalCards = document.getElementById('totalStudyCards');
        if (topicTitle) topicTitle.textContent = `Chủ đề: ${topicName}`;
        if (totalCards) totalCards.textContent = String(topicQuestions.length);

        flashcardManager.setCards(topicName, topicQuestions);
    }

    function startQuizForCurrentTopic(): void {
        const topicQuestions = topicsMap.get(currentTopic) || [];
        if (topicQuestions.length === 0) {
            showToast('Chủ đề này chưa có câu hỏi.', 'warning');
            return;
        }

        currentQuizQuestions = selectQuizQuestions(topicQuestions, 5);
        currentQuestionIndex = 0;
        userAnswers = new Array(currentQuizQuestions.length).fill(null);
        isQuizActive = true;

        if (topicSelection) topicSelection.style.display = 'none';
        if (studyInterface) studyInterface.style.display = 'none';
        if (quizResult) quizResult.style.display = 'none';
        if (quizInterface) quizInterface.style.display = 'block';

        const quizTopicTitle = document.getElementById('currentQuizTopicTitle');
        if (quizTopicTitle) quizTopicTitle.textContent = `Chủ đề: ${currentTopic}`;

        startTimer(true);
        displayQuestion();
    }

    if (flashcardElem) {
        flashcardElem.addEventListener('click', () => flashcardManager.flipCard());
        flashcardElem.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                flashcardManager.flipCard();
            }
        });
    }
    if (flipCardBtn) {
        flipCardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            flashcardManager.flipCard();
        });
    }
    if (prevCardBtn) {
        prevCardBtn.addEventListener('click', () => flashcardManager.prevCard());
    }
    if (nextCardBtn) {
        nextCardBtn.addEventListener('click', () => flashcardManager.nextCard());
    }

    if (backToTopicsFromStudyBtn) {
        backToTopicsFromStudyBtn.addEventListener('click', () => {
            returnToTopicSelection();
        });
    }
    if (backToTopicsFromQuizBtn) {
        backToTopicsFromQuizBtn.addEventListener('click', () => {
            returnToTopicSelection();
        });
    }

    if (startQuizBtn) {
        startQuizBtn.addEventListener('click', () => {
            startQuizForCurrentTopic();
        });
    }

    function startTimer(reset: boolean = true): void {
        if (quizTimerId) clearInterval(quizTimerId);
        if (reset) {
            timeElapsedSeconds = 0;
            if (quizTimer) {
                quizTimer.textContent = '00:00';
            }
        }
        quizTimerId = setInterval(() => {
            timeElapsedSeconds++;
            if (quizTimer) {
                quizTimer.textContent = formatTime(timeElapsedSeconds);
            }
        }, 1000);
    }

    function stopTimer(): void {
        if (quizTimerId) {
            clearInterval(quizTimerId);
            quizTimerId = null;
        }
    }

    function updateSubmitButtonState(): void {
        if (!submitQuizBtn) return;
        const total = currentQuizQuestions.length;
        const answered = userAnswers.filter((ans) => ans !== null).length;
        const labelSpan = submitQuizBtn.querySelector('span');
        if (labelSpan) {
            labelSpan.textContent = total > 0 ? `Nộp bài (${answered}/${total})` : 'Nộp bài';
        }
        submitQuizBtn.disabled = false;
    }

    function selectOption(optIndex: number): void {
        userAnswers[currentQuestionIndex] = optIndex + 1;
        if (!optionsContainer) return;

        const optionButtons = optionsContainer.querySelectorAll<HTMLButtonElement>('.option');
        optionButtons.forEach((btn, idx) => {
            const isSelected = idx === optIndex;
            btn.classList.toggle('selected', isSelected);
            btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
            btn.tabIndex = isSelected ? 0 : -1;
        });

        updateSubmitButtonState();
    }

    function displayQuestion(): void {
        if (currentQuizQuestions.length === 0 || !questionText || !optionsContainer) return;

        const q = currentQuizQuestions[currentQuestionIndex];
        const currentQNum = document.getElementById('currentQuestionNumber');
        if (currentQNum) currentQNum.textContent = `${currentQuestionIndex + 1}/${currentQuizQuestions.length}`;

        questionText.textContent = q.question;
        optionsContainer.replaceChildren();

        const selectedAnswer = userAnswers[currentQuestionIndex];
        const activeFocusIndex = selectedAnswer !== null && selectedAnswer >= 1 && selectedAnswer <= q.options.length
            ? selectedAnswer - 1
            : 0;

        const fragment = document.createDocumentFragment();
        q.options.forEach((optText, optIndex) => {
            const optionBtn = document.createElement('button');
            optionBtn.type = 'button';
            optionBtn.setAttribute('role', 'radio');
            const isSelected = selectedAnswer === optIndex + 1;
            optionBtn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
            optionBtn.tabIndex = optIndex === activeFocusIndex ? 0 : -1;
            optionBtn.className = `option ${isSelected ? 'selected' : ''}`;

            const labelSpan = document.createElement('span');
            labelSpan.className = 'option-label';
            labelSpan.textContent = `${String.fromCharCode(65 + optIndex)}. `;

            const textSpan = document.createElement('span');
            textSpan.className = 'option-text';
            textSpan.textContent = optText;

            optionBtn.appendChild(labelSpan);
            optionBtn.appendChild(textSpan);

            optionBtn.addEventListener('click', () => {
                selectOption(optIndex);
            });

            optionBtn.addEventListener('keydown', (e: KeyboardEvent) => {
                const optionButtons = Array.from(optionsContainer.querySelectorAll<HTMLButtonElement>('.option'));
                const count = optionButtons.length;
                if (count === 0) return;

                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const nextIdx = (optIndex + 1) % count;
                    selectOption(nextIdx);
                    optionButtons[nextIdx]?.focus();
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const prevIdx = (optIndex - 1 + count) % count;
                    selectOption(prevIdx);
                    optionButtons[prevIdx]?.focus();
                } else if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    selectOption(optIndex);
                }
            });

            fragment.appendChild(optionBtn);
        });

        optionsContainer.appendChild(fragment);

        if (prevQuestionBtn) prevQuestionBtn.disabled = currentQuestionIndex === 0;
        if (nextQuestionBtn) nextQuestionBtn.disabled = currentQuestionIndex === currentQuizQuestions.length - 1;
        updateSubmitButtonState();
    }

    if (prevQuestionBtn) {
        prevQuestionBtn.addEventListener('click', () => {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                displayQuestion();
            }
        });
    }

    if (nextQuestionBtn) {
        nextQuestionBtn.addEventListener('click', () => {
            if (currentQuestionIndex < currentQuizQuestions.length - 1) {
                currentQuestionIndex++;
                displayQuestion();
            }
        });
    }

    if (submitQuizBtn) {
        submitQuizBtn.addEventListener('click', () => {
            const firstUnansweredIndex = userAnswers.findIndex((ans) => ans === null);
            if (firstUnansweredIndex !== -1) {
                currentQuestionIndex = firstUnansweredIndex;
                displayQuestion();
                showToast(`Vui lòng trả lời câu ${firstUnansweredIndex + 1} trước khi nộp bài!`, 'warning');
                return;
            }
            isQuizActive = false;
            stopTimer();
            showQuizResults();
        });
    }

    function showQuizResults(): void {
        const answersAsNumbers = userAnswers.map((a) => a ?? -1);
        const { score, total, title, description, details } = evaluateQuiz(currentQuizQuestions, answersAsNumbers);

        if (quizInterface) quizInterface.style.display = 'none';
        if (quizResult) quizResult.style.display = 'block';

        const finalScore = document.getElementById('finalScore');
        const maxScore = document.getElementById('maxScore');
        const resultTopic = document.getElementById('resultTopic');
        const resultTime = document.getElementById('resultTime');
        const resultTitle = document.getElementById('resultTitle');
        const resultDesc = document.getElementById('resultDescription');
        const resultDetails = document.getElementById('resultDetails');

        if (finalScore) finalScore.textContent = String(score);
        if (maxScore) maxScore.textContent = `/${total}`;
        if (resultTopic) resultTopic.textContent = `Chủ đề: ${currentTopic}`;
        if (resultTime) resultTime.textContent = `Thời gian hoàn thành: ${formatTime(timeElapsedSeconds)}`;
        if (resultTitle) resultTitle.textContent = title;
        if (resultDesc) resultDesc.textContent = description;

        if (resultDetails) {
            resultDetails.replaceChildren();
            const fragment = document.createDocumentFragment();

            details.forEach((item, idx) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = `result-detail-item ${item.isCorrect ? 'correct' : 'incorrect'}`;

                const qTitle = document.createElement('strong');
                qTitle.textContent = `Câu ${idx + 1}: ${item.question}`;

                const userAns = document.createElement('p');
                const userChoice = (item.userAnswer !== null && item.userAnswer > 0)
                    ? (item.options[item.userAnswer - 1] || 'Chưa trả lời')
                    : 'Chưa trả lời';
                userAns.textContent = `Bạn chọn: ${userChoice}`;

                const correctAns = document.createElement('p');
                correctAns.textContent = `Đáp án đúng: ${item.options[item.correctAnswer - 1] || ''}`;

                itemDiv.appendChild(qTitle);
                itemDiv.appendChild(userAns);
                itemDiv.appendChild(correctAns);
                fragment.appendChild(itemDiv);
            });

            resultDetails.appendChild(fragment);
        }
    }

    if (retryQuizBtn) {
        retryQuizBtn.addEventListener('click', () => {
            stopTimer();
            startQuizForCurrentTopic();
        });
    }

    if (newTopicBtn) {
        newTopicBtn.addEventListener('click', () => {
            returnToTopicSelection();
        });
    }

    if (shareResultBtn) {
        shareResultBtn.addEventListener('click', () => {
            if (navigator.share) {
                navigator.share({
                    title: 'Kết quả học tiếng Xơ Đăng',
                    text: `Tôi vừa hoàn thành bài kiểm tra chủ đề "${currentTopic}" trên Từ Điển Xơ Đăng!`,
                    url: window.location.href
                }).catch(() => {});
            } else if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(window.location.href)
                    .then(() => showToast('Đã sao chép liên kết vào bộ nhớ tạm!', 'info'))
                    .catch(() => showToast('Không thể sao chép liên kết.', 'error'));
            } else {
                showToast('Trình duyệt không hỗ trợ chia sẻ hoặc sao chép liên kết.', 'warning');
            }
        });
    }
}
