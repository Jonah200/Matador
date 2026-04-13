export function getDomain(url) {
    try {
        if (!url) return "";
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return "";
    }
}

export function getSubjects(highlights) {
    const set = new Set();

    for (const h of highlights) {
        if (h.subject) {
            set.add(h.subject);
        }
    }

    return Array.from(set);
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
    const abs = Math.abs(numeric);

    if (abs < 0.35) return "Near center";
    if (abs < 0.9) return `Slightly ${direction || (numeric < 0 ? "left" : "right")}`;
    if (abs < 1.4) return `Moderately ${direction || (numeric < 0 ? "left" : "right")}`;
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