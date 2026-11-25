import { STORAGE_KEYS } from '@/shared/constants/storage-keys';
import { setRawStorageItem } from './storage.service';

export interface WasmVoiceCallbacks {
    onStart?: () => void;
    onProcessing?: () => void;
    onResult?: (transcript: string) => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
}

export interface WasmCaptureSession {
    stop: () => void;
    cancel: () => void;
}

type WorkerResponse =
    | { type: 'progress'; percent: number; file: string }
    | { type: 'ready'; requestId: number }
    | { type: 'result'; requestId: number; text: string }
    | { type: 'error'; requestId: number; message: string };

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
    onProgress?: (percent: number, file: string) => void
): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
        void navigator.storage.persist().catch(() => false);
    }

    const worker = getOrCreateWorker();
    const requestId = nextRequestId++;

    return new Promise<void>((resolve, reject) => {
        const cleanup = () => {
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
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
                reject(new Error(data.message));
            }
        };

        const handleError = (err: ErrorEvent) => {
            cleanup();
            reject(new Error(err.message || 'Lỗi tải AI Whisper WASM Worker.'));
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);
        worker.postMessage({ type: 'preload', requestId });
    });
}

function transcribePcmInWorker(audio: Float32Array): Promise<string> {
    const worker = getOrCreateWorker();
    const requestId = nextRequestId++;

    return new Promise<string>((resolve, reject) => {
        const cleanup = () => {
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
        };

        const handleMessage = (event: MessageEvent<WorkerResponse>) => {
            const data = event.data;
            if (!data || data.type === 'progress' || data.requestId !== requestId) return;
            if (data.type === 'result') {
                cleanup();
                resolve(data.text);
            } else if (data.type === 'error') {
                cleanup();
                reject(new Error(data.message));
            }
        };

        const handleError = (err: ErrorEvent) => {
            cleanup();
            reject(new Error(err.message || 'Lỗi xử lý AI Whisper WASM.'));
        };

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
        const msg = err instanceof Error ? err.message : 'Không có quyền truy cập microphone.';
        callbacks.onError?.(msg);
        callbacks.onEnd?.();
        return { stop: () => {}, cancel: () => {} };
    }

    const mimeType = selectSupportedMimeType();
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    const chunks: Blob[] = [];
    let cancelled = false;
    let stopTimer: ReturnType<typeof setTimeout> | null = null;

    const stopTracks = () => {
        stream.getTracks().forEach((track) => track.stop());
    };

    const clearStopTimer = () => {
        if (stopTimer !== null) {
            clearTimeout(stopTimer);
            stopTimer = null;
        }
    };

    recorder.addEventListener('dataavailable', (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
            chunks.push(event.data);
        }
    });

    recorder.addEventListener('error', () => {
        clearStopTimer();
        stopTracks();
        callbacks.onError?.('Lỗi khi ghi âm thanh.');
        callbacks.onEnd?.();
    });

    recorder.addEventListener('stop', () => {
        clearStopTimer();
        stopTracks();

        if (cancelled || chunks.length === 0) {
            callbacks.onEnd?.();
            return;
        }

        const recordedBlob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' });
        if (recordedBlob.size === 0) {
            callbacks.onEnd?.();
            return;
        }

        callbacks.onProcessing?.();
        void resampleAudioBlobTo16kMono(recordedBlob)
            .then((pcm) => transcribePcmInWorker(pcm))
            .then((text) => {
                if (text) {
                    callbacks.onResult?.(text);
                } else {
                    callbacks.onError?.('Không nhận diện được lời nói tiếng Việt.');
                }
            })
            .catch((err: unknown) => {
                const msg = err instanceof Error ? err.message : 'Lỗi nhận diện bằng AI Whisper WASM.';
                callbacks.onError?.(msg);
            })
            .finally(() => {
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
        cancel: () => {
            cancelled = true;
            clearStopTimer();
            if (recorder.state !== 'inactive') {
                recorder.stop();
            } else {
                stopTracks();
            }
        }
    };
}
