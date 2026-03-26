import type { ExtractedArticle } from "../content/extractArticle";

export const MATADOR_ANALYZE_ACTIVE_TAB = "MATADOR_ANALYZE_ACTIVE_TAB";
export const MATADOR_EXTRACT_ACTIVE_TAB = "MATADOR_EXTRACT_ACTIVE_TAB";
const MATADOR_EXTRACT_REQUEST = "MATADOR_EXTRACT_REQUEST";
const MATADOR_EXTRACT_RESPONSE = "MATADOR_EXTRACT_RESPONSE";

type AnalyzeRequestMessage = {
  type: typeof MATADOR_ANALYZE_ACTIVE_TAB;
};

type ExtractRequestMessage = {
  type: typeof MATADOR_EXTRACT_ACTIVE_TAB;
};

type ExtractResponseMessage =
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

type AnalyzeResponse =
  | { ok: true; article: ExtractedArticle; analysis: unknown }
  | { ok: false; error: string };

function isAnalyzeRequestMessage(message: unknown): message is AnalyzeRequestMessage {
  return Boolean(
    message &&
      typeof message === "object" &&
      "type" in message &&
      (message as { type?: string }).type === MATADOR_ANALYZE_ACTIVE_TAB
  );
}

function isExtractRequestMessage(message: unknown): message is ExtractRequestMessage {
  return Boolean(
    message &&
      typeof message === "object" &&
      "type" in message &&
      (message as { type?: string }).type === MATADOR_EXTRACT_ACTIVE_TAB
  );
}

async function getActiveTabId(): Promise<number> {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const tab = tabs[0];
  if (!tab?.id) {
    throw new Error("No active tab found");
  }
  return tab.id;
}

async function requestExtraction(tabId: number): Promise<ExtractedArticle> {
  // Ask the content script to extract from the page DOM inside the target tab.
  const response = (await chrome.tabs.sendMessage(tabId, {
    type: MATADOR_EXTRACT_REQUEST,
  })) as ExtractResponseMessage | undefined;

  if (!response || response.type !== MATADOR_EXTRACT_RESPONSE) {
    throw new Error("No extraction response from content script");
  }
  if (!response.ok) {
    throw new Error(response.error);
  }

  return response.article;
}

async function analyzeArticle(article: ExtractedArticle): Promise<unknown> {
  // Forward the normalized article payload to the local backend for downstream analysis.
  const apiResponse = await fetch("http://localhost:8000/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(article),
  });

  if (!apiResponse.ok) {
    throw new Error(`Backend analyze failed (${apiResponse.status})`);
  }

  return apiResponse.json();
}

async function analyzeActiveTab(): Promise<AnalyzeResponse> {
  try {
    // Reuse the same extraction path as the popup to keep analysis inputs consistent.
    const tabId = await getActiveTabId();
    const article = await requestExtraction(tabId);
    const analysis = await analyzeArticle(article);
    return { ok: true, article, analysis };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown background error",
    };
  }
}

if (chrome?.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (isExtractRequestMessage(message)) {
      getActiveTabId()
        .then(requestExtraction)
        .then((article) => sendResponse({ ok: true, article }))
        .catch((error) =>
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : "Unknown extraction error",
          })
        );
      return true;
    }

    if (isAnalyzeRequestMessage(message)) {
      analyzeActiveTab().then(sendResponse);
      return true;
    }
  });
}
