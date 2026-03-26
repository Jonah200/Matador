import { useMemo, useState } from "react";
import { extractArticleFromPage } from "./content/extractArticle";
import "./App.css";

function App() {
  const [article, setArticle] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  // Keep the in-app preview short enough to stay scannable during local testing.
  const previewText = useMemo(() => {
    if (!article?.contentText) return "";
    return article.contentText.slice(0, 1800);
  }, [article]);

  const runLocalExtraction = () => {
    setStatus("extracting");
    setError("");

    try {
      // This path is mainly for testing extraction logic directly in the page context.
      const result = extractArticleFromPage(document);
      if (!result) {
        setStatus("error");
        setError("No extractable content found on this page.");
        return;
      }

      setArticle(result);
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Extraction failed");
    }
  };

  return (
    <main className="app-shell">
      <section className="panel">
        <h1>Matador Text Extraction</h1>
        <p className="subtext">Basic extraction preview from the current page DOM.</p>
        <button type="button" onClick={runLocalExtraction}>
          Extract Page Text
        </button>
        <p className="status">Status: {status}</p>
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="panel output">
        <h2>Extracted Result</h2>
        {!article ? (
          <p className="subtext">Run extraction to display title and text preview.</p>
        ) : (
          <>
            <p>
              <strong>Title:</strong> {article.title}
            </p>
            <p>
              <strong>URL:</strong> {article.url}
            </p>
            <p>
              <strong>Byline:</strong> {article.byline || "Unknown"}
            </p>
            <p>
              <strong>Length:</strong> {article.length} chars
            </p>
            <pre>{previewText}</pre>
          </>
        )}
      </section>
    </main>
  );
}

export default App;
