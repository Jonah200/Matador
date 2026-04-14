import { extractArticleFromPage, type ExtractedArticle } from "./extractArticle";

export const MATADOR_EXTRACT_REQUEST = "MATADOR_EXTRACT_REQUEST";
export const MATADOR_EXTRACT_RESPONSE = "MATADOR_EXTRACT_RESPONSE";
export const MATADOR_FOCUS_TEXT_REQUEST = "MATADOR_FOCUS_TEXT_REQUEST";


console.log("Matador content script loaded on", window.location.href);


export type ExtractRequestMessage = {
    type: typeof MATADOR_EXTRACT_REQUEST;
};

export type ExtractResponseMessage =
    | {
        type: typeof MATADOR_EXTRACT_RESPONSE;
        ok: true;
        article: ExtractedArticle;
    }
    | {
        type: typeof MATADOR_EXTRACT_RESPONSE;
        ok: false;
        error: string;
    };

type FocusTextRequestMessage = {
    type: typeof MATADOR_FOCUS_TEXT_REQUEST;
    text?: string;
    fallbackText?: string;
};

type RuntimeLike = {
    onMessage: {
        addListener: (
            cb: (
                
                message: unknown,
                sender: unknown,
                sendResponse: (response: ExtractResponseMessage) => void
            ) => void
        ) => void;
    };
};

function isExtractRequest(message: unknown): message is ExtractRequestMessage {
    return Boolean(
        message &&
        typeof message === "object" &&
        "type" in message &&
        (message as { type?: string }).type === MATADOR_EXTRACT_REQUEST
    );
}

function isFocusTextRequest(message: unknown): message is FocusTextRequestMessage {
    return Boolean(
        message &&
        typeof message === "object" &&
        "type" in message &&
        (message as { type?: string }).type === MATADOR_FOCUS_TEXT_REQUEST
    );
}

function normalizeSearchText(value: string) {
    return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function findTextNodeMatch(searchText: string) {
    const target = normalizeSearchText(searchText);
    if (!target) {
        return null;
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

    while (walker.nextNode()) {
        const node = walker.currentNode;
        const rawText = node.textContent || "";
        const normalized = normalizeSearchText(rawText);

        if (!normalized) {
            continue;
        }

        if (normalized.includes(target) || target.includes(normalized.slice(0, 80))) {
            return node.parentElement || node.parentNode;
        }
    }

    return null;
}

function focusArticleText(text?: string, fallbackText?: string) {
    const targetElement =
        (text ? findTextNodeMatch(text) : null) ||
        (fallbackText ? findTextNodeMatch(fallbackText) : null);

    if (!targetElement || !(targetElement instanceof HTMLElement)) {
        return { ok: false, error: "Could not find that passage on the page." };
    }

    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });

    const previousOutline = targetElement.style.outline;
    const previousBackground = targetElement.style.backgroundColor;
    const previousTransition = targetElement.style.transition;

    targetElement.style.transition = "background-color 0.4s ease, outline 0.4s ease";
    targetElement.style.outline = "3px solid rgba(59, 130, 246, 0.65)";
    targetElement.style.backgroundColor = "rgba(191, 219, 254, 0.55)";

    window.setTimeout(() => {
        targetElement.style.outline = previousOutline;
        targetElement.style.backgroundColor = previousBackground;
        targetElement.style.transition = previousTransition;
    }, 2200);

    return { ok: true };
}

export function handleExtractionRequest(message: unknown): ExtractResponseMessage | null {
    // Ignore unrelated runtime messages so other extension features can coexist safely.
    if (!isExtractRequest(message)) return null;

    try {
        const article = extractArticleFromPage(document);

        if (!article) {
            return {
                type: MATADOR_EXTRACT_RESPONSE,
                ok: false,
                error: "No extractable article text found on this page.",
            };
        }

        return {
            type: MATADOR_EXTRACT_RESPONSE,
            ok: true,
            article,
        };
    } catch (error) {
        return {
            type: MATADOR_EXTRACT_RESPONSE,
            ok: false,
            error: error instanceof Error ? error.message : "Unknown extraction error",
        };
    }
}

const runtime = (globalThis as { chrome?: { runtime?: RuntimeLike } }).chrome?.runtime;

if (runtime?.onMessage) {
    runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (isFocusTextRequest(message)) {
            sendResponse(focusArticleText(message.text, message.fallbackText));
            return true;
        }

        const response = handleExtractionRequest(message);
        if (!response) return;
        sendResponse(response);
        return true;
    });
}
