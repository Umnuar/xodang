export interface SnapshotFallbackType {
    dictionary: Array<{
        viet: string;
        ethnic: string;
        pronunciation?: string;
        driveId?: string;
        exampleViet?: string;
        exampleEthnic?: string;
    }> | null;
    quiz: unknown[] | null;
    chat: unknown[] | null;
}

export const snapshotFallback: SnapshotFallbackType = {
    dictionary: null,
    quiz: null,
    chat: null,
};

export const vocabSnapshot = null;
export const quizSnapshot = null;
export const chatSnapshot = null;

