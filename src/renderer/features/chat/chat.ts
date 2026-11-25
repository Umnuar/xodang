import '@/renderer/styles/features/chat.css';
import { fetchChatData } from '@/renderer/services/sheets.service';
import {
    DEFAULT_FAQ_ITEMS,
    parseFaqRows,
    findFaqAnswer,
    pickRandomFaqSuggestions,
    type BotFAQ
} from '@/renderer/services/faq.service';
import { getLucideIcon } from '@/renderer/utils/icons';
import { hasOpenedChat, setHasOpenedChat } from '@/renderer/services/storage.service';

export function createSuggestionButton(questionText: string, onClick: (q: string) => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'hashtag';
    btn.style.fontSize = '0.8rem';
    btn.style.padding = '6px 12px';
    btn.style.cursor = 'pointer';
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

    let faqs: BotFAQ[] = [];
    let isChatOpen = false;
    const usedQuestions = new Set<string>();

    async function loadFaqs(): Promise<void> {
        try {
            const rawRows = await fetchChatData();
            faqs = parseFaqRows(rawRows);
        } catch (err: unknown) {
            console.error('Failed to load chat FAQs:', err);
            faqs = [...DEFAULT_FAQ_ITEMS];
        }
        displayWelcome();
    }

    function toggleChat(forceOpen?: boolean): void {
        if (!chatWindow) return;
        isChatOpen = forceOpen !== undefined ? forceOpen : !isChatOpen;

        if (isChatOpen) {
            chatWindow.classList.add('active');
            setHasOpenedChat(true);
            if (chatNotification) chatNotification.style.display = 'none';
            if (chatInput) chatInput.focus();
        } else {
            chatWindow.classList.remove('active');
        }
    }

    if (chatToggleBtn) {
        if (!hasOpenedChat() && chatNotification) {
            chatNotification.style.display = 'flex';
        }
        chatToggleBtn.addEventListener('click', () => toggleChat());
    }

    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', () => toggleChat(false));
    }

    if (autoOpen) {
        toggleChat(true);
    }

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

        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return typingDiv;
    }

    function displayWelcome(): void {
        if (!chatMessages) return;
        chatMessages.replaceChildren();

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

    loadFaqs();
}
