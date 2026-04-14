import EvidenceCard from "./EvidenceCard";

function AnalysisGrid({
    emotionalPresence,
    emotionalPillClass,
    emotionalCount,
    emotionalSignals,
    emotionalAnalyzedCount,
    emotionalTotalMass,
    emotionalProfile,
    claimPresence,
    claimPillClass,
    claimCount,
    claimSignals,
}) {
    return (
        <div className="grid grid-cols-2 gap-3">
            <EvidenceCard
                title="Emotional Language"
                tooltipText="Flags passages with elevated emotional mass and their strongest detected emotional signals."
                presenceLabel={emotionalPresence}
                presencePillClass={emotionalPillClass}
                countLabel={
                    emotionalCount === 0
                        ? emotionalAnalyzedCount > 0
                            ? `0 flagged / ${emotionalAnalyzedCount} analyzed`
                            : "None detected"
                        : `${emotionalCount} flagged passage${emotionalCount === 1 ? "" : "s"}`
                }
                subValue={
                    emotionalAnalyzedCount > 0
                        ? `Total emotional mass: ${Number(emotionalTotalMass || 0).toFixed(2)}`
                        : "Based on emotion-detection output across the article."
                }
                signals={emotionalSignals}
                chartItems={emotionalProfile}
            />

            <EvidenceCard
                title="Claims Detected"
                tooltipText="Counts sentences classified as claims so the UI can separate assertions from background description or setup."
                presenceLabel={claimPresence}
                presencePillClass={claimPillClass}
                countLabel={
                    claimCount === 0
                        ? "No claims"
                        : `${claimCount} claim${claimCount === 1 ? "" : "s"}`
                }
                subValue="Claim detection should ideally include sentence locations for jump-to-text support."
                signals={claimSignals}
            />
        </div>
    );
}

export default AnalysisGrid;
