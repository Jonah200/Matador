import SectionLabel from "./SectionLabel";
import InfoTooltip from "./InfoTooltip";

function EvidenceCard({
    title,
    tooltipText,
    presenceLabel,
    presencePillClass,
    countLabel,
    signals = [],
}) {
    const safeSignals = Array.isArray(signals) ? signals : [];

    return (
        <div
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 min-h-[110px]"
            role="group"
            aria-label={title}
        >
            <div className="flex flex-wrap justify-between items-start gap-1">
                <div className="flex items-center min-w-0">
                    <SectionLabel text={title} />
                    <InfoTooltip text={tooltipText} />
                </div>

                <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 whitespace-nowrap ${presencePillClass}`}
                >
                    {presenceLabel}
                </span>
            </div>

            <div className="mt-1">
                <div className="text-[28px] leading-8 font-black text-slate-900">
                    {countLabel}
                </div>
            </div>

            <div className="mt-4">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Signals identified
                </div>

                {safeSignals.length === 0 ? (
                    <div className="text-[12px] text-slate-600 leading-5">
                        No signals found in highlighted passages.
                    </div>
                ) : (
                    <ul className="space-y-1">
                        {safeSignals.map((s) => (
                            <li key={s} className="text-[12px] text-slate-700 flex gap-2 leading-5">
                                <span className="text-slate-300">•</span>
                                <span>{s}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default EvidenceCard;