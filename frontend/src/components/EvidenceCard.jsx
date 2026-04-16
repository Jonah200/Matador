import SectionLabel from "./SectionLabel";
import InfoTooltip from "./InfoTooltip";

function EvidenceCard({
    title,
    tooltipText,
    presenceLabel,
    presencePillClass,
    countLabel,
    subValue,
    signals = [],
    chartItems = [],
}) {
    const safeSignals = Array.isArray(signals) ? signals : [];
    const safeChartItems = Array.isArray(chartItems) ? chartItems : [];

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
                {subValue ? (
                    <div className="text-[12px] text-slate-600 mt-1">{subValue}</div>
                ) : null}
            </div>

            {safeChartItems.length > 0 ? (
                <div className="mt-4">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Signal mix
                    </div>
                    <div className="mb-3 space-y-2">
                        {safeChartItems.map((item) => (
                            <div key={item.label}>
                                <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                                    <span>{item.label}</span>
                                    <span>{item.percent}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-300"
                                        style={{ width: `${item.percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="mt-4">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Signals identified
                    </div>
                    {safeSignals.length === 0 ? (
                        <div className="text-[12px] text-slate-600 leading-5">
                            No signals found in highlighted passages.
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {safeSignals.map((s) => (
                                <span
                                    key={s}
                                    className="rounded-full bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200"
                                >
                                    {s}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default EvidenceCard;
