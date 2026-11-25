export interface RecordedAudio {
    blob: Blob;
    mimeType: string;
}

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

    isRecording(): boolean {
        return this.recording;
    }

    getStream(): MediaStream | null {
        return this.stream;
    }

    async start(onStop: (result: RecordedAudio) => void): Promise<MediaStream> {
        this.stop();
        if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            throw new Error('Trình duyệt không hỗ trợ ghi âm.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.stream = stream;
        const chunks: Blob[] = [];
        const preferredMime = pickSupportedAudioMimeType();
        const recorder = preferredMime
            ? new MediaRecorder(stream, { mimeType: preferredMime })
            : new MediaRecorder(stream);
        const resolvedMime = recorder.mimeType || preferredMime || 'audio/webm';

        recorder.ondataavailable = (e: BlobEvent) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: resolvedMime });
            this.releaseStream();
            this.recording = false;
            onStop({ blob, mimeType: resolvedMime });
        };

        this.mediaRecorder = recorder;
        this.recording = true;
        recorder.start();
        return stream;
    }

    stop(): void {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        } else {
            this.releaseStream();
        }
        this.recording = false;
    }

    private releaseStream(): void {
        if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
        }
    }
}
