import {
    getSuggestions,
    searchDictionaryPaginated,
    warmDictionaryIndex,
    type DictionaryEntry,
    type PaginatedSearchResult,
    type SearchDirection
} from './dictionary.service';

export type SearchWorkerRequest =
    | { id: number; type: 'set_corpus'; entries: DictionaryEntry[] }
    | {
          id: number;
          type: 'search';
          query: string;
          direction: SearchDirection;
          offset?: number;
          limit?: number;
      }
    | {
          id: number;
          type: 'suggest';
          query: string;
          direction: SearchDirection;
          maxResults?: number;
      };

export type SearchWorkerResponse =
    | { id: number; type: 'corpus_ready'; count: number }
    | { id: number; type: 'search_result'; result: PaginatedSearchResult }
    | { id: number; type: 'suggest_result'; suggestions: string[] }
    | { id: number; type: 'error'; message: string };

const workerScope = self as unknown as {
    postMessage: (message: SearchWorkerResponse) => void;
    addEventListener: (
        type: 'message',
        listener: (event: MessageEvent<SearchWorkerRequest>) => void
    ) => void;
};

let corpus: DictionaryEntry[] = [];

workerScope.addEventListener('message', (event: MessageEvent<SearchWorkerRequest>) => {
    const msg = event.data;
    try {
        if (msg.type === 'set_corpus') {
            corpus = Array.isArray(msg.entries) ? msg.entries : [];
            warmDictionaryIndex(corpus);
            workerScope.postMessage({
                id: msg.id,
                type: 'corpus_ready',
                count: corpus.length
            });
            return;
        }

        if (msg.type === 'search') {
            const result = searchDictionaryPaginated(msg.query, msg.direction, corpus, {
                offset: msg.offset,
                limit: msg.limit
            });
            workerScope.postMessage({
                id: msg.id,
                type: 'search_result',
                result
            });
            return;
        }

        if (msg.type === 'suggest') {
            const suggestions = getSuggestions(
                msg.query,
                msg.direction,
                corpus,
                msg.maxResults ?? 8
            );
            workerScope.postMessage({
                id: msg.id,
                type: 'suggest_result',
                suggestions
            });
        }
    } catch (error) {
        workerScope.postMessage({
            id: msg.id,
            type: 'error',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
