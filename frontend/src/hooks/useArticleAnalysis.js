import { useState } from "react";

const MATADOR_EXTRACT_ACTIVE_TAB = "MATADOR_EXTRACT_ACTIVE_TAB";
const MATADOR_EXTRACT_REQUEST = "MATADOR_EXTRACT_REQUEST";
const PRIORITY_ENTITY_LABELS = new Set(["PERSON", "ORG", "GPE", "LOC", "NORP", "EVENT"]);
const LOW_SIGNAL_ENTITY_LABELS = new Set([
    "DATE",
    "TIME",
    "CARDINAL",
    "ORDINAL",
    "QUANTITY",
    "MONEY",
    "PERCENT",
]);

async function ensureContentScriptInjected(tabId) {
    const manifest = chrome.runtime.getManifest();
    const scriptFile = manifest.content_scripts?.[0]?.js?.[0];

    if (!scriptFile) {
        throw new Error("No content script is configured for extraction.");
    }

    await chrome.scripting.executeScript({
        target: { tabId },
        files: [scriptFile],
    });
}

async function requestExtractionFromActiveTab() {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const tabId = tabs[0]?.id;

    if (!tabId) {
        throw new Error("No active tab found for extraction.");
    }

    let response;

    try {
        response = await chrome.tabs.sendMessage(tabId, {
            type: MATADOR_EXTRACT_REQUEST,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error || "");

        if (
            message.includes("Receiving end does not exist") ||
            message.includes("Could not establish connection")
        ) {
            await ensureContentScriptInjected(tabId);
            response = await chrome.tabs.sendMessage(tabId, {
                type: MATADOR_EXTRACT_REQUEST,
            });
        } else {
            throw error;
        }
    }

    if (!response?.ok) {
        throw new Error(response?.error || "Extraction failed");
    }

    return response;
}

async function extractActiveTabArticle() {
    try {
        const response = await chrome.runtime.sendMessage({
            type: MATADOR_EXTRACT_ACTIVE_TAB,
        });

        if (!response?.ok) {
            throw new Error(response?.error || "Extraction failed");
        }

        return response;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error || "");

        if (
            message.includes("Receiving end does not exist") ||
            message.includes("Could not establish connection")
        ) {
            return requestExtractionFromActiveTab();
        }

        throw error;
    }
}

function splitIntoParagraphs(contentText) {
    return String(contentText || "")
        .split(/\n\s*\n/)
        .map((text, index) => ({
            index,
            text: text.trim(),
        }))
        .filter((p) => p.text.length > 0);
}

function getConfidenceFromScore(score) {
    const numeric = Number(score || 0);
    if (numeric >= 0.75) return "High";
    if (numeric >= 0.4) return "Medium";
    return "Low";
}

function pickTopSignals(flaggedItems) {
    const counts = {};

    for (const item of flaggedItems) {
        const emotions = item?.emotions || {};

        for (const [emotion, value] of Object.entries(emotions)) {
            if (Number(value) > 0.1) {
                counts[emotion] = (counts[emotion] || 0) + Number(value);
            }
        }

        if (item?.top_emotion) {
            counts[item.top_emotion] =
                (counts[item.top_emotion] || 0) + Number(item?.dominance || 0.1);
        }
    }

    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label]) => label);
}

function buildEmotionProfile(items) {
    const counts = {};

    for (const item of items) {
        const emotions = item?.emotions || {};

        for (const [emotion, value] of Object.entries(emotions)) {
            if (Number(value) > 0.1) {
                counts[emotion] = (counts[emotion] || 0) + Number(value);
            }
        }

        if (item?.top_emotion) {
            counts[item.top_emotion] =
                (counts[item.top_emotion] || 0) + Number(item?.dominance || 0.1);
        }
    }

    const ranked = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const total = ranked.reduce((sum, [, value]) => sum + value, 0);

    if (total === 0) {
        return [];
    }

    return ranked.map(([label, value]) => ({
        label,
        value,
        percent: Math.round((value / total) * 100),
    }));
}

function normalizeClaimSentences(result) {
    const rawItems = Array.isArray(result)
        ? result
        : Array.isArray(result?.sentences)
            ? result.sentences
            : Array.isArray(result?.claims)
                ? result.claims
                : [];

    return rawItems.map((item, index) => {
        const label = String(item?.label || "").toLowerCase();

        return {
            id: item?.id || `claim-${index}`,
            label,
            text: item?.sentence || item?.text || item?.token || "",
            score: Number(item?.score ?? item?.confidence ?? 0),
            start: item?.start,
            end: item?.end,
        };
    });
}

function hasClaimLocations(claims) {
    return claims.some(
        (item) => typeof item?.start === "number" || typeof item?.end === "number"
    );
}

function formatFailedServices(services) {
    if (services.length === 0) return "";

    return services
        .map((service) => {
            if (service === "ed_service") return "emotion detection";
            if (service === "isd_service") return "ideological similarity";
            if (service === "cd_service") return "claim detection";
            if (service === "ner_service") return "named entity recognition";
<<<<<<< HEAD
            if (service === "summarization_service") return "summary";
=======
>>>>>>> fca85d2 (Added coverage UI  and rework the logic for services to work in the frontend)
            if (service === "textrank_service") return "summary";
            return service;
        })
        .join(", ");
}

<<<<<<< HEAD
function getSummaryTextFromResult(result) {
    if (typeof result === "string") {
        return result;
    }

    if (typeof result?.summary === "string") {
        return result.summary;
    }

    return "";
}

function normalizeRelatedStories(result) {
    const articleContainer = result?.articles;
    const topStories = Array.isArray(articleContainer?.topStories)
        ? articleContainer.topStories
        : [];
    const organic = Array.isArray(articleContainer?.organic)
        ? articleContainer.organic
        : [];
    const directArticles = Array.isArray(articleContainer) ? articleContainer : [];
    const directTopStories = Array.isArray(result?.topStories) ? result.topStories : [];
    const directOrganic = Array.isArray(result?.organic) ? result.organic : [];
    const news = Array.isArray(result?.news) ? result.news : [];

    const rawStories =
        topStories.length > 0
            ? topStories
            : organic.length > 0
                ? organic
                : directArticles.length > 0
                    ? directArticles
                    : directTopStories.length > 0
                        ? directTopStories
                        : directOrganic.length > 0
                            ? directOrganic
                            : news;
=======
function normalizeRelatedStories(result) {
    const topStories = Array.isArray(result?.articles?.topStories) ? result.articles.topStories : [];
    const organic = Array.isArray(result?.articles?.organic) ? result.articles.organic : [];
    const rawStories = topStories.length > 0 ? topStories : organic;
>>>>>>> fca85d2 (Added coverage UI  and rework the logic for services to work in the frontend)

    return rawStories.slice(0, 6).map((story, index) => ({
        id: story?.link || `story-${index}`,
        title: story?.title || "Untitled story",
        link: story?.link || "#",
        source: story?.source || "",
        date: story?.date || "",
<<<<<<< HEAD
        imageUrl: story?.imageUrl || story?.image || story?.image_url || "",
        snippet: story?.snippet || story?.description || "",
    })).filter((story) => story.link !== "#");
=======
        imageUrl: story?.imageUrl || "",
        snippet: story?.snippet || "",
    }));
>>>>>>> fca85d2 (Added coverage UI  and rework the logic for services to work in the frontend)
}

function rankEntity(entity) {
    if (PRIORITY_ENTITY_LABELS.has(entity?.label)) {
        return 0;
    }

    if (LOW_SIGNAL_ENTITY_LABELS.has(entity?.label)) {
        return 2;
    }

    return 1;
}

function normalizeKeywords(result) {
    const entityKeywords = Array.isArray(result?.entities)
        ? result.entities
            .filter((entity) => !LOW_SIGNAL_ENTITY_LABELS.has(entity?.label))
            .sort((a, b) => rankEntity(a) - rankEntity(b))
            .map((entity) => entity?.text)
        : [];

    const fallbackKeywords = Array.isArray(result?.keywords) ? result.keywords : [];
    const merged = [...entityKeywords, ...fallbackKeywords].filter(Boolean);

    return [...new Set(merged)].slice(0, 8);
}

function normalizeEntityHighlights(entities) {
    return entities
        .filter((entity) => !LOW_SIGNAL_ENTITY_LABELS.has(entity?.label))
        .sort((a, b) => {
            const rankDiff = rankEntity(a) - rankEntity(b);
            if (rankDiff !== 0) {
                return rankDiff;
            }

            return (a?.start_char ?? 0) - (b?.start_char ?? 0);
        })
        .slice(0, 10);
}

function useArticleAnalysis() {
    const [analysisResults, setAnalysisResults] = useState([]);
    const [highlights, setHighlights] = useState([]);
    const [summaryText, setSummaryText] = useState("Waiting for analysis...");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);
    const [article, setArticle] = useState(null);
    const [nerContext, setNerContext] = useState({
        keywords: [],
        stories: [],
    });

    const [emotionStats, setEmotionStats] = useState({
        count: 0,
        signals: [],
        analyzedCount: 0,
        totalMass: 0,
        profile: [],
    });
    const [claimStats, setClaimStats] = useState({ count: 0, signals: [] });
    const [biasSummary, setBiasSummary] = useState({
        score: 0,
        direction: "center",
    });
    const [serviceStatus, setServiceStatus] = useState({
        isdFailed: false,
    });

    const API_BASE = "http://127.0.0.1:8000";

    const handleAnalyze = async () => {
        setErrorMsg("");
        setIsAnalyzing(true);
        setHighlights([]);
        setAnalysisResults([]);
        setSummaryText("Extracting article...");
        setEmotionStats({ count: 0, signals: [], analyzedCount: 0, totalMass: 0, profile: [] });
        setClaimStats({ count: 0, signals: [] });
        setBiasSummary({ score: 0, direction: "center" });
        setNerContext({ keywords: [], stories: [] });
        setServiceStatus({ isdFailed: false });

        try {
            const extractionResponse = await extractActiveTabArticle();

            const extractedArticle = extractionResponse.article;
            setArticle(extractedArticle);

            const paragraphs = splitIntoParagraphs(extractedArticle?.contentText);

            if (paragraphs.length === 0) {
                throw new Error("No usable paragraphs were extracted from the page.");
            }

            setSummaryText("Starting analysis...");

            const payload = {
                url: extractedArticle?.url || "",
                authors: extractedArticle?.byline ? [extractedArticle.byline] : [],
                headline: extractedArticle?.title || "",
                org: extractedArticle?.siteName || "",
                paragraphs,
            };

            console.group("🟦 Matador Analyze Request");
            console.log("payload:", payload);
            console.groupEnd();

            const res = await fetch(`${API_BASE}/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error(`Backend analyze failed (${res.status})`);
            }

            const { job_id } = await res.json();

            console.group("🟦 Matador Job Created");
            console.log("job_id:", job_id);
            console.groupEnd();

            const es = new EventSource(`${API_BASE}/stream/${job_id}`);
            let streamClosed = false;
            const seenFailures = new Set();

            const finishStream = (message = "") => {
                if (streamClosed) {
                    return;
                }

                streamClosed = true;
                setIsAnalyzing(false);
                setLastUpdated(new Date());
                if (message) {
                    setErrorMsg(message);
                }
                es.close();
            };

            es.onmessage = (event) => {
                const data = JSON.parse(event.data);
                const service = data?.service_name;
                const status = data?.status;
                const result = data?.result ?? null;

                console.group(`SSE: ${service || "unknown"}`);
                console.log("status:", status);
                console.log("result:", result);
                console.log("raw:", data);
                console.groupEnd();

                setAnalysisResults((prev) => [...prev, data]);

                if (service === "job_complete") {
                    const failures = Array.isArray(data?.failed_services)
                        ? data.failed_services
                        : Array.from(seenFailures);

                    const failureSummary = formatFailedServices(failures);

                    if (status === "failed") {
                        finishStream(
                            failureSummary
                                ? `Some analysis services failed: ${failureSummary}. Partial results are shown.`
                                : "Some analysis services failed. Partial results are shown."
                        );
                        return;
                    }

                    if (status === "complete" || status === "completed") {
                        finishStream(
                            failureSummary
                                ? `Some analysis services failed: ${failureSummary}. Partial results are shown.`
                                : ""
                        );
                        return;
                    }
                }

                if (status === "failed") {
                    console.error(`${service} failed`, data);
                    seenFailures.add(service);
<<<<<<< HEAD

                    if (service === "summarization_service") {
                        setSummaryText("Summary unavailable for this article.");
                    }

=======
>>>>>>> fca85d2 (Added coverage UI  and rework the logic for services to work in the frontend)
                    if (service === "isd_service") {
                        setServiceStatus((prev) => ({ ...prev, isdFailed: true }));
                    }
                    return;
                }

                if (status && status !== "completed") {
                    console.log(`${service} status:`, status);
                    return;
                }

<<<<<<< HEAD
                const summaryText =
                    service === "summarization_service" ||
                    ["textrank_service", "pagerank_service"].includes(service)
                        ? getSummaryTextFromResult(result)
                        : "";

                if (summaryText) {
                    console.log("Summary received");
                    setSummaryText(summaryText);
=======
                if (
                    ["textrank_service", "pagerank_service"].includes(service) &&
                    result?.summary
                ) {
                    console.log("Summary received");
                    setSummaryText(result.summary);
>>>>>>> fca85d2 (Added coverage UI  and rework the logic for services to work in the frontend)
                    return;
                }

                if (service === "ner_service") {
                    if (!Array.isArray(result?.entities)) {
                        console.warn("⚠️ ner_service completed but no entities returned");
                        return;
                    }

                    const displayEntities = normalizeEntityHighlights(result.entities);

                    const entityHighlights = displayEntities.map((ent, i) => ({
                        id: `ent-${i}-${ent?.text || "entity"}-${ent?.start_char ?? i}`,
                        subject: ent?.text || "Entity",
                        issue: "Named Entity",
                        confidence: "High",
                        quote: ent?.text || "",
                        explanation: `Detected ${ent?.label || "entity"} mention in the article.`,
                        type: "entity",
                        order: ent?.start_char ?? i,
                        signals: [ent?.label].filter(Boolean),
                    }));

                    console.group("NER processed");
                    console.log("entity count:", result.entities.length);
                    console.log("highlights:", entityHighlights);
                    console.groupEnd();

                    setNerContext({
                        keywords: normalizeKeywords(result),
                        stories: normalizeRelatedStories(result),
                    });

                    setHighlights((prev) => {
                        const withoutEntities = prev.filter((item) => item.type !== "entity");
                        return [...withoutEntities, ...entityHighlights];
                    });

                    return;
                }

                if (service === "ed_service") {
                    const flagged = Array.isArray(result?.flagged) ? result.flagged : [];
                    const okay = Array.isArray(result?.okay) ? result.okay : [];
                    const merged = [...flagged, ...okay];

                    const flaggedPassages =
                        flagged.length > 0
                            ? flagged
                            : merged.filter(
                                (item) =>
                                    Number(item?.mass || 0) >= 0.3 ||
                                    Number(item?.dominance || 0) >= 0.2
                            );

                    const emotionHighlights = flaggedPassages.map((item, i) => ({
                        id: `emo-${i}-${item?.start ?? i}-${item?.end ?? i}`,
                        subject: item?.top_emotion || "Emotion",
                        issue: "Emotional Framing",
                        confidence: getConfidenceFromScore(item?.mass || item?.dominance || 0),
                        quote: item?.token || "",
                        explanation: `This passage was flagged for elevated emotional weight. Top emotion: ${item?.top_emotion || "n/a"
                            }.`,
                        type: "emotional",
                        order: item?.start ?? i,
                        signals: [item?.top_emotion, ...Object.keys(item?.emotions || {})]
                            .filter(Boolean)
                            .slice(0, 4),
                    }));

                    const signalSource = flaggedPassages.length > 0 ? flaggedPassages : merged;
                    const topSignals = pickTopSignals(signalSource);
                    const emotionProfile = buildEmotionProfile(signalSource);

<<<<<<< HEAD
                    console.group("Emotion processed");
=======
                    console.group("🔥 Emotion processed");
>>>>>>> fca85d2 (Added coverage UI  and rework the logic for services to work in the frontend)
                    console.log("flagged count:", flagged.length);
                    console.log("okay count:", okay.length);
                    console.log("used highlights:", emotionHighlights.length);
                    console.log("top signals:", topSignals);
                    console.groupEnd();

                    setEmotionStats({
                        count: emotionHighlights.length,
                        signals: topSignals,
                        analyzedCount: merged.length,
                        totalMass: Number(result?.total_mass || 0),
                        profile: emotionProfile,
                    });

                    setHighlights((prev) => {
                        const withoutEmotion = prev.filter((item) => item.type !== "emotional");
                        return [...withoutEmotion, ...emotionHighlights];
                    });

                    return;
                }

                if (service === "cd_service") {
                    const sentences = normalizeClaimSentences(result);

                    const onlyClaims = sentences.filter(
                        (item) => item?.label === "checkworthy" || item?.label === "claim"
                    );

                    const claimHighlights = onlyClaims.map((item, i) => ({
                        id: item?.id || `claim-${i}`,
                        subject: "Claim",
                        issue: "Claim Detected",
                        confidence: getConfidenceFromScore(item?.score || 0),
                        quote: item?.text || "",
                        explanation:
                            "This sentence was classified as a claim by the claim detection model.",
                        type: "claim",
                        order: item?.start ?? i,
                        signals: [item?.label === "claim" ? "claim sentence" : "checkworthy sentence"],
                    }));

                    console.group("Claim processed");
                    console.log("sentence count:", sentences.length);
                    console.log("claim count:", onlyClaims.length);
                    console.log("claims:", onlyClaims);
                    console.groupEnd();

                    setClaimStats({
                        count: onlyClaims.length,
                        signals:
                            onlyClaims.length > 0
                                ? [
                                    onlyClaims.some((item) => item?.label === "claim")
                                        ? "claim sentence"
                                        : "checkworthy sentence",
                                    hasClaimLocations(onlyClaims)
                                        ? "locations available"
                                        : "locations missing",
                                ]
                                : [],
                    });

                    setHighlights((prev) => {
                        const withoutClaims = prev.filter((item) => item.type !== "claim");
                        return [...withoutClaims, ...claimHighlights];
                    });

                    return;
                }

                if (service === "isd_service") {
                    const numericBias = Number.parseFloat(result?.bias ?? 0);
                    const direction =
                        result?.direction ||
                        (numericBias < 0 ? "left" : numericBias > 0 ? "right" : "center");

                    console.group(" Bias processed");
                    console.log("raw bias:", result?.bias);
                    console.log("parsed bias:", numericBias);
                    console.log("direction:", direction);
                    console.groupEnd();

                    setBiasSummary({
                        score: Number.isFinite(numericBias) ? numericBias : 0,
                        direction,
                    });

                    return;
                }

                if (service === "job_complete") {
                    console.group("Job complete");
                    console.log("all collected results:", analysisResults);
                    console.groupEnd();

                    setIsAnalyzing(false);
                    setLastUpdated(new Date());
                    es.close();
                }
            };

            es.onerror = (err) => {
                if (streamClosed) {
                    return;
                }

                console.error("EventSource error", err);
                finishStream("Connection lost. Results may be incomplete.");
            };
        } catch (err) {
            console.error("Analysis start failed", err);
            const message = err instanceof Error ? err.message : "Failed to start analysis";
            if (
                message.includes("Receiving end does not exist") ||
                message.includes("Could not establish connection")
            ) {
                setErrorMsg(
                    "Could not reach the article extractor. Refresh the article tab and reopen the Matador panel."
                );
            } else {
                setErrorMsg(message);
            }
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
        nerContext,
        serviceStatus,
        handleAnalyze,
    };
}

export default useArticleAnalysis;
