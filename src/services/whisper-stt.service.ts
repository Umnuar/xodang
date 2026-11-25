import { STORAGE_KEYS } from '@/shared/constants/storage-keys';
import { removeStorageItem, setRawStorageItem } from './storage.service';

export class WasmModelLoadError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WasmModelLoadError';
    }
}

export interface WasmVoiceCallbacks {
    onStart?: () => void;
    onProcessing?: () => void;
    onResult?: (transcript: string) => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
    onModelLoadError?: (error: string) => void;
    signal?: AbortSignal;
}

export interface WasmCaptureSession {
    stop: () => void;
    cancel: () => void;
}

type WorkerResponse =
    | { type: 'progress'; percent: number; file: string }
    | { type: 'ready'; requestId: number }
    | { type: 'result'; requestId: number; text: string }
    | { type: 'error'; requestId: number; message: string; code?: 'model_load_failed' | 'transcribe_failed' };

const TARGET_SAMPLE_RATE = 16000;
const MAX_CAPTURE_MS = 6000;

let sharedWorker: Worker | null = null;
let nextRequestId = 1;

function getOrCreateWorker(): Worker {
    if (!sharedWorker) {
        sharedWorker = new Worker(new URL('./whisper-stt.worker.ts', import.meta.url), {
            type: 'module'
        });
    }
    return sharedWorker;
}

export function disposeWhisperWorker(): void {
    if (sharedWorker) {
        sharedWorker.terminate();
        sharedWorker = null;
    }
}

export async function resampleAudioBlobTo16kMono(blob: Blob): Promise<Float32Array> {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const OfflineCtx = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;

    if (!AudioCtx || !OfflineCtx) {
        throw new Error('Trình duyệt không hỗ trợ Web Audio API để xử lý âm thanh.');
    }

    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new AudioCtx();
    let decoded: AudioBuffer;
    try {
        decoded = await audioContext.decodeAudioData(arrayBuffer);
    } finally {
        void audioContext.close().catch(() => undefined);
    }

    const targetLength = Math.max(1, Math.ceil(decoded.duration * TARGET_SAMPLE_RATE));
    const offlineContext = new OfflineCtx(1, targetLength, TARGET_SAMPLE_RATE);
    const source = offlineContext.createBufferSource();
    source.buffer = decoded;
    source.connect(offlineContext.destination);
    source.start(0);

    const rendered = await offlineContext.startRendering();
    return new Float32Array(rendered.getChannelData(0));
}

export async function preloadWhisperModel(
    onProgress?: (percent: number, file: string) => void,
    signal?: AbortSignal
): Promise<void> {
    if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
        void navigator.storage.persist().catch(() => false);
    }

    const worker = getOrCreateWorker();
    const requestId = nextRequestId++;

    return new Promise<void>((resolve, reject) => {
        const cleanup = () => {
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            signal?.removeEventListener('abort', handleAbort);
        };

        const handleAbort = () => {
            cleanup();
            reject(new DOMException('Aborted', 'AbortError'));
        };

        const handleMessage = (event: MessageEvent<WorkerResponse>) => {
            const data = event.data;
            if (!data) return;
            if (data.type === 'progress') {
                onProgress?.(data.percent, data.file);
                return;
            }
            if (data.requestId !== requestId) return;
            if (data.type === 'ready') {
                cleanup();
                setRawStorageItem(STORAGE_KEYS.STT_WASM_READY, 'true');
                resolve();
            } else if (data.type === 'error') {
                cleanup();
                removeStorageItem(STORAGE_KEYS.STT_WASM_READY);
                reject(new WasmModelLoadError(data.message));
            }
        };

        const handleError = (err: ErrorEvent) => {
            cleanup();
            removeStorageItem(STORAGE_KEYS.STT_WASM_READY);
            reject(new WasmModelLoadError(err.message || 'Lỗi tải AI Whisper WASM Worker.'));
        };

        signal?.addEventListener('abort', handleAbort, { once: true });
        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);
        worker.postMessage({ type: 'preload', requestId });
    });
}

function transcribePcmInWorker(audio: Float32Array, signal?: AbortSignal): Promise<string> {
    if (signal?.aborted) {
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
    }

    const worker = getOrCreateWorker();
    const requestId = nextRequestId++;

    return new Promise<string>((resolve, reject) => {
        const cleanup = () => {
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            signal?.removeEventListener('abort', handleAbort);
        };

        const handleAbort = () => {
            cleanup();
            reject(new DOMException('Aborted', 'AbortError'));
        };

        const handleMessage = (event: MessageEvent<WorkerResponse>) => {
            const data = event.data;
            if (!data || data.type === 'progress' || data.requestId !== requestId) return;
            if (data.type === 'result') {
                cleanup();
                resolve(data.text);
            } else if (data.type === 'error') {
                cleanup();
                if (data.code === 'model_load_failed') {
                    removeStorageItem(STORAGE_KEYS.STT_WASM_READY);
                    reject(new WasmModelLoadError(data.message));
                    return;
                }
                reject(new Error(data.message));
            }
        };

        const handleError = (err: ErrorEvent) => {
            cleanup();
            reject(new Error(err.message || 'Lỗi xử lý AI Whisper WASM.'));
        };

        signal?.addEventListener('abort', handleAbort, { once: true });
        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);
        worker.postMessage({ type: 'transcribe', requestId, audio }, [audio.buffer]);
    });
}

function selectSupportedMimeType(): string {
    if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
        return '';
    }
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    return candidates.find((mime) => MediaRecorder.isTypeSupported(mime)) || '';
}

export async function startWasmVoiceCapture(callbacks: WasmVoiceCallbacks): Promise<WasmCaptureSession> {
    if (callbacks.signal?.aborted) {
        callbacks.onEnd?.();
        return { stop: () => {}, cancel: () => {} };
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        const msg = 'Trình duyệt không hỗ trợ ghi âm micro cho AI WASM.';
        callbacks.onError?.(msg);
        callbacks.onEnd?.();
        return { stop: () => {}, cancel: () => {} };
    }

    let stream: MediaStream;
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                noiseSuppression: true,
                echoCancellation: true
            }
        });
    } catch (err: unknown) {
        if (!callbacks.signal?.aborted) {
            const msg = err instanceof Error ? err.message : 'Không có quyền truy cập microphone.';
            callbacks.onError?.(msg);
        }
        callbacks.onEnd?.();
        return { stop: () => {}, cancel: () => {} };
    }

    const stopTracks = () => {
        stream.getTracks().forEach((track) => track.stop());
    };

    if (callbacks.signal?.aborted) {
        stopTracks();
        callbacks.onEnd?.();
        return { stop: () => {}, cancel: () => {} };
    }

    const mimeType = selectSupportedMimeType();
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    const chunks: Blob[] = [];
    let cancelled = false;
    let stopTimer: ReturnType<typeof setTimeout> | null = null;

    const clearStopTimer = () => {
        if (stopTimer !== null) {
            clearTimeout(stopTimer);
            stopTimer = null;
        }
    };

    const cancelSession = () => {
        cancelled = true;
        clearStopTimer();
        if (recorder.state !== 'inactive') {
            recorder.stop();
        } else {
            stopTracks();
        }
    };

    const onAbort = () => {
        cancelSession();
    };
    callbacks.signal?.addEventListener('abort', onAbort, { once: true });

    const cleanupAbort = () => {
        callbacks.signal?.removeEventListener('abort', onAbort);
    };

    recorder.addEventListener('dataavailable', (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
            chunks.push(event.data);
        }
    });

    recorder.addEventListener('error', () => {
        clearStopTimer();
        stopTracks();
        cleanupAbort();
        if (!cancelled && !callbacks.signal?.aborted) {
            callbacks.onError?.('Lỗi khi ghi âm thanh.');
        }
        callbacks.onEnd?.();
    });

    recorder.addEventListener('stop', () => {
        clearStopTimer();
        stopTracks();

        if (cancelled || callbacks.signal?.aborted || chunks.length === 0) {
            cleanupAbort();
            callbacks.onEnd?.();
            return;
        }

        const recordedBlob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' });
        if (recordedBlob.size === 0) {
            cleanupAbort();
            callbacks.onEnd?.();
            return;
        }

        callbacks.onProcessing?.();
        void resampleAudioBlobTo16kMono(recordedBlob)
            .then((pcm) => {
                if (cancelled || callbacks.signal?.aborted) return '';
                return transcribePcmInWorker(pcm, callbacks.signal);
            })
            .then((text) => {
                if (cancelled || callbacks.signal?.aborted) return;
                if (text) {
                    callbacks.onResult?.(text);
                } else {
                    callbacks.onError?.('Không nhận diện được lời nói tiếng Việt.');
                }
            })
            .catch((err: unknown) => {
                if (cancelled || callbacks.signal?.aborted) return;
                if (err instanceof WasmModelLoadError && callbacks.onModelLoadError) {
                    callbacks.onModelLoadError(err.message);
                    return;
                }
                const msg = err instanceof Error ? err.message : 'Lỗi nhận diện bằng AI Whisper WASM.';
                callbacks.onError?.(msg);
            })
            .finally(() => {
                cleanupAbort();
                callbacks.onEnd?.();
            });
    });

    stopTimer = setTimeout(() => {
        if (recorder.state !== 'inactive') {
            recorder.stop();
        }
    }, MAX_CAPTURE_MS);

    recorder.start();
    callbacks.onStart?.();

    return {
        stop: () => {
            cancelled = false;
            clearStopTimer();
            if (recorder.state !== 'inactive') {
                recorder.stop();
            } else {
                stopTracks();
            }
        },
        cancel: cancelSession
    };
}
