import EvidenceCard from "./EvidenceCard";

function AnalysisGrid({
    emotionalPresence,
    emotionalPillClass,
    emotionalCount,
    emotionalSignals,
    subjectivityPresence,
    subjectivityPillClass,
    subjectivityCount,
    subjectivitySignals,
}) {
    return (
        <div className="grid grid-cols-2 gap-3">
            <EvidenceCard
                title="Emotional Language"
                tooltipText="Flags emotionally charged framing such as loaded adjectives, intensifiers, moralized language, or catastrophic wording."
                presenceLabel={emotionalPresence}
                presencePillClass={emotionalPillClass}
                countLabel={
                    emotionalCount === 0
                        ? "None detected"
                        : `Detected in ${emotionalCount} passage${emotionalCount === 1 ? "" : "s"}`
                }
                signals={emotionalSignals}
            />

            <EvidenceCard
                title="Subjectivity"
                tooltipText="Flags opinionated or interpretive phrasing (e.g., speculation, editorial language) rather than straightforward statements of fact."
                presenceLabel={subjectivityPresence}
                presencePillClass={subjectivityPillClass}
                countLabel={
                    subjectivityCount === 0
                        ? "None detected"
                        : `Detected in ${subjectivityCount} passage${subjectivityCount === 1 ? "" : "s"}`
                }
                signals={subjectivitySignals}
            />
        </div>
    );
}

export default AnalysisGrid;