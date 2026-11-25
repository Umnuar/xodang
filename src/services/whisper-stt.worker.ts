const TRANSFORMERS_CDN_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1';
const WHISPER_MODEL_ID = 'onnx-community/whisper-tiny';

interface TransformersProgressEvent {
    status?: string;
    file?: string;
    progress?: number;
    loaded?: number;
    total?: number;
}

interface TransformersEnv {
    allowLocalModels: boolean;
    useBrowserCache: boolean;
    useWasmCache?: boolean;
    backends?: {
        onnx?: {
            wasm?: {
                numThreads?: number;
            };
        };
    };
}

type TranscriberFn = (
    audio: Float32Array,
    options: { language: string; task: string }
) => Promise<{ text?: string } | Array<{ text?: string }>>;

interface TransformersModule {
    env: TransformersEnv;
    pipeline: (
        task: string,
        model: string,
        options: {
            device: string;
            dtype: string;
            progress_callback?: (event: TransformersProgressEvent) => void;
        }
    ) => Promise<TranscriberFn>;
}

type WorkerIncomingMessage =
    | { type: 'preload'; requestId: number }
    | { type: 'transcribe'; requestId: number; audio: Float32Array };

type WorkerOutgoingMessage =
    | { type: 'progress'; percent: number; file: string }
    | { type: 'ready'; requestId: number }
    | { type: 'result'; requestId: number; text: string }
    | { type: 'error'; requestId: number; message: string; code?: 'model_load_failed' | 'transcribe_failed' };

const workerScope = globalThis as unknown as {
    postMessage: (message: WorkerOutgoingMessage) => void;
    addEventListener: (
        type: 'message',
        listener: (event: MessageEvent<WorkerIncomingMessage>) => void
    ) => void;
};

let transcriberPromise: Promise<TranscriberFn> | null = null;
const fileProgressMap = new Map<string, { loaded: number; total: number }>();

function emitProgress(event: TransformersProgressEvent): void {
    const file = event.file || '';
    if (file && typeof event.total === 'number' && event.total > 0 && typeof event.loaded === 'number') {
        fileProgressMap.set(file, { loaded: event.loaded, total: event.total });
        let loadedSum = 0;
        let totalSum = 0;
        fileProgressMap.forEach((entry) => {
            loadedSum += entry.loaded;
            totalSum += entry.total;
        });
        if (totalSum > 0) {
            const percent = Math.min(100, Math.round((loadedSum / totalSum) * 100));
            workerScope.postMessage({ type: 'progress', percent, file });
            return;
        }
    }

    if (typeof event.progress === 'number') {
        const percent = Math.min(100, Math.max(0, Math.round(event.progress)));
        workerScope.postMessage({ type: 'progress', percent, file });
    }
}

async function getTranscriber(): Promise<TranscriberFn> {
    if (!transcriberPromise) {
        const moduleUrl: string = TRANSFORMERS_CDN_URL;
        transcriberPromise = (async () => {
            const mod = (await import(moduleUrl)) as TransformersModule;
            mod.env.allowLocalModels = false;
            mod.env.useBrowserCache = true;
            mod.env.useWasmCache = true;
            if (mod.env.backends?.onnx?.wasm) {
                mod.env.backends.onnx.wasm.numThreads = 1;
            }
            return mod.pipeline('automatic-speech-recognition', WHISPER_MODEL_ID, {
                device: 'wasm',
                dtype: 'q8',
                progress_callback: emitProgress
            });
        })().catch((err: unknown) => {
            transcriberPromise = null;
            throw err;
        });
    }
    return transcriberPromise;
}

workerScope.addEventListener('message', (event: MessageEvent<WorkerIncomingMessage>) => {
    const payload = event.data;
    if (!payload) return;

    if (payload.type === 'preload') {
        void getTranscriber()
            .then(() => {
                workerScope.postMessage({ type: 'ready', requestId: payload.requestId });
            })
            .catch((err: unknown) => {
                const message = err instanceof Error ? err.message : 'Không thể tải mô hình AI WASM.';
                workerScope.postMessage({ type: 'error', requestId: payload.requestId, message, code: 'model_load_failed' });
            });
        return;
    }

    if (payload.type === 'transcribe') {
        void getTranscriber()
            .then(
                (transcriber) => transcriber(payload.audio, { language: 'vietnamese', task: 'transcribe' })
                    .then((output) => {
                        const raw = Array.isArray(output) ? output[0]?.text : output?.text;
                        const text = (raw || '').replace(/\.$/, '').trim();
                        workerScope.postMessage({ type: 'result', requestId: payload.requestId, text });
                    })
                    .catch((err: unknown) => {
                        const message = err instanceof Error ? err.message : 'Lỗi giải mã giọng nói bằng AI WASM.';
                        workerScope.postMessage({ type: 'error', requestId: payload.requestId, message, code: 'transcribe_failed' });
                    }),
                (err: unknown) => {
                    const message = err instanceof Error ? err.message : 'Không thể tải mô hình AI WASM.';
                    workerScope.postMessage({ type: 'error', requestId: payload.requestId, message, code: 'model_load_failed' });
                }
            );
    }
});
