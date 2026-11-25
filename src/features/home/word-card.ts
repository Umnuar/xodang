import type { DictionaryEntry, SearchDirection } from '@/services/dictionary.service';
import { getAudioUrl } from '@/services/offline-sync.service';
import { getLucideIcon } from '@/utils/icons';

function cleanOptionalText(value?: string): string {
    const trimmed = (value || '').trim();
    if (!trimmed) return '';
    const lower = trimmed.toLowerCase();
    if (lower === 'null' || lower === 'undefined') return '';
    return trimmed;
}

function getMatchTypeMeta(matchType?: string): { label: string; className: string } {
    switch (matchType) {
        case 'exact':
            return { label: 'Từ chính xác', className: 'match-type exact-match-type' };
        case 'accent_insensitive':
            return { label: 'Khớp không dấu', className: 'match-type fuzzy-match-type' };
        case 'partial':
            return { label: 'Khớp một phần', className: 'match-type fuzzy-match-type' };
        case 'fuzzy':
            return { label: 'Gần đúng', className: 'match-type fuzzy-match-type' };
        default:
            return { label: 'Khớp từ khóa', className: 'match-type fuzzy-match-type' };
    }
}

export function createWordCard(entry: DictionaryEntry, direction: SearchDirection): HTMLElement {
    const isVietToEthnic = direction === 'viet_to_ethnic';

    const sourceWord = isVietToEthnic ? entry.viet : entry.ethnic;
    const targetWord = isVietToEthnic ? entry.ethnic : entry.viet;
    const sourceLabel = isVietToEthnic ? 'Tiếng Việt' : 'Tiếng Xơ Đăng';
    const targetLabel = isVietToEthnic ? 'Tiếng Xơ Đăng' : 'Tiếng Việt';

    const card = document.createElement('div');
    card.className = entry.matchType === 'exact' ? 'word-card exact-match' : 'word-card';

    const wordDisplay = document.createElement('div');
    wordDisplay.className = 'word-display';

    const sourceItem = document.createElement('div');
    sourceItem.className = 'word-display-item';

    const sourceLabelDiv = document.createElement('div');
    sourceLabelDiv.className = 'word-display-label';
    sourceLabelDiv.innerHTML = `${getLucideIcon('book-open', 'lucide-icon', 16)} `;
    const sourceLabelText = document.createTextNode(`${sourceLabel}: `);
    sourceLabelDiv.appendChild(sourceLabelText);

    const matchMeta = getMatchTypeMeta(entry.matchType);
    const matchTypeSpan = document.createElement('span');
    matchTypeSpan.className = matchMeta.className;
    matchTypeSpan.textContent = matchMeta.label;
    sourceLabelDiv.appendChild(matchTypeSpan);

    const sourceValueDiv = document.createElement('div');
    sourceValueDiv.className = 'word-display-value';
    const sourceHighlight = document.createElement('span');
    sourceHighlight.className = 'highlight-word';
    sourceHighlight.textContent = sourceWord;
    sourceValueDiv.appendChild(sourceHighlight);

    sourceItem.appendChild(sourceLabelDiv);
    sourceItem.appendChild(sourceValueDiv);
    wordDisplay.appendChild(sourceItem);

    const targetItem = document.createElement('div');
    targetItem.className = 'word-display-item';

    const targetLabelDiv = document.createElement('div');
    targetLabelDiv.className = 'word-display-label';
    targetLabelDiv.innerHTML = `${getLucideIcon('globe', 'lucide-icon', 16)} `;
    targetLabelDiv.appendChild(document.createTextNode(`${targetLabel}:`));

    const targetValueDiv = document.createElement('div');
    targetValueDiv.className = 'word-display-value';
    const targetTextSpan = document.createElement('span');
    targetTextSpan.className = 'word-text';
    targetTextSpan.textContent = targetWord;
    targetValueDiv.appendChild(targetTextSpan);

    targetItem.appendChild(targetLabelDiv);
    targetItem.appendChild(targetValueDiv);
    wordDisplay.appendChild(targetItem);

    const pronunciation = cleanOptionalText(entry.pronunciation);
    if (pronunciation) {
        const pronItem = document.createElement('div');
        pronItem.className = 'word-display-item';

        const pronLabelDiv = document.createElement('div');
        pronLabelDiv.className = 'word-display-label';
        pronLabelDiv.innerHTML = `${getLucideIcon('volume-2', 'lucide-icon', 16)} `;
        pronLabelDiv.appendChild(document.createTextNode('Phiên âm (Xơ Đăng):'));

        const pronValueDiv = document.createElement('div');
        pronValueDiv.className = 'word-display-value';
        const pronSpan = document.createElement('span');
        pronSpan.className = 'pronunciation';
        pronSpan.textContent = pronunciation;
        pronValueDiv.appendChild(pronSpan);

        pronItem.appendChild(pronLabelDiv);
        pronItem.appendChild(pronValueDiv);
        wordDisplay.appendChild(pronItem);
    }

    card.appendChild(wordDisplay);

    const audioSrc = entry.driveId ? getAudioUrl(entry.driveId) : '';
    if (audioSrc) {
        const audioContainer = document.createElement('div');
        audioContainer.className = 'audio-player-container';

        const audioTitle = document.createElement('div');
        audioTitle.className = 'audio-player-title';
        audioTitle.textContent = 'Phát âm:';

        const audioElem = document.createElement('audio');
        audioElem.controls = true;
        audioElem.preload = 'none';
        audioElem.style.width = '100%';
        audioElem.style.borderRadius = '8px';

        const sourceElem = document.createElement('source');
        sourceElem.src = audioSrc;
        sourceElem.type = 'audio/webm';
        audioElem.appendChild(sourceElem);

        const fallbackText = document.createTextNode('Trình duyệt không hỗ trợ phát âm thanh.');
        audioElem.appendChild(fallbackText);

        const audioInfo = document.createElement('div');
        audioInfo.className = 'audio-info';
        audioInfo.textContent = 'Phát âm chuẩn người bản địa Xơ Đăng';

        const handleAudioError = () => {
            if (audioContainer.querySelector('.audio-error-note')) return;
            const note = document.createElement('div');
            note.className = 'audio-error-note';
            note.setAttribute('role', 'status');
            note.textContent = typeof navigator !== 'undefined' && navigator.onLine === false
                ? 'Chưa có âm thanh ngoại tuyến cho từ này. Hãy tải Gói phát âm ngoại tuyến khi có mạng.'
                : 'Không thể phát âm thanh (tệp chưa sẵn sàng hoặc trình duyệt Safari cũ chưa hỗ trợ định dạng WebM).';
            audioContainer.appendChild(note);
        };
        sourceElem.addEventListener('error', handleAudioError);
        audioElem.addEventListener('error', handleAudioError);

        audioContainer.appendChild(audioTitle);
        audioContainer.appendChild(audioElem);
        audioContainer.appendChild(audioInfo);
        card.appendChild(audioContainer);
    }

    const exampleViet = cleanOptionalText(entry.exampleViet);
    const exampleEthnic = cleanOptionalText(entry.exampleEthnic);
    if (exampleViet || exampleEthnic) {
        const exampleSec = document.createElement('div');
        exampleSec.className = 'example-section';

        const exampleTitle = document.createElement('div');
        exampleTitle.className = 'example-title';
        exampleTitle.innerHTML = `${getLucideIcon('sparkles', 'lucide-icon', 16)} Ví dụ minh họa:`;
        exampleSec.appendChild(exampleTitle);

        const exampleContent = document.createElement('div');
        exampleContent.className = 'example-content';

        if (exampleViet) {
            const exVietDiv = document.createElement('div');
            exVietDiv.className = 'example-viet';

            const exVietLabel = document.createElement('span');
            exVietLabel.className = 'example-label';
            exVietLabel.textContent = 'Tiếng Việt: ';

            const exVietText = document.createElement('span');
            exVietText.className = 'word-text';
            exVietText.textContent = exampleViet;

            exVietDiv.appendChild(exVietLabel);
            exVietDiv.appendChild(exVietText);
            exampleContent.appendChild(exVietDiv);
        }

        if (exampleEthnic) {
            const exEthDiv = document.createElement('div');
            exEthDiv.className = 'example-ethnic';

            const exEthLabel = document.createElement('span');
            exEthLabel.className = 'example-label';
            exEthLabel.textContent = 'Tiếng Xơ Đăng: ';

            const exEthText = document.createElement('span');
            exEthText.className = 'word-text';
            exEthText.textContent = exampleEthnic;

            exEthDiv.appendChild(exEthLabel);
            exEthDiv.appendChild(exEthText);
            exampleContent.appendChild(exEthDiv);
        }

        exampleSec.appendChild(exampleContent);
        card.appendChild(exampleSec);
    }

    return card;
}

export function renderWordCards(container: HTMLElement, entries: DictionaryEntry[], direction: SearchDirection): void {
    const cards = entries.map(entry => createWordCard(entry, direction));
    container.replaceChildren(...cards);
}
