export interface BatchQueueItem {
    name: string;
    vietnamese?: string;
    xodang?: string;
    blob: Blob;
    size: string;
    type: 'recording' | 'upload';
    audioUrl: string;
}

export class BatchQueueManager {
    private items: BatchQueueItem[] = [];
    private playingIndex = -1;
    private audioPlayer: HTMLAudioElement | null = null;
    private onStateChange?: () => void;

    constructor(onStateChange?: () => void) {
        this.onStateChange = onStateChange;
    }

    getItems(): readonly BatchQueueItem[] {
        return this.items;
    }

    getPlayingIndex(): number {
        return this.playingIndex;
    }

    get length(): number {
        return this.items.length;
    }

    add(item: BatchQueueItem): void {
        this.items.push(item);
        this.onStateChange?.();
    }

    updateLabels(index: number, labels: { vietnamese?: string; xodang?: string }): boolean {
        const item = this.items[index];
        if (!item) return false;
        if (labels.vietnamese !== undefined) {
            item.vietnamese = labels.vietnamese;
        }
        if (labels.xodang !== undefined) {
            item.xodang = labels.xodang;
        }
        return true;
    }

    removeAt(index: number): BatchQueueItem | null {
        if (index < 0 || index >= this.items.length) return null;
        if (this.playingIndex === index) {
            this.stopPlayback(false);
        } else if (index < this.playingIndex) {
            this.playingIndex--;
        }
        const [removed] = this.items.splice(index, 1);
        if (removed?.audioUrl) {
            URL.revokeObjectURL(removed.audioUrl);
        }
        this.onStateChange?.();
        return removed || null;
    }

    clear(): void {
        this.stopPlayback(false);
        this.items.forEach((item) => {
            if (item.audioUrl) URL.revokeObjectURL(item.audioUrl);
        });
        this.items = [];
        this.onStateChange?.();
    }

    play(index: number, onEnded?: () => void, onError?: (message: string) => void): boolean {
        if (index < 0 || index >= this.items.length) return false;
        if (this.playingIndex === index) {
            this.stopPlayback();
            return false;
        }
        this.stopPlayback(false);
        const item = this.items[index];
        this.playingIndex = index;

        if (!this.audioPlayer) {
            this.audioPlayer = new Audio();
        }
        this.audioPlayer.onended = () => {
            this.stopPlayback();
            onEnded?.();
        };
        this.audioPlayer.onerror = () => {
            const wasPlaying = this.playingIndex !== -1;
            this.stopPlayback();
            onEnded?.();
            if (wasPlaying) {
                onError?.('Không thể phát tệp âm thanh này trên trình duyệt hiện tại.');
            }
        };
        this.audioPlayer.src = item.audioUrl;
        const playPromise = this.audioPlayer.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {
                const wasPlaying = this.playingIndex !== -1;
                this.stopPlayback();
                onEnded?.();
                if (wasPlaying) {
                    onError?.('Không thể phát tệp âm thanh này trên trình duyệt hiện tại.');
                }
            });
        }
        this.onStateChange?.();
        return true;
    }

    stopPlayback(notify: boolean = true): void {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer.currentTime = 0;
        }
        this.playingIndex = -1;
        if (notify) {
            this.onStateChange?.();
        }
    }
}
