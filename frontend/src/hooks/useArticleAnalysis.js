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

function getConfidenceFromScore(score) {
    if (score >= 0.75) return "High";
    if (score >= 0.4) return "Medium";
    return "Low";
}

function pickTopSignals(flaggedItems) {
    const counts = {};

    for (const item of flaggedItems) {
        for (const [emotion, value] of Object.entries(item.emotions || {})) {
            if (value > 0.1) {
                counts[emotion] = (counts[emotion] || 0) + value;
            }
        }

        if (item.top_emotion) {
            counts[item.top_emotion] = (counts[item.top_emotion] || 0) + (item.dominance || 0.1);
        }
    }

    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label]) => label);
}

function itemLocationLabel(claims) {
    const hasLocations = claims.some(
        (item) => typeof item.start === "number" || typeof item.end === "number"
    );
    return hasLocations ? "locations available" : "locations missing";
}

function useArticleAnalysis() {
    const [analysisResults, setAnalysisResults] = useState([]);
    const [highlights, setHighlights] = useState([]);
    const [summaryText, setSummaryText] = useState("Waiting for analysis...");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);
    const [article, setArticle] = useState(null);

    const [emotionStats, setEmotionStats] = useState({ count: 0, signals: [] });
    const [claimStats, setClaimStats] = useState({ count: 0, signals: [] });
    const [biasSummary, setBiasSummary] = useState({ score: 0, direction: "center" });

    const API_BASE = "http://127.0.0.1:8000";

    const handleAnalyze = async () => {
        setErrorMsg("");
        setIsAnalyzing(true);
        setHighlights([]);
        setAnalysisResults([]);
        setSummaryText("Extracting article...");
        setEmotionStats({ count: 0, signals: [] });
        setClaimStats({ count: 0, signals: [] });
        setBiasSummary({ score: 0, direction: "center" });

        try {
            const extractionResponse = await chrome.runtime.sendMessage({
                type: MATADOR_EXTRACT_ACTIVE_TAB,
            });

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
                title: extractedArticle.title,
                url: extractedArticle.url,
                authors: extractedArticle.byline ? [extractedArticle.byline] : [],
                publish_date: extractedArticle.publishedAt,
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
                const service = data.service_name;
                const result = data.result || {};

                setAnalysisResults((prev) => [...prev, data]);

                if (service === "pagerank_service" && result.summary) {
                    setSummaryText(result.summary);
                }

                if (service === "ner_service" && Array.isArray(result.entities)) {
                    const entityHighlights = result.entities.slice(0, 10).map((ent, i) => ({
                        id: `ent-${i}-${ent.text}-${ent.start_char}`,
                        subject: ent.text,
                        issue: "Named Entity",
                        confidence: "High",
                        quote: ent.text,
                        explanation: `Detected ${ent.label} mention in the article.`,
                        type: "entity",
                        order: ent.start_char ?? i,
                        signals: [ent.label],
                    }));

                    setHighlights((prev) => {
                        const withoutEntities = prev.filter((item) => item.type !== "entity");
                        return [...withoutEntities, ...entityHighlights];
                    });
                }

                if (["emotion_detection", "emotion_service", "emotion_detection_service"].includes(service)) {
                    const flagged = Array.isArray(result.flagged) ? result.flagged : [];
                    const okay = Array.isArray(result.okay) ? result.okay : [];
                    const merged = [...flagged, ...okay];

                    const flaggedPassages =
                        flagged.length > 0
                            ? flagged
                            : merged.filter(
                                (item) => (item.mass || 0) >= 0.45 || (item.dominance || 0) >= 0.25
                            );

                    const emotionHighlights = flaggedPassages.map((item, i) => ({
                        id: `emo-${i}-${item.start}-${item.end}`,
                        subject: item.top_emotion || "Emotion",
                        issue: "Emotional Framing",
                        confidence: getConfidenceFromScore(item.mass || item.dominance || 0),
                        quote: item.token,
                        explanation: `This passage was flagged for elevated emotional weight. Top emotion: ${item.top_emotion || "n/a"
                            }.`,
                        type: "emotional",
                        order: item.start ?? i,
                        signals: [item.top_emotion, ...Object.keys(item.emotions || {})]
                            .filter(Boolean)
                            .slice(0, 4),
                    }));

                    setEmotionStats({
                        count: emotionHighlights.length,
                        signals: pickTopSignals(flaggedPassages),
                    });

                    setHighlights((prev) => {
                        const withoutEmotion = prev.filter((item) => item.type !== "emotional");
                        return [...withoutEmotion, ...emotionHighlights];
                    });
                }

                if (["claim_detection", "claim_service", "claim_detection_service"].includes(service)) {
                    const claims = Array.isArray(result)
                        ? result
                        : Array.isArray(result.claims)
                            ? result.claims
                            : [];

                    const onlyClaims = claims.filter((item) => item.label === "claim");

                    const claimHighlights = onlyClaims.map((item, i) => ({
                        id: `claim-${i}-${item.start ?? i}`,
                        subject: "Claim",
                        issue: "Claim Detected",
                        confidence: "Medium",
                        quote: item.sentence,
                        explanation:
                            "This sentence was classified as a claim rather than background description.",
                        type: "claim",
                        order: item.start ?? i,
                        signals: ["claim sentence"],
                    }));

                    setClaimStats({
                        count: onlyClaims.length,
                        signals: ["claim sentence", itemLocationLabel(onlyClaims)],
                    });

                    setHighlights((prev) => {
                        const withoutClaims = prev.filter((item) => item.type !== "claim");
                        return [...withoutClaims, ...claimHighlights];
                    });
                }

                if (
                    ["isd_service", "ideological_similarity_detection", "ideology_service"].includes(service)
                ) {
                    const numericBias = typeof result.bias === "number" ? result.bias : 0;
                    const direction =
                        result.direction ||
                        (numericBias < 0 ? "left" : numericBias > 0 ? "right" : "center");

                    setBiasSummary({ score: numericBias, direction });
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
        emotionStats,
        claimStats,
        biasSummary,
        handleAnalyze,
    };
}

export default useArticleAnalysis;