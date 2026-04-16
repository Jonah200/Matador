type ChromeTab = {
    id?: number;
};

type ChromeMessageListener = (
    message: unknown,
    sender: unknown,
    sendResponse: (response: unknown) => void
) => void | boolean;

declare namespace chrome {
    namespace tabs {
        function query(queryInfo: {
            active: boolean;
            lastFocusedWindow: boolean;
        }): Promise<ChromeTab[]>;
        function sendMessage(tabId: number, message: unknown): Promise<unknown>;
    }

    namespace runtime {
        const onMessage: {
            addListener(listener: ChromeMessageListener): void;
        };
    }
}