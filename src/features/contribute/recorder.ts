export interface RecordedAudio {
    blob: Blob;
    mimeType: string;
}

export interface RecorderStartOptions {
    maxDurationSeconds?: number;
    onTick?: (elapsedSeconds: number) => void;
    onMaxDurationReached?: () => void;
}

export const MAX_RECORDING_SECONDS = 60;

export function pickSupportedAudioMimeType(): string {
    if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
        return '';
    }
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

export class AudioRecorder {
    private mediaRecorder: MediaRecorder | null = null;
    private stream: MediaStream | null = null;
    private recording = false;
    private cancelled = false;
    private chunks: Blob[] = [];
    private timerId: ReturnType<typeof setInterval> | null = null;
    private startedAt = 0;
    private startToken = 0;

    isRecording(): boolean {
        return this.recording;
    }

    getStream(): MediaStream | null {
        return this.stream;
    }

    async start(onStop: (result: RecordedAudio) => void, options?: RecorderStartOptions): Promise<MediaStream> {
        this.cancel();
        if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            throw new Error('Trình duyệt không hỗ trợ ghi âm.');
        }

        const token = ++this.startToken;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (token !== this.startToken) {
            stream.getTracks().forEach((track) => track.stop());
            throw new Error('Phiên ghi âm đã bị hủy.');
        }

        this.stream = stream;
        this.cancelled = false;
        this.chunks = [];
        const preferredMime = pickSupportedAudioMimeType();
        const recorder = preferredMime
            ? new MediaRecorder(stream, { mimeType: preferredMime })
            : new MediaRecorder(stream);
        const resolvedMime = recorder.mimeType || preferredMime || 'audio/webm';

        recorder.ondataavailable = (e: BlobEvent) => {
            if (!this.cancelled && e.data.size > 0) {
                this.chunks.push(e.data);
            }
        };

        recorder.onstop = () => {
            this.clearTimer();
            const wasCancelled = this.cancelled;
            const recordedChunks = this.chunks;
            this.chunks = [];
            this.releaseStream();
            this.recording = false;
            this.mediaRecorder = null;
            if (wasCancelled) {
                return;
            }
            const blob = new Blob(recordedChunks, { type: resolvedMime });
            onStop({ blob, mimeType: resolvedMime });
        };

        this.mediaRecorder = recorder;
        this.recording = true;
        recorder.start();

        const maxSeconds = options?.maxDurationSeconds ?? MAX_RECORDING_SECONDS;
        this.startedAt = Date.now();
        options?.onTick?.(0);
        this.timerId = setInterval(() => {
            if (!this.recording || this.cancelled) {
                this.clearTimer();
                return;
            }
            const elapsed = Math.floor((Date.now() - this.startedAt) / 1000);
            options?.onTick?.(Math.min(elapsed, maxSeconds));
            if (elapsed >= maxSeconds) {
                this.clearTimer();
                options?.onMaxDurationReached?.();
                this.stop();
            }
        }, 250);

        return stream;
    }

    stop(): void {
        this.clearTimer();
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        } else {
            this.releaseStream();
        }
        this.recording = false;
    }

    cancel(): void {
        this.startToken++;
        this.cancelled = true;
        this.chunks = [];
        this.clearTimer();
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        } else {
            this.releaseStream();
        }
        this.recording = false;
    }

    private clearTimer(): void {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    private releaseStream(): void {
        if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
        }
    }
}
