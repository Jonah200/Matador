import { extractArticleFromPage, type ExtractedArticle } from "./extractArticle";

export const MATADOR_EXTRACT_REQUEST = "MATADOR_EXTRACT_REQUEST";
export const MATADOR_EXTRACT_RESPONSE = "MATADOR_EXTRACT_RESPONSE";


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
        const response = handleExtractionRequest(message);
        if (!response) return;
        sendResponse(response);
        return true;
    });
}