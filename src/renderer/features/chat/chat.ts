/**
 * Chat Feature Controller
 * Manages Chatbot widget, FAQ question matching, and safe DOM suggestions (Anti-XSS).
 */

import { fetchChatData } from '@/renderer/services/sheets.service';
import {
    parseFaqRows,
    findFaqAnswer,
    pickRandomFaqSuggestions,
    type BotFAQ
} from '@/renderer/services/faq.service';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';

export function createSuggestionButton(questionText: string, onClick: (q: string) => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'hashtag';
    btn.style.fontSize = '0.8rem';
    btn.style.padding = '6px 12px';
    btn.style.cursor = 'pointer';
    btn.textContent = questionText; // 100% Anti-XSS safe textContent
    btn.addEventListener('click', () => onClick(questionText));
    return btn;
}

export function initChat(): void {
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const chatWindow = document.getElementById('chatWindow');
    const chatNotification = document.getElementById('chatNotification');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput') as HTMLInputElement | null;
    const sendChatBtn = document.getElementById('sendChatBtn');

    let faqs: BotFAQ[] = [];
    let isChatOpen = false;

    // Load Chat FAQ Data
    async function loadFaqs(): Promise<void> {
        try {
            const rawRows = await fetchChatData();
            faqs = parseFaqRows(rawRows);
        } catch (err: unknown) {
            console.error('Failed to load chat FAQs:', err);
            // Fallback FAQ data
            faqs = [
                { question: 'Xin chào bằng tiếng Xơ Đăng là gì?', answer: 'Bơ rơ ha' },
                { question: 'Cảm ơn tiếng Xơ Đăng nói thế nào?', answer: 'Hơ măn ơn' },
                { question: 'Tạm biệt trong tiếng Xơ Đăng là gì?', answer: 'Brơi' },
                { question: 'Bạn có khỏe không?', answer: 'Brơi ha mơ hă?' },
                { question: 'Tôi khỏe, cảm ơn', answer: 'Brơi ha, hơ măn ơn' }
            ];
        }
        displayWelcome();
    }

    // Toggle Chat Window
    function toggleChat(forceOpen?: boolean): void {
        if (!chatWindow) return;
        isChatOpen = forceOpen !== undefined ? forceOpen : !isChatOpen;

        if (isChatOpen) {
            chatWindow.classList.add('active');
            localStorage.setItem(STORAGE_KEYS.HAS_OPENED_CHAT, 'true');
            if (chatNotification) chatNotification.style.display = 'none';
            if (chatInput) chatInput.focus();
        } else {
            chatWindow.classList.remove('active');
        }
    }

    if (chatToggleBtn) {
        // Notification badge initial state
        const hasOpened = localStorage.getItem(STORAGE_KEYS.HAS_OPENED_CHAT) === 'true';
        if (!hasOpened && chatNotification) {
            chatNotification.style.display = 'flex';
        }

        chatToggleBtn.addEventListener('click', () => toggleChat());
    }

    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', () => toggleChat(false));
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
        textContent.textContent = text; // Anti-XSS

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

        // 1. Welcome Bot Bubble
        displayMessage('Xin chào! Tôi là trợ lý tiếng Xơ Đăng. Tôi có thể giúp bạn tìm hiểu về ngôn ngữ và văn hóa Xơ Đăng.', 'bot');

        // 2. Suggestions Box (using safe DOM nodes)
        const suggestionsBox = document.createElement('div');
        suggestionsBox.className = 'welcome-message';

        const header = document.createElement('h4');
        header.innerHTML = '<i class="fas fa-lightbulb"></i> Gợi ý câu hỏi:';
        suggestionsBox.appendChild(header);

        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.flexWrap = 'wrap';
        buttonsContainer.style.gap = '8px';
        buttonsContainer.style.marginTop = '10px';
        buttonsContainer.style.justifyContent = 'center';

        const randomSuggestions = pickRandomFaqSuggestions(faqs, 3);
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

        // Display user message
        displayMessage(trimmed, 'user');
        if (chatInput) chatInput.value = '';

        // Show typing indicator
        const typingElem = showTypingIndicator();

        // Simulate short think delay
        await new Promise(r => setTimeout(r, 500));

        if (typingElem) typingElem.remove();

        // Find answer
        const answer = findFaqAnswer(trimmed, faqs) || 'Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Hãy thử chọn một câu hỏi gợi ý bên dưới!';
        displayMessage(answer, 'bot');

        // Render 1 safe follow-up suggestion bubble
        const newSuggestions = pickRandomFaqSuggestions(faqs, 1);
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

        chatInput.addEventListener('keypress', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleUserMessage(chatInput.value);
            }
        });
    }

    loadFaqs();
}
