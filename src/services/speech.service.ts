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
    cancel?: () => void;
    isSupported: boolean;
}

export type SpeechTier = 'on-device' | 'cloud' | 'keyboard' | 'wasm';
export type SpeechState = 'idle' | 'starting' | 'listening' | 'processing';
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
    onStateChange?: (state: SpeechState) => void;
    onStatus?: (message: string) => void;
    onStart?: (tier: SpeechTier) => void;
    onProcessing?: (tier: SpeechTier) => void;
    onResult?: (transcript: string, tier: SpeechTier) => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
    onFallbackKeyboard?: (info: SpeechFallbackInfo) => void;
    forceWasm?: boolean;
    signal?: AbortSignal;
}

export interface SmartSpeechHandle {
    readonly tier: SpeechTier;
    readonly state: SpeechState;
    stop: () => void;
    cancel: () => void;
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
        return { start: () => {}, stop: () => {}, cancel: () => {}, isSupported: false };
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
        cancel: () => {
            try {
                if (typeof recognition.abort === 'function') {
                    recognition.abort();
                } else {
                    recognition.stop();
                }
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
    let currentState: SpeechState = 'starting';
    let cancelled = Boolean(callbacks.signal?.aborted);
    let stopped = cancelled;
    let activeStop: () => void = () => {};
    let activeCancel: () => void = () => {};

    const setState = (next: SpeechState): void => {
        if (currentState !== next) {
            currentState = next;
            callbacks.onStateChange?.(next);
        }
    };

    const isCancelled = (): boolean => cancelled || Boolean(callbacks.signal?.aborted);

    const performCancel = (): void => {
        cancelled = true;
        stopped = true;
        setState('idle');
        activeCancel();
    };

    const onAbort = (): void => {
        performCancel();
    };
    callbacks.signal?.addEventListener('abort', onAbort, { once: true });

    const cleanupAbort = (): void => {
        callbacks.signal?.removeEventListener('abort', onAbort);
    };

    const createHandle = (): SmartSpeechHandle => ({
        get tier() {
            return activeTier;
        },
        get state() {
            return currentState;
        },
        stop: () => {
            stopped = true;
            activeStop();
        },
        cancel: performCancel
    });

    const isNavigatorOnline = (): boolean => (typeof navigator === 'undefined' ? true : navigator.onLine);

    if (isCancelled()) {
        setState('idle');
        cleanupAbort();
        return createHandle();
    }

    const triggerKeyboardFallback = (reason: string): void => {
        if (isCancelled()) return;
        activeTier = 'keyboard';
        setState('idle');
        cleanupAbort();
        callbacks.onTierSelected?.('keyboard');
        callbacks.onFallbackKeyboard?.({
            reason,
            isOnline: isNavigatorOnline(),
            canUseWasm: canUseWasmSpeechFallback(),
            isWasmCached: isWasmSpeechCached()
        });
    };

    const triggerWasmTier = async (): Promise<void> => {
        if (stopped || isCancelled()) {
            setState('idle');
            cleanupAbort();
            return;
        }
        activeTier = 'wasm';
        callbacks.onTierSelected?.('wasm');
        try {
            const { startWasmVoiceCapture } = await import('./whisper-stt.service');
            if (stopped || isCancelled()) {
                setState('idle');
                cleanupAbort();
                return;
            }
            const session = await startWasmVoiceCapture({
                signal: callbacks.signal,
                onStart: () => {
                    if (isCancelled()) return;
                    setState('listening');
                    callbacks.onStart?.('wasm');
                },
                onProcessing: () => {
                    if (isCancelled()) return;
                    setState('processing');
                    callbacks.onProcessing?.('wasm');
                },
                onResult: (transcript) => {
                    if (isCancelled()) return;
                    setState('idle');
                    cleanupAbort();
                    callbacks.onResult?.(transcript, 'wasm');
                },
                onModelLoadError: () => {
                    if (isCancelled()) return;
                    setWasmSpeechCached(false);
                    triggerKeyboardFallback('wasm-load-failed');
                },
                onError: (error) => {
                    if (isCancelled()) return;
                    setState('idle');
                    cleanupAbort();
                    callbacks.onError?.(error);
                },
                onEnd: () => {
                    setState('idle');
                    cleanupAbort();
                    if (!isCancelled()) {
                        callbacks.onEnd?.();
                    }
                }
            });
            activeStop = () => session.stop();
            activeCancel = () => session.cancel();
            if (isCancelled()) {
                session.cancel();
            }
        } catch (err: unknown) {
            if (isCancelled()) {
                setState('idle');
                cleanupAbort();
                return;
            }
            setWasmSpeechCached(false);
            if (!isNavigatorOnline()) {
                triggerKeyboardFallback('wasm-load-failed');
                callbacks.onEnd?.();
                return;
            }
            const message = err instanceof Error ? err.message : 'Không thể khởi chạy AI Whisper WASM.';
            setState('idle');
            cleanupAbort();
            callbacks.onError?.(message);
            callbacks.onEnd?.();
        }
    };

    const runCloudTier = (): void => {
        if (stopped || isCancelled()) {
            setState('idle');
            cleanupAbort();
            return;
        }
        activeTier = 'cloud';
        callbacks.onTierSelected?.('cloud');
        let ended = false;
        let cascaded = false;

        const emitEndOnce = () => {
            if (!ended && !cascaded) {
                ended = true;
                setState('idle');
                cleanupAbort();
                if (!isCancelled()) {
                    callbacks.onEnd?.();
                }
            }
        };

        const recognizer = createSpeechRecognizer(
            {
                onStart: () => {
                    if (isCancelled()) return;
                    setState('listening');
                    callbacks.onStart?.('cloud');
                },
                onResult: (transcript) => {
                    if (isCancelled()) return;
                    setState('idle');
                    cleanupAbort();
                    callbacks.onResult?.(transcript, 'cloud');
                },
                onError: (error) => {
                    if (isCancelled()) return;
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
        activeCancel = () => (recognizer.cancel ? recognizer.cancel() : recognizer.stop());
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
    if (stopped || isCancelled()) {
        setState('idle');
        cleanupAbort();
        return createHandle();
    }

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
            if (stopped || isCancelled()) {
                setState('idle');
                cleanupAbort();
                return createHandle();
            }
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
                setState('idle');
                cleanupAbort();
                if (!isCancelled()) {
                    callbacks.onEnd?.();
                }
            }
        };

        const recognizer = createSpeechRecognizer(
            {
                onStart: () => {
                    if (isCancelled()) return;
                    setState('listening');
                    callbacks.onStart?.('on-device');
                },
                onResult: (transcript) => {
                    if (isCancelled()) return;
                    setState('idle');
                    cleanupAbort();
                    callbacks.onResult?.(transcript, 'on-device');
                },
                onError: (error) => {
                    if (isCancelled()) return;
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
        activeCancel = () => (recognizer.cancel ? recognizer.cancel() : recognizer.stop());
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


