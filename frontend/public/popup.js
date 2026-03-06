const MATADOR_EXTRACT_ACTIVE_TAB = "MATADOR_EXTRACT_ACTIVE_TAB";

const extractBtn = document.getElementById("extractBtn");
const statusEl = document.getElementById("status");
const errorEl = document.getElementById("error");
const resultEl = document.getElementById("result");
const metaEl = document.getElementById("meta");
const textEl = document.getElementById("text");

function setStatus(text) {
  statusEl.textContent = text;
}

function clearOutput() {
  errorEl.textContent = "";
  resultEl.hidden = true;
  metaEl.textContent = "";
  textEl.textContent = "";
}

function renderArticle(article) {
  const byline = article.byline || "Unknown";
  const site = article.siteName || "Unknown site";
  metaEl.textContent = `${article.title} | ${site} | ${byline} | ${article.length} chars`;
  textEl.textContent = article.contentText || "";
  resultEl.hidden = false;
}

extractBtn.addEventListener("click", async () => {
  clearOutput();
  setStatus("Extracting...");

  try {
    const response = await chrome.runtime.sendMessage({
      type: MATADOR_EXTRACT_ACTIVE_TAB,
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Extraction failed");
    }

    renderArticle(response.article);
    setStatus("Done");
  } catch (error) {
    errorEl.textContent = error instanceof Error ? error.message : "Unknown error";
    setStatus("Failed");
  }
});
