/**
 * Word Card Component Builder
 * Constructs dictionary result cards using native DOM APIs and textContent for strict XSS prevention.
 */

import type { DictionaryEntry, SearchDirection } from '@/renderer/services/dictionary.service';

export function createWordCard(entry: DictionaryEntry, direction: SearchDirection): HTMLElement {
    const isVietToEthnic = direction === 'viet_to_ethnic';

    const sourceWord = isVietToEthnic ? entry.viet : entry.ethnic;
    const targetWord = isVietToEthnic ? entry.ethnic : entry.viet;
    const sourceLabel = isVietToEthnic ? 'Tiếng Việt' : 'Tiếng Xơ Đăng';
    const targetLabel = isVietToEthnic ? 'Tiếng Xơ Đăng' : 'Tiếng Việt';

    const card = document.createElement('div');
    card.className = 'word-card exact-match';

    const wordDisplay = document.createElement('div');
    wordDisplay.className = 'word-display';

    // 1. Source Word Item
    const sourceItem = document.createElement('div');
    sourceItem.className = 'word-display-item';

    const sourceLabelDiv = document.createElement('div');
    sourceLabelDiv.className = 'word-display-label';
    sourceLabelDiv.innerHTML = '<i class="fas fa-language"></i> ';
    const sourceLabelText = document.createTextNode(`${sourceLabel}: `);
    sourceLabelDiv.appendChild(sourceLabelText);

    const matchTypeSpan = document.createElement('span');
    matchTypeSpan.className = 'match-type exact-match-type';
    matchTypeSpan.textContent = 'Từ chính xác';
    sourceLabelDiv.appendChild(matchTypeSpan);

    const sourceValueDiv = document.createElement('div');
    sourceValueDiv.className = 'word-display-value';
    const sourceHighlight = document.createElement('span');
    sourceHighlight.className = 'highlight-word';
    sourceHighlight.textContent = sourceWord; // Safe textContent
    sourceValueDiv.appendChild(sourceHighlight);

    sourceItem.appendChild(sourceLabelDiv);
    sourceItem.appendChild(sourceValueDiv);
    wordDisplay.appendChild(sourceItem);

    // 2. Target Word Item
    const targetItem = document.createElement('div');
    targetItem.className = 'word-display-item';

    const targetLabelDiv = document.createElement('div');
    targetLabelDiv.className = 'word-display-label';
    targetLabelDiv.innerHTML = '<i class="fas fa-flag"></i> ';
    targetLabelDiv.appendChild(document.createTextNode(`${targetLabel}:`));

    const targetValueDiv = document.createElement('div');
    targetValueDiv.className = 'word-display-value';
    const targetTextSpan = document.createElement('span');
    targetTextSpan.className = 'word-text';
    targetTextSpan.textContent = targetWord; // Safe textContent
    targetValueDiv.appendChild(targetTextSpan);

    targetItem.appendChild(targetLabelDiv);
    targetItem.appendChild(targetValueDiv);
    wordDisplay.appendChild(targetItem);

    // 3. Pronunciation Item (if present)
    if (entry.pronunciation && entry.pronunciation.trim() !== '') {
        const pronItem = document.createElement('div');
        pronItem.className = 'word-display-item';

        const pronLabelDiv = document.createElement('div');
        pronLabelDiv.className = 'word-display-label';
        pronLabelDiv.innerHTML = '<i class="fas fa-volume-up"></i> ';
        pronLabelDiv.appendChild(document.createTextNode('Phiên âm (Xơ Đăng):'));

        const pronValueDiv = document.createElement('div');
        pronValueDiv.className = 'word-display-value';
        const pronSpan = document.createElement('span');
        pronSpan.className = 'pronunciation';
        pronSpan.textContent = entry.pronunciation; // Safe textContent
        pronValueDiv.appendChild(pronSpan);

        pronItem.appendChild(pronLabelDiv);
        pronItem.appendChild(pronValueDiv);
        wordDisplay.appendChild(pronItem);
    }

    card.appendChild(wordDisplay);

    // 4. Audio Player (Local .webm, offline PWA compatible)
    if (entry.driveId && entry.driveId.trim() !== '' && entry.driveId !== 'null' && entry.driveId !== 'undefined') {
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
        sourceElem.src = `./audio/${encodeURIComponent(entry.driveId.trim())}.webm`;
        sourceElem.type = 'audio/webm';
        audioElem.appendChild(sourceElem);

        const fallbackText = document.createTextNode('Trình duyệt không hỗ trợ phát âm thanh.');
        audioElem.appendChild(fallbackText);

        const audioInfo = document.createElement('div');
        audioInfo.className = 'audio-info';
        audioInfo.textContent = 'Phát âm chuẩn người bản địa Xơ đăng';

        audioContainer.appendChild(audioTitle);
        audioContainer.appendChild(audioElem);
        audioContainer.appendChild(audioInfo);
        card.appendChild(audioContainer);
    }

    // 5. Example Section (if present)
    if ((entry.exampleViet && entry.exampleViet.trim() !== '') || (entry.exampleEthnic && entry.exampleEthnic.trim() !== '')) {
        const exampleSec = document.createElement('div');
        exampleSec.className = 'example-section';

        const exampleTitle = document.createElement('div');
        exampleTitle.className = 'example-title';
        exampleTitle.innerHTML = '<i class="fas fa-comment-alt"></i> Ví dụ minh họa:';
        exampleSec.appendChild(exampleTitle);

        const exampleContent = document.createElement('div');
        exampleContent.className = 'example-content';

        if (entry.exampleViet && entry.exampleViet.trim() !== '') {
            const exVietDiv = document.createElement('div');
            exVietDiv.className = 'example-viet';

            const exVietLabel = document.createElement('span');
            exVietLabel.className = 'example-label';
            exVietLabel.textContent = 'Tiếng Việt: ';

            const exVietText = document.createElement('span');
            exVietText.className = 'word-text';
            exVietText.textContent = entry.exampleViet; // Safe textContent

            exVietDiv.appendChild(exVietLabel);
            exVietDiv.appendChild(exVietText);
            exampleContent.appendChild(exVietDiv);
        }

        if (entry.exampleEthnic && entry.exampleEthnic.trim() !== '') {
            const exEthDiv = document.createElement('div');
            exEthDiv.className = 'example-ethnic';

            const exEthLabel = document.createElement('span');
            exEthLabel.className = 'example-label';
            exEthLabel.textContent = 'Tiếng Xơ Đăng: ';

            const exEthText = document.createElement('span');
            exEthText.className = 'word-text';
            exEthText.textContent = entry.exampleEthnic; // Safe textContent

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
