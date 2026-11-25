/**
 * Speech Recognition Service
 * Wraps browser Web Speech Recognition API with callback handlers.
 */

export interface SpeechRecognitionCallbacks {
    onStart?: () => void;
    onResult?: (transcript: string) => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
}

export interface SpeechRecognitionInstance {
    start: () => void;
    stop: () => void;
    isSupported: boolean;
}

/**
 * Creates a speech recognition controller for Vietnamese language ('vi-VN').
 */
export function createSpeechRecognizer(callbacks: SpeechRecognitionCallbacks): SpeechRecognitionInstance {
    if (typeof window === 'undefined') {
        return { start: () => {}, stop: () => {}, isSupported: false };
    }

    const SpeechRecognitionClass = (window as unknown as {
        SpeechRecognition?: new () => any;
        webkitSpeechRecognition?: new () => any;
    }).SpeechRecognition || (window as unknown as {
        SpeechRecognition?: new () => any;
        webkitSpeechRecognition?: new () => any;
    }).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
        return { start: () => {}, stop: () => {}, isSupported: false };
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'vi-VN';

    recognition.onstart = () => {
        callbacks.onStart?.();
    };

    recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.replace(/\.$/, '').trim() || '';
        callbacks.onResult?.(transcript);
    };

    recognition.onend = () => {
        callbacks.onEnd?.();
    };

    recognition.onerror = (event: any) => {
        callbacks.onError?.(event.error || 'unknown');
    };

    return {
        start: () => {
            try {
                recognition.start();
            } catch (e) {
                // Already started or active
            }
        },
        stop: () => {
            try {
                recognition.stop();
            } catch (e) {
                // Not running
            }
        },
        isSupported: true
    };
}

export function isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
        (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    );
}

export function startSpeechRecognition(
    onResult: (text: string) => void,
    onError: (err: string) => void
): void {
    const recognizer = createSpeechRecognizer({
        onResult,
        onError
    });
    recognizer.start();
}

