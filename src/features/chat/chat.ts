import '@/styles/features/chat.css';
import { fetchChatData } from '@/services/sheets.service';
import {
    getInitialFaqItems,
    parseFaqRows,
    findFaqAnswer,
    pickRandomFaqSuggestions,
    type BotFAQ
} from '@/services/faq.service';
import { getLucideIcon } from '@/utils/icons';
import { hasOpenedChat, setHasOpenedChat } from '@/services/storage.service';
import { eventBus } from '@/utils/event-bus';

export function createSuggestionButton(questionText: string, onClick: (q: string) => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chat-suggestion-btn';
    btn.textContent = questionText;
    btn.addEventListener('click', () => onClick(questionText));
    return btn;
}

export function initChat(autoOpen: boolean = false): void {
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const chatWindow = document.getElementById('chatWindow');
    const chatNotification = document.getElementById('chatNotification');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput') as HTMLInputElement | null;
    const sendChatBtn = document.getElementById('sendChatBtn');

    let faqs: BotFAQ[] = getInitialFaqItems();
    let isChatOpen = false;
    const usedQuestions = new Set<string>();

    if (chatMessages) {
        chatMessages.setAttribute('role', 'log');
        chatMessages.setAttribute('aria-live', 'polite');
    }

    if (chatToggleBtn) {
        chatToggleBtn.setAttribute('aria-controls', 'chatWindow');
        chatToggleBtn.setAttribute('aria-expanded', 'false');
    }

    async function loadFaqs(): Promise<void> {
        try {
            const rawRows = await fetchChatData();
            const loadedFaqs = parseFaqRows(rawRows);
            if (loadedFaqs.length > 0) {
                faqs = loadedFaqs;
            }
        } catch (err: unknown) {
            console.error('Failed to load chat FAQs:', err);
            if (faqs.length === 0) {
                faqs = getInitialFaqItems();
            }
        }
        if (chatMessages && chatMessages.children.length === 0) {
            displayWelcome();
        }
    }

    function toggleChat(forceOpen?: boolean, returnFocus: boolean = false): void {
        if (!chatWindow) return;
        isChatOpen = forceOpen !== undefined ? forceOpen : !isChatOpen;

        if (chatToggleBtn) {
            chatToggleBtn.setAttribute('aria-expanded', String(isChatOpen));
        }

        if (isChatOpen) {
            chatWindow.classList.add('active');
            setHasOpenedChat(true);
            if (chatNotification) chatNotification.style.display = 'none';
            if (chatInput) chatInput.focus();
        } else {
            chatWindow.classList.remove('active');
            if (returnFocus && chatToggleBtn) {
                chatToggleBtn.focus();
            }
        }
    }

    if (chatToggleBtn) {
        if (!hasOpenedChat() && chatNotification) {
            chatNotification.style.display = 'flex';
        }
        chatToggleBtn.addEventListener('click', () => toggleChat());
    }

    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', () => toggleChat(false, true));
    }

    document.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isChatOpen) {
            e.preventDefault();
            toggleChat(false, true);
        }
    });

    eventBus.on('tab:change', () => {
        if (isChatOpen && window.innerWidth <= 768) {
            toggleChat(false, false);
        }
    });

    function formatCurrentTime(): string {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    function displayMessage(text: string, sender: 'user' | 'bot'): void {
        if (!chatMessages) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;

        const textContent = document.createElement('div');
        textContent.textContent = text;

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = formatCurrentTime();

        msgDiv.appendChild(textContent);
        msgDiv.appendChild(timeDiv);

        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator(): HTMLElement | null {
        if (!chatMessages) return null;
        chatMessages.querySelectorAll('.typing-indicator').forEach(el => el.remove());

        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'typing-dot';
            typingDiv.appendChild(dot);
        }
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return typingDiv;
    }

    function displayWelcome(): void {
        if (!chatMessages || chatMessages.children.length > 0) return;

        displayMessage('Xin chào! Tôi là trợ lý tiếng Xơ Đăng. Tôi có thể giúp bạn tìm hiểu về ngôn ngữ và văn hóa Xơ Đăng.', 'bot');

        const suggestionsBox = document.createElement('div');
        suggestionsBox.className = 'welcome-message';

        const header = document.createElement('h4');
        header.innerHTML = `${getLucideIcon('lightbulb', 'lucide-icon', 16)} <span>Gợi ý câu hỏi:</span>`;
        suggestionsBox.appendChild(header);

        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.flexWrap = 'wrap';
        buttonsContainer.style.gap = '8px';
        buttonsContainer.style.marginTop = '10px';
        buttonsContainer.style.justifyContent = 'center';

        const randomSuggestions = pickRandomFaqSuggestions(faqs, 3, usedQuestions);
        randomSuggestions.forEach((q: BotFAQ) => {
            const btn = createSuggestionButton(q.question, (selectedQuestion: string) => {
                handleUserMessage(selectedQuestion);
            });
            buttonsContainer.appendChild(btn);
        });

        suggestionsBox.appendChild(buttonsContainer);
        chatMessages.appendChild(suggestionsBox);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function handleUserMessage(message: string): Promise<void> {
        const trimmed = message.trim();
        if (!trimmed || !chatMessages) return;

        displayMessage(trimmed, 'user');
        if (chatInput) chatInput.value = '';

        const typingElem = showTypingIndicator();
        await new Promise(r => setTimeout(r, 500));
        if (typingElem) typingElem.remove();

        const answer = findFaqAnswer(trimmed, faqs) || 'Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Hãy thử chọn một câu hỏi gợi ý bên dưới!';
        displayMessage(answer, 'bot');

        const newSuggestions = pickRandomFaqSuggestions(faqs, 1, usedQuestions);
        if (newSuggestions.length > 0) {
            const followUpBox = document.createElement('div');
            followUpBox.style.marginTop = '8px';
            followUpBox.style.textAlign = 'center';

            const btn = createSuggestionButton(newSuggestions[0].question, (q: string) => {
                handleUserMessage(q);
            });
            followUpBox.appendChild(btn);
            chatMessages.appendChild(followUpBox);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    if (sendChatBtn && chatInput) {
        sendChatBtn.addEventListener('click', () => {
            handleUserMessage(chatInput.value);
        });

        chatInput.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleUserMessage(chatInput.value);
            }
        });
    }

    displayWelcome();
    if (autoOpen) {
        toggleChat(true);
    }
    void loadFaqs();
}
