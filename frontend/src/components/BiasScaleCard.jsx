import SectionLabel from "./SectionLabel";
import InfoTooltip from "./InfoTooltip";
import {
    clampBiasScore,
    formatBiasPercent,
    getBiasDescriptor,
    getBiasPositionPercent,
} from "../utils/analysisHelpers";

function BiasScaleCard({
    score = 0,
    direction = "center",
    sourceLabel = "Ideological similarity score",
    unavailable = false,
}) {
    const clamped = clampBiasScore(score);
    const pointerLeft = getBiasPositionPercent(clamped);
    const descriptor = getBiasDescriptor(clamped, direction === "center" ? "" : direction);
    const percentLabel = formatBiasPercent(clamped, direction);

    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 min-h-[140px]">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center min-w-0">
                    <SectionLabel text="Ideological Bias Scale" />
                    <InfoTooltip text="Estimates whether the article’s framing leans left, right, or stays near the center, shown here as distance from the middle." />
                </div>
                <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap ${unavailable
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                        }`}
                >
                    {unavailable ? "Unavailable" : descriptor}
                </span>
            </div>

            <div className="mt-1 flex items-end justify-between gap-3">
                <div>
                    <div className="text-[26px] leading-8 font-black text-slate-900">
                        {unavailable ? "N/A" : percentLabel}
                    </div>
                    <div className="text-[12px] text-slate-600 mt-1">
                        {unavailable ? "ISD service did not return a score for this article." : sourceLabel}
                    </div>
                </div>
            </div>

            <div className="mt-5">
                <div className="relative">
                    <div className={`h-2 rounded-full ${unavailable ? "bg-slate-200" : "bg-gradient-to-r from-blue-500 via-slate-200 to-red-500"}`} />
                    {!unavailable ? (
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white bg-slate-900 shadow"
                            style={{ left: `calc(${pointerLeft}% - 8px)` }}
                            aria-hidden="true"
                        />
                    ) : null}
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-slate-500 font-semibold">
                    <span>100% left</span>
                    <span>Center</span>
                    <span>100% right</span>
                </div>
            </div>
        </div>
    );
}

export default BiasScaleCard;
