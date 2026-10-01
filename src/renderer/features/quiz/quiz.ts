/**
 * Quiz Feature Controller
 * Manages topic selection, flashcard study, interactive testing, and score review.
 */

import { fetchQuizData } from '@/renderer/services/sheets.service';
import {
    parseQuizRows,
    groupQuestionsByTopic,
    selectQuizQuestions,
    evaluateQuiz,
    type QuizQuestion
} from '@/renderer/services/quiz.service';
import { FlashcardManager } from './flashcard';
import { showToast } from '@/renderer/components/toast';
import { showLoading, hideLoading } from '@/renderer/components/loading-overlay';
import { eventBus } from '@/renderer/components/event-bus';

let allQuestions: QuizQuestion[] = [];
let topicsMap = new Map<string, QuizQuestion[]>();
let currentTopic = '';
let currentQuizQuestions: QuizQuestion[] = [];
let currentQuestionIndex = 0;
let userAnswers: Array<number | null> = [];
let quizTimerId: ReturnType<typeof setInterval> | null = null;
let timeElapsedSeconds = 0;

export async function initQuiz(): Promise<void> {
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

    // Listen to tab change
    eventBus.on('tab:change', (sectionId: string) => {
        if (sectionId === 'quiz' && allQuestions.length === 0) {
            loadQuizData();
        }
    });

    async function loadQuizData(): Promise<void> {
        showLoading('Đang tải câu hỏi trắc nghiệm...');
        try {
            const rawRows = await fetchQuizData();
            allQuestions = parseQuizRows(rawRows);
            topicsMap = groupQuestionsByTopic(allQuestions);
            renderTopicGrid();
        } catch (err: unknown) {
            console.error('Failed to load quiz data:', err);
            showToast('Không thể tải dữ liệu câu hỏi.', 'error');
        } finally {
            hideLoading();
        }
    }

    function renderTopicGrid(): void {
        if (!topicsGrid) return;
        topicsGrid.replaceChildren();

        const fragment = document.createDocumentFragment();
        topicsMap.forEach((questions, topicName) => {
            const card = document.createElement('div');
            card.className = 'topic-card';

            const iconDiv = document.createElement('div');
            iconDiv.className = 'topic-icon';
            iconDiv.innerHTML = '<i class="fas fa-book-reader"></i>';

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

    function selectTopic(topicName: string): void {
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

    // Flashcard Bindings
    if (flashcardElem) {
        flashcardElem.addEventListener('click', () => flashcardManager.flipCard());
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

    // Start Quiz Button
    if (startQuizBtn) {
        startQuizBtn.addEventListener('click', () => {
            const topicQuestions = topicsMap.get(currentTopic) || [];
            currentQuizQuestions = selectQuizQuestions(topicQuestions, 5);
            currentQuestionIndex = 0;
            userAnswers = new Array(currentQuizQuestions.length).fill(null);

            if (studyInterface) studyInterface.style.display = 'none';
            if (quizResult) quizResult.style.display = 'none';
            if (quizInterface) quizInterface.style.display = 'block';

            const quizTopicTitle = document.getElementById('currentQuizTopicTitle');
            if (quizTopicTitle) quizTopicTitle.textContent = `Chủ đề: ${currentTopic}`;

            startTimer();
            displayQuestion();
        });
    }

    function startTimer(): void {
        if (quizTimerId) clearInterval(quizTimerId);
        timeElapsedSeconds = 0;
        quizTimerId = setInterval(() => {
            timeElapsedSeconds++;
            if (quizTimer) {
                const mins = String(Math.floor(timeElapsedSeconds / 60)).padStart(2, '0');
                const secs = String(timeElapsedSeconds % 60).padStart(2, '0');
                quizTimer.textContent = `${mins}:${secs}`;
            }
        }, 1000);
    }

    function stopTimer(): void {
        if (quizTimerId) {
            clearInterval(quizTimerId);
            quizTimerId = null;
        }
    }

    function displayQuestion(): void {
        if (currentQuizQuestions.length === 0 || !questionText || !optionsContainer) return;

        const q = currentQuizQuestions[currentQuestionIndex];
        const currentQNum = document.getElementById('currentQuestionNumber');
        if (currentQNum) currentQNum.textContent = `${currentQuestionIndex + 1}/${currentQuizQuestions.length}`;

        questionText.textContent = q.question;
        optionsContainer.replaceChildren();

        const fragment = document.createDocumentFragment();
        q.options.forEach((optText, optIndex) => {
            const optionDiv = document.createElement('div');
            const isSelected = userAnswers[currentQuestionIndex] === optIndex + 1;
            optionDiv.className = `option ${isSelected ? 'selected' : ''}`;

            const labelSpan = document.createElement('span');
            labelSpan.className = 'option-label';
            labelSpan.textContent = `${String.fromCharCode(65 + optIndex)}. `;

            const textSpan = document.createElement('span');
            textSpan.className = 'option-text';
            textSpan.textContent = optText;

            optionDiv.appendChild(labelSpan);
            optionDiv.appendChild(textSpan);

            optionDiv.addEventListener('click', () => {
                userAnswers[currentQuestionIndex] = optIndex + 1;
                displayQuestion(); // re-render to reflect selection
            });

            fragment.appendChild(optionDiv);
        });

        optionsContainer.appendChild(fragment);

        if (prevQuestionBtn) prevQuestionBtn.disabled = currentQuestionIndex === 0;
        if (nextQuestionBtn) nextQuestionBtn.disabled = currentQuestionIndex === currentQuizQuestions.length - 1;
        if (submitQuizBtn) submitQuizBtn.disabled = userAnswers.includes(null);
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
            if (userAnswers.includes(null)) {
                showToast('Vui lòng trả lời tất cả các câu hỏi trước khi nộp bài!', 'warning');
                return;
            }
            stopTimer();
            showQuizResults();
        });
    }

    function showQuizResults(): void {
        const answersAsNumbers = userAnswers.map(a => a ?? -1);
        const { score, total, percentage, details } = evaluateQuiz(currentQuizQuestions, answersAsNumbers);

        if (quizInterface) quizInterface.style.display = 'none';
        if (quizResult) quizResult.style.display = 'block';

        const finalScore = document.getElementById('finalScore');
        const resultTopic = document.getElementById('resultTopic');
        const resultTitle = document.getElementById('resultTitle');
        const resultDesc = document.getElementById('resultDescription');
        const resultDetails = document.getElementById('resultDetails');

        if (finalScore) finalScore.textContent = String(score);
        if (resultTopic) resultTopic.textContent = `Chủ đề: ${currentTopic}`;

        if (percentage >= 80) {
            if (resultTitle) resultTitle.textContent = 'Xuất sắc!';
            if (resultDesc) resultDesc.textContent = `Bạn đã trả lời đúng ${score}/${total} câu hỏi. Rất tốt!`;
        } else if (percentage >= 50) {
            if (resultTitle) resultTitle.textContent = 'Khá tốt!';
            if (resultDesc) resultDesc.textContent = `Bạn đã trả lời đúng ${score}/${total} câu hỏi. Hãy tiếp tục ôn tập nhé!`;
        } else {
            if (resultTitle) resultTitle.textContent = 'Cần cố gắng!';
            if (resultDesc) resultDesc.textContent = `Bạn đạt ${score}/${total} điểm. Hãy học lại các thẻ từ vựng nhé!`;
        }

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
            selectTopic(currentTopic);
        });
    }

    if (newTopicBtn) {
        newTopicBtn.addEventListener('click', () => {
            if (studyInterface) studyInterface.style.display = 'none';
            if (quizInterface) quizInterface.style.display = 'none';
            if (quizResult) quizResult.style.display = 'none';
            if (topicSelection) topicSelection.style.display = 'block';
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
            } else {
                showToast('Đã sao chép liên kết vào bộ nhớ tạm!', 'info');
            }
        });
    }

    // Expose fetchStudyQuizData globally for Phase A backwards compatibility
    (window as unknown as { fetchStudyQuizData: () => Promise<void> }).fetchStudyQuizData = loadQuizData;
}
