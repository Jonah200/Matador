import SectionLabel from "./SectionLabel";
import InfoTooltip from "./InfoTooltip";
import { clampBiasScore, getBiasDescriptor, getBiasPositionPercent } from "../utils/analysisHelpers";

function BiasScaleCard({ score = 0, direction = "center", sourceLabel = "Ideological similarity score" }) {
    const clamped = clampBiasScore(score);
    const pointerLeft = getBiasPositionPercent(clamped);
    const descriptor = getBiasDescriptor(clamped, direction === "center" ? "" : direction);

    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 min-h-[140px]">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center min-w-0">
                    <SectionLabel text="Ideological Bias Scale" />
                    <InfoTooltip text="Article-level ideological leaning returned by ISD on a scale from -2 (left) to +2 (right)." />
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 whitespace-nowrap">
                    {descriptor}
                </span>
            </div>

            <div className="mt-1 flex items-end justify-between gap-3">
                <div>
                    <div className="text-[26px] leading-8 font-black text-slate-900">
                        {clamped > 0 ? "+" : ""}{clamped.toFixed(2)}
                    </div>
                    <div className="text-[12px] text-slate-600 mt-1">{sourceLabel}</div>
                </div>
            </div>

            <div className="mt-5">
                <div className="relative">
                    <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-slate-200 to-red-500" />
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white bg-slate-900 shadow"
                        style={{ left: `calc(${pointerLeft}% - 8px)` }}
                        aria-hidden="true"
                    />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-slate-500 font-semibold">
                    <span>Left (-2)</span>
                    <span>Center (0)</span>
                    <span>Right (+2)</span>
                </div>
            </div>
        </div>
    );
}

export default BiasScaleCard;
