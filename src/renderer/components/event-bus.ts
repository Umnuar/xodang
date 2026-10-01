/**
 * Event Bus
 * Lightweight event dispatcher for decoupled communication between components and features.
 */

type EventHandler<T = any> = (data: T) => void;

class EventBus {
    private listeners = new Map<string, Set<EventHandler>>();

    on<T = any>(event: string, handler: EventHandler<T>): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(handler);

        // Return unsubscribe function
        return () => {
            this.listeners.get(event)?.delete(handler);
        };
    }

    emit<T = any>(event: string, data?: T): void {
        const handlers = this.listeners.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (err) {
                    console.error(`[EventBus] Error in handler for event "${event}":`, err);
                }
            });
        }
    }

    clear(): void {
        this.listeners.clear();
    }
}

export const eventBus = new EventBus();
