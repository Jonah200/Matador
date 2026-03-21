import { useState } from "react";

function useArticleAnalysis(url) {
    const [analysisResults, setAnalysisResults] = useState([]);
    const [highlights, setHighlights] = useState([]);
    const [summaryText, setSummaryText] = useState("Waiting for analysis...");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);

    const API_BASE = "http://127.0.0.1:8000";

    const handleAnalyze = async () => {
        if (!url) {
            setErrorMsg("Please wait for the page to load.");
            return;
        }

        setErrorMsg("");
        setIsAnalyzing(true);
        setHighlights([]);
        setAnalysisResults([]);
        setSummaryText("Starting analysis...");

        try {
            const payload = {
                url: url,
                authors: [],
                org: "",
                paragraphs: [
                    { index: 0, text: "The government's catastrophic failure..." },
                    { index: 1, text: "While some claim the economy is recovering..." },
                ],
            };

            const res = await fetch(`${API_BASE}/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const { job_id } = await res.json();

            const es = new EventSource(`${API_BASE}/stream/${job_id}`);

            es.onmessage = (event) => {
                const data = JSON.parse(event.data);

                setAnalysisResults((prev) => [...prev, data]);

                if (data.service_name === "job_complete") {
                    setIsAnalyzing(false);
                    setLastUpdated(new Date());
                    es.close();
                    return;
                }

                if (data.service_scope === "article") {
                    if (data.service_name === "pagerank_service" && data.result?.summary) {
                        setSummaryText(data.result.summary);
                    }
                }

                if (data.service_scope === "paragraph" && data.result_code === "complete") {
                    const score = data.result.result;

                    if (score > 0.5) {
                        const newHighlight = {
                            id: `h-${data.paragraph_index}-${data.service_name}`,
                            subject: "Analysis",
                            issue: score > 0.8 ? "High Bias Risk" : "Subjective Content",
                            confidence: score > 0.8 ? "High" : "Medium",
                            quote: `Paragraph ${data.paragraph_index + 1}`,
                            explanation: `Service ${data.service_name} returned a score of ${(score * 100).toFixed(0)}%.`,
                            type: score > 0.8 ? "emotional" : "subjective",
                            order: data.paragraph_index,
                            signals: [],
                        };

                        setHighlights((prev) => [...prev, newHighlight]);
                    }
                }
            };

            es.onerror = (err) => {
                console.error("SSE Error:", err);
                setErrorMsg("Connection lost. Results may be incomplete.");
                es.close();
                setIsAnalyzing(false);
            };
        } catch (err) {
            setErrorMsg("Failed to start analysis: " + err.message);
            setIsAnalyzing(false);
        }
    };

    return {
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