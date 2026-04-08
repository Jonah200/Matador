import { useState } from "react";

const MATADOR_EXTRACT_ACTIVE_TAB = "MATADOR_EXTRACT_ACTIVE_TAB";

function splitIntoParagraphs(contentText) {
    return contentText
        .split(/\n\s*\n/)
        .map((text, index) => ({
            index,
            text: text.trim(),
        }))
        .filter((p) => p.text.length > 0);
}

function useArticleAnalysis() {
    const [analysisResults, setAnalysisResults] = useState([]);
    const [highlights, setHighlights] = useState([]);
    const [summaryText, setSummaryText] = useState("Waiting for analysis...");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);
    const [article, setArticle] = useState(null);

    const API_BASE = "http://127.0.0.1:8000";

    const handleAnalyze = async () => {
        setErrorMsg("");
        setIsAnalyzing(true);
        setHighlights([]);
        setAnalysisResults([]);
        setSummaryText("Extracting article...");

        try {
            console.log("STEP 1: requesting extraction");

            const extractionResponse = await chrome.runtime.sendMessage({
                type: MATADOR_EXTRACT_ACTIVE_TAB,
            });

            console.log("STEP 2: extraction response", extractionResponse);

            if (!extractionResponse?.ok) {
                throw new Error(extractionResponse?.error || "Extraction failed");
            }

            const extractedArticle = extractionResponse.article;
            setArticle(extractedArticle);

            const paragraphs = splitIntoParagraphs(extractedArticle.contentText);

            if (paragraphs.length === 0) {
                throw new Error("No usable paragraphs were extracted from the page.");
            }

            setSummaryText("Starting analysis...");

            const payload = {
                url: extractedArticle.url,
                authors: extractedArticle.byline ? [extractedArticle.byline] : [],
                org: extractedArticle.siteName || "",
                paragraphs,
            };

            console.log("STEP 3: sending /analyze payload", payload);

            const res = await fetch(`${API_BASE}/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error(`Backend analyze failed (${res.status})`);
            }

            const { job_id } = await res.json();
            const es = new EventSource(`${API_BASE}/stream/${job_id}`);

            es.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log("SSE EVENT:", data);
                const service = data.service_name;
                const result = data.result || {};

                if (service === "pagerank_service" && result.summary) {
                    setSummaryText(result.summary);
                }

                if (service === "ner_service" && result.entities) {
                    const entityHighlights = result.entities.slice(0, 5).map((ent, i) => ({
                        id: `ent-${i}-${ent.text}`,
                        subject: ent.label, 
                        issue: "Named Entity",
                        confidence: "High",
                        quote: ent.text,
                        explanation: `Detected ${ent.label} in the text.`,
                        type: "subjective", 
                        order: i,
                        signals: [ent.label]
                    }));

                    setHighlights((prev) => [...prev, ...entityHighlights]);
                }

                if (service === "fake_service" || service === "fake_article_service") {
                    const score = result.result || 0; 

                    if (score > 0.1) {
                        const newHighlight = {
                            id: Math.random().toString(36).substr(2, 9),
                            subject: "General Analysis",
                            issue: score > 0.8 ? "High Intensity" : "Low Intensity",
                            confidence: "Medium",
                            quote: "Sample analysis passage...",
                            explanation: `The ${service} returned a value of ${score.toFixed(2)}`,
                            type: service === "fake_service" ? "emotional" : "subjective",
                            order: data.paragraph_index || 0,
                            signals: ["automated-check"]
                        };
                        setHighlights((prev) => [...prev, newHighlight]);
                    }
                }

                if (service === "job_complete") {
                    setIsAnalyzing(false);
                    setLastUpdated(new Date());
                    es.close();
                }
            };

            es.onerror = () => {
                setErrorMsg("Connection lost. Results may be incomplete.");
                es.close();
                setIsAnalyzing(false);
            };
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to start analysis");
            setIsAnalyzing(false);
        }
    };

    return {
        article,
        analysisResults,
        highlights,
        summaryText,
        isAnalyzing,
        errorMsg,
        lastUpdated,
        handleAnalyze,
    };
}

export default useArticleAnalysis;