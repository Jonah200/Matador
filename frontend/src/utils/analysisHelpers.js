export function getDomain(url) {
    try {
        if (!url) return "";
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return "";
    }
}

export function getSubjects(highlights) {
    const counts = getSubjectCounts(highlights);

    return Object.keys(counts).sort((a, b) => {
        const countDiff = (counts[b] || 0) - (counts[a] || 0);
        if (countDiff !== 0) return countDiff;
        return formatSubjectLabel(a).localeCompare(formatSubjectLabel(b));
    });
}

export function getSubjectCounts(highlights) {
    const counts = {};

    for (const h of highlights) {
        const key = h.subject || "Other";
        counts[key] = (counts[key] || 0) + 1;
    }

    return counts;
}

export function getFilteredHighlights(highlights, activeSubject, sortMode) {
    const base =
        activeSubject === "ALL"
            ? highlights
            : highlights.filter((h) => h.subject === activeSubject);

    const confidenceRank = { High: 3, Medium: 2, Low: 1 };

    return [...base].sort((a, b) => {
        if (sortMode === "confidence") {
            if (Number.isFinite(b.confidenceScore) || Number.isFinite(a.confidenceScore)) {
                return (b.confidenceScore || 0) - (a.confidenceScore || 0);
            }

            return (confidenceRank[b.confidence] || 0) - (confidenceRank[a.confidence] || 0);
        }

        return (a.order || 0) - (b.order || 0);
    });
}

export function getSignalsByType(highlights, type) {
    const set = new Set();

    for (const h of highlights) {
        if (h.type === type) {
            for (const s of h.signals || []) {
                set.add(s);
            }
        }
    }

    return Array.from(set);
}

export function getCountByType(highlights, type) {
    return highlights.filter((h) => h.type === type).length;
}

export function formatSubjectLabel(subject) {
    if (!subject) return "Other";
    if (subject === "Claims") return "Claims";

    const words = String(subject)
        .replace(/[_-]+/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

    if (words.length === 0) return "Other";

    return `Emotion: ${words.join(" ")}`;
}

export function getPresenceLabel(count) {
    if (count >= 5) return "High";
    if (count >= 2) return "Moderate";
    if (count >= 1) return "Detected";
    return "None";
}

export function getPresencePillClass(presence) {
    if (presence === "High") return "bg-red-50 text-red-700";
    if (presence === "Moderate") return "bg-orange-50 text-orange-700";
    if (presence === "Detected") return "bg-amber-50 text-amber-700";
    return "bg-emerald-50 text-emerald-700";
}

export function getBiasDescriptor(score, direction) {
    const numeric = Number.isFinite(score) ? score : 0;
    const percent = getBiasLeanPercent(numeric);

    if (percent < 18) return "Near center";
    if (percent < 45) return `Slightly ${direction || (numeric < 0 ? "left" : "right")}`;
    if (percent < 70) return `Moderately ${direction || (numeric < 0 ? "left" : "right")}`;
    return `Strongly ${direction || (numeric < 0 ? "left" : "right")}`;
}

export function clampBiasScore(score) {
    const numeric = Number.isFinite(score) ? score : 0;
    return Math.max(-2, Math.min(2, numeric));
}

export function getBiasPositionPercent(score) {
    const clamped = clampBiasScore(score);
    return ((clamped + 2) / 4) * 100;
}

export function getBiasLeanPercent(score) {
    const clamped = clampBiasScore(score);
    return Math.round((Math.abs(clamped) / 2) * 100);
}

export function formatBiasPercent(score, direction) {
    const clamped = clampBiasScore(score);
    const percent = getBiasLeanPercent(clamped);
    const side = direction && direction !== "center"
        ? direction
        : clamped < 0
            ? "left"
            : clamped > 0
                ? "right"
                : "center";

    if (side === "center" || percent === 0) {
        return `${percent}% center`;
    }

    return `${percent}% ${side}`;
}

export function formatPublishDate(value) {
    if (!value) return "Unknown";

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleDateString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}
