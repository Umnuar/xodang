export interface BatchQueueItem {
    name: string;
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

    play(index: number, onEnded?: () => void): boolean {
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
        this.audioPlayer.src = item.audioUrl;
        const playPromise = this.audioPlayer.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {
                this.stopPlayback();
                onEnded?.();
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
