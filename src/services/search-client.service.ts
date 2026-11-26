import {
    getSuggestions,
    searchDictionaryPaginated,
    warmDictionaryIndex,
    type DictionaryEntry,
    type PaginatedSearchResult,
    type SearchDirection,
    type SearchPaginationOptions
} from './dictionary.service';
import type { SearchWorkerRequest, SearchWorkerResponse } from './search.worker';

interface PendingWorkerRequest {
    resolve: (response: SearchWorkerResponse) => void;
    reject: (error: Error) => void;
}

let workerInstance: Worker | null = null;
let workerDisabled = false;
let nextRequestId = 1;
const pendingRequests = new Map<number, PendingWorkerRequest>();

export function isSearchWorkerActive(): boolean {
    return typeof Worker !== 'undefined' && !workerDisabled;
}

function rejectAllPending(reason: string): void {
    const err = new Error(reason);
    pendingRequests.forEach((entry) => entry.reject(err));
    pendingRequests.clear();
}

function getOrCreateWorker(): Worker | null {
    if (!isSearchWorkerActive()) {
        return null;
    }
    if (workerInstance) {
        return workerInstance;
    }
    try {
        const worker = new Worker(new URL('./search.worker.ts', import.meta.url), {
            type: 'module'
        });
        worker.addEventListener('message', (event: MessageEvent<SearchWorkerResponse>) => {
            const payload = event.data;
            const pending = pendingRequests.get(payload.id);
            if (!pending) return;
            pendingRequests.delete(payload.id);
            if (payload.type === 'error') {
                pending.reject(new Error(payload.message));
            } else {
                pending.resolve(payload);
            }
        });
        worker.addEventListener('error', (event) => {
            workerDisabled = true;
            workerInstance?.terminate();
            workerInstance = null;
            rejectAllPending(event.message || 'Search worker failed');
        });
        workerInstance = worker;
        return worker;
    } catch {
        workerDisabled = true;
        workerInstance = null;
        return null;
    }
}

function postWorkerRequest(
    request:
        | Omit<Extract<SearchWorkerRequest, { type: 'set_corpus' }>, 'id'>
        | Omit<Extract<SearchWorkerRequest, { type: 'search' }>, 'id'>
        | Omit<Extract<SearchWorkerRequest, { type: 'suggest' }>, 'id'>
): Promise<SearchWorkerResponse> {
    const worker = getOrCreateWorker();
    if (!worker) {
        return Promise.reject(new Error('Search worker unavailable'));
    }
    const id = nextRequestId++;
    const fullRequest = { ...request, id } as SearchWorkerRequest;
    return new Promise((resolve, reject) => {
        pendingRequests.set(id, { resolve, reject });
        try {
            worker.postMessage(fullRequest);
        } catch (error) {
            pendingRequests.delete(id);
            reject(error instanceof Error ? error : new Error(String(error)));
        }
    });
}

export async function setSearchCorpus(entries: DictionaryEntry[]): Promise<void> {
    if (!isSearchWorkerActive()) {
        warmDictionaryIndex(entries);
        return;
    }
    try {
        await postWorkerRequest({ type: 'set_corpus', entries });
    } catch {
        workerDisabled = true;
        warmDictionaryIndex(entries);
    }
}

export async function searchDictionaryAsync(
    query: string,
    direction: SearchDirection,
    entries: DictionaryEntry[],
    options: SearchPaginationOptions = {}
): Promise<PaginatedSearchResult> {
    if (!isSearchWorkerActive()) {
        return searchDictionaryPaginated(query, direction, entries, options);
    }
    try {
        const res = await postWorkerRequest({
            type: 'search',
            query,
            direction,
            offset: options.offset,
            limit: options.limit
        });
        if (res.type === 'search_result') {
            return res.result;
        }
    } catch {
        workerDisabled = true;
    }
    return searchDictionaryPaginated(query, direction, entries, options);
}

export async function getSuggestionsAsync(
    query: string,
    direction: SearchDirection,
    entries: DictionaryEntry[],
    maxResults: number = 8
): Promise<string[]> {
    if (!isSearchWorkerActive()) {
        return getSuggestions(query, direction, entries, maxResults);
    }
    try {
        const res = await postWorkerRequest({
            type: 'suggest',
            query,
            direction,
            maxResults
        });
        if (res.type === 'suggest_result') {
            return res.suggestions;
        }
    } catch {
        workerDisabled = true;
    }
    return getSuggestions(query, direction, entries, maxResults);
}

export function disposeSearchWorker(): void {
    rejectAllPending('Search worker disposed');
    if (workerInstance) {
        workerInstance.terminate();
        workerInstance = null;
    }
    workerDisabled = false;
}
