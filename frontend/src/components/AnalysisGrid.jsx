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
    claimAverageScore,
}) {
    return (
        <div className="grid grid-cols-2 gap-3">
            <EvidenceCard
                title="Emotional Language"
                tooltipText="Shows where the wording feels emotionally loaded, so readers can spot passages that may be trying to intensify a reaction."
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
                tooltipText="Counts sentences the model reads as claims or checkworthy statements, so assertions stand apart from background context."
                presenceLabel={claimPresence}
                presencePillClass={claimPillClass}
                countLabel={
                    claimCount === 0
                        ? "No claims"
                        : `${claimCount} claim${claimCount === 1 ? "" : "s"}`
                }
                subValue={
                    claimCount === 0 || !Number.isFinite(claimAverageScore)
                        ? "Model-scored claim sentences across the article."
                        : `Average model confidence: ${Math.round(claimAverageScore * 100)}%`
                }
                signals={claimSignals}
            />
        </div>
    );
}

export default AnalysisGrid;
