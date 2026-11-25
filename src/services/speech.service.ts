import { STORAGE_KEYS } from '@/shared/constants/storage-keys';
import { getRawStorageItem, removeStorageItem, setRawStorageItem } from './storage.service';

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

export type SpeechTier = 'on-device' | 'cloud' | 'keyboard' | 'wasm';
export type SpeechAvailability = 'available' | 'downloadable' | 'downloading' | 'unavailable';

export interface SpeechTierResolutionInput {
    hasWebSpeech: boolean;
    onDeviceStatus: SpeechAvailability;
    isOnline: boolean;
    hasWasmCached: boolean;
    canUseWasm: boolean;
}

export interface SpeechFallbackInfo {
    reason: string;
    isOnline: boolean;
    canUseWasm: boolean;
    isWasmCached: boolean;
}

export interface SmartSpeechCallbacks {
    onTierSelected?: (tier: SpeechTier) => void;
    onStatus?: (message: string) => void;
    onStart?: (tier: SpeechTier) => void;
    onProcessing?: (tier: SpeechTier) => void;
    onResult?: (transcript: string, tier: SpeechTier) => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
    onFallbackKeyboard?: (info: SpeechFallbackInfo) => void;
    forceWasm?: boolean;
}

export interface SmartSpeechHandle {
    readonly tier: SpeechTier;
    stop: () => void;
}

interface SpeechRecognitionConstructor {
    new (): any;
    available?: (options: { langs: string[]; processLocally?: boolean }) => Promise<SpeechAvailability>;
    install?: (options: { langs: string[]; quality?: string }) => Promise<boolean>;
}

const CASCADE_ERRORS = new Set(['language-not-supported', 'service-not-allowed', 'network']);

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | undefined {
    if (typeof window === 'undefined') return undefined;
    const win = window as unknown as {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    return win.SpeechRecognition || win.webkitSpeechRecognition;
}

export function resolvePreferredSpeechTier(input: SpeechTierResolutionInput): SpeechTier {
    if (input.hasWebSpeech && (input.onDeviceStatus === 'available' || (input.onDeviceStatus === 'downloadable' && input.isOnline))) {
        return 'on-device';
    }
    if (input.hasWebSpeech && input.isOnline) {
        return 'cloud';
    }
    if (input.hasWasmCached && input.canUseWasm) {
        return 'wasm';
    }
    return 'keyboard';
}

export async function checkOnDeviceVietnameseAvailability(): Promise<SpeechAvailability> {
    const SpeechRecognitionClass = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionClass || typeof SpeechRecognitionClass.available !== 'function') {
        return 'unavailable';
    }
    try {
        const status = await SpeechRecognitionClass.available({
            langs: ['vi-VN'],
            processLocally: true
        });
        if (status === 'available' || status === 'downloadable' || status === 'downloading' || status === 'unavailable') {
            return status;
        }
        return 'unavailable';
    } catch {
        return 'unavailable';
    }
}

export async function installOnDeviceVietnamesePack(): Promise<boolean> {
    const SpeechRecognitionClass = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionClass || typeof SpeechRecognitionClass.install !== 'function') {
        return false;
    }
    try {
        const installed = await SpeechRecognitionClass.install({
            langs: ['vi-VN']
        });
        return installed !== false;
    } catch {
        return false;
    }
}

export function canUseWasmSpeechFallback(): boolean {
    return (
        typeof window !== 'undefined' &&
        typeof Worker !== 'undefined' &&
        typeof WebAssembly === 'object' &&
        typeof navigator !== 'undefined' &&
        Boolean(navigator.mediaDevices?.getUserMedia)
    );
}

export function isWasmSpeechCached(): boolean {
    return getRawStorageItem(STORAGE_KEYS.STT_WASM_READY) === 'true';
}

export function setWasmSpeechCached(ready: boolean): void {
    if (ready) {
        setRawStorageItem(STORAGE_KEYS.STT_WASM_READY, 'true');
    } else {
        removeStorageItem(STORAGE_KEYS.STT_WASM_READY);
    }
}

export function createSpeechRecognizer(
    callbacks: SpeechRecognitionCallbacks,
    options?: { processLocally?: boolean }
): SpeechRecognitionInstance {
    const SpeechRecognitionClass = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionClass) {
        return { start: () => {}, stop: () => {}, isSupported: false };
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'vi-VN';
    if (options?.processLocally) {
        recognition.processLocally = true;
    }

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
            } catch {
                return;
            }
        },
        stop: () => {
            try {
                recognition.stop();
            } catch {
                return;
            }
        },
        isSupported: true
    };
}

export function isSpeechRecognitionSupported(): boolean {
    return Boolean(getSpeechRecognitionConstructor());
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

export async function startSmartVietnameseSpeech(callbacks: SmartSpeechCallbacks): Promise<SmartSpeechHandle> {
    let activeTier: SpeechTier = 'keyboard';
    let stopped = false;
    let activeStop: () => void = () => {};

    const createHandle = (): SmartSpeechHandle => ({
        get tier() {
            return activeTier;
        },
        stop: () => {
            stopped = true;
            activeStop();
        }
    });

    const isNavigatorOnline = (): boolean => (typeof navigator === 'undefined' ? true : navigator.onLine);

    const triggerKeyboardFallback = (reason: string): void => {
        activeTier = 'keyboard';
        callbacks.onTierSelected?.('keyboard');
        callbacks.onFallbackKeyboard?.({
            reason,
            isOnline: isNavigatorOnline(),
            canUseWasm: canUseWasmSpeechFallback(),
            isWasmCached: isWasmSpeechCached()
        });
    };

    const triggerWasmTier = async (): Promise<void> => {
        if (stopped) return;
        activeTier = 'wasm';
        callbacks.onTierSelected?.('wasm');
        try {
            const { startWasmVoiceCapture } = await import('./whisper-stt.service');
            if (stopped) return;
            const session = await startWasmVoiceCapture({
                onStart: () => callbacks.onStart?.('wasm'),
                onProcessing: () => callbacks.onProcessing?.('wasm'),
                onResult: (transcript) => callbacks.onResult?.(transcript, 'wasm'),
                onError: (error) => callbacks.onError?.(error),
                onEnd: () => callbacks.onEnd?.()
            });
            activeStop = () => session.stop();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Không thể khởi chạy AI Whisper WASM.';
            callbacks.onError?.(message);
            callbacks.onEnd?.();
        }
    };

    const runCloudTier = (): void => {
        if (stopped) return;
        activeTier = 'cloud';
        callbacks.onTierSelected?.('cloud');
        let ended = false;
        let cascaded = false;

        const emitEndOnce = () => {
            if (!ended && !cascaded) {
                ended = true;
                callbacks.onEnd?.();
            }
        };

        const recognizer = createSpeechRecognizer(
            {
                onStart: () => callbacks.onStart?.('cloud'),
                onResult: (transcript) => callbacks.onResult?.(transcript, 'cloud'),
                onError: (error) => {
                    if (CASCADE_ERRORS.has(error)) {
                        cascaded = true;
                        recognizer.stop();
                        if (isWasmSpeechCached() && canUseWasmSpeechFallback()) {
                            void triggerWasmTier();
                        } else {
                            triggerKeyboardFallback(error);
                            callbacks.onEnd?.();
                        }
                        return;
                    }
                    callbacks.onError?.(error);
                    emitEndOnce();
                },
                onEnd: emitEndOnce
            },
            { processLocally: false }
        );

        activeStop = () => recognizer.stop();
        recognizer.start();
    };

    if (callbacks.forceWasm) {
        if (!canUseWasmSpeechFallback()) {
            triggerKeyboardFallback('wasm-unsupported');
            return createHandle();
        }
        await triggerWasmTier();
        return createHandle();
    }

    const hasWebSpeech = isSpeechRecognitionSupported();
    const onDeviceStatus = hasWebSpeech ? await checkOnDeviceVietnameseAvailability() : 'unavailable';
    if (stopped) return createHandle();

    const preferredTier = resolvePreferredSpeechTier({
        hasWebSpeech,
        onDeviceStatus,
        isOnline: isNavigatorOnline(),
        hasWasmCached: isWasmSpeechCached(),
        canUseWasm: canUseWasmSpeechFallback()
    });

    if (preferredTier === 'on-device') {
        activeTier = 'on-device';
        callbacks.onTierSelected?.('on-device');

        if (onDeviceStatus === 'downloadable') {
            callbacks.onStatus?.('Đang tải gói giọng nói tiếng Việt trên thiết bị...');
            const installed = await installOnDeviceVietnamesePack();
            if (stopped) return createHandle();
            if (!installed) {
                if (isNavigatorOnline()) {
                    runCloudTier();
                } else if (isWasmSpeechCached() && canUseWasmSpeechFallback()) {
                    await triggerWasmTier();
                } else {
                    triggerKeyboardFallback('install-failed');
                }
                return createHandle();
            }
        }

        let ended = false;
        let cascaded = false;
        const emitEndOnce = () => {
            if (!ended && !cascaded) {
                ended = true;
                callbacks.onEnd?.();
            }
        };

        const recognizer = createSpeechRecognizer(
            {
                onStart: () => callbacks.onStart?.('on-device'),
                onResult: (transcript) => callbacks.onResult?.(transcript, 'on-device'),
                onError: (error) => {
                    if (CASCADE_ERRORS.has(error)) {
                        cascaded = true;
                        recognizer.stop();
                        if (isNavigatorOnline()) {
                            runCloudTier();
                        } else if (isWasmSpeechCached() && canUseWasmSpeechFallback()) {
                            void triggerWasmTier();
                        } else {
                            triggerKeyboardFallback(error);
                            callbacks.onEnd?.();
                        }
                        return;
                    }
                    callbacks.onError?.(error);
                    emitEndOnce();
                },
                onEnd: emitEndOnce
            },
            { processLocally: true }
        );

        activeStop = () => recognizer.stop();
        recognizer.start();
        return createHandle();
    }

    if (preferredTier === 'cloud') {
        runCloudTier();
        return createHandle();
    }

    if (preferredTier === 'wasm') {
        await triggerWasmTier();
        return createHandle();
    }

    triggerKeyboardFallback(hasWebSpeech ? 'offline' : 'unsupported');
    return createHandle();
}


