import { writable } from "svelte/store";

export interface ChatHistoryMessage {
    username: string;
    text: string;
    timestamp: number;
}

const MAX_MESSAGES = 50;

function createChatHistoryStore() {
    const { subscribe, update } = writable<ChatHistoryMessage[]>([]);

    return {
        subscribe,
        addMessage(username: string, text: string) {
            if (!text.trim()) return;
            update((messages) => {
                const next = [...messages, { username, text, timestamp: Date.now() }];
                return next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next;
            });
        },
    };
}

export const chatHistoryStore = createChatHistoryStore();
