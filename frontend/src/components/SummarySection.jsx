import SectionLabel from "./SectionLabel";

function SummarySection({ domain, summaryText, copied, onCopy, lastUpdated }) {
    return (
        <>
            {lastUpdated && (
                <div className="flex items-center gap-2 px-1 animate-in fade-in duration-500">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                            Analyzed from: {domain}
                        </span>
                    </div>

                    <div className="text-[10px] text-slate-500 font-semibold">
                        Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                </div>
            )}

            <section className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-l-blue-500">
                <div className="flex justify-between items-start">
                    <SectionLabel text="Summary" />

                    <button
                        type="button"
                        onClick={onCopy}
                        className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                        aria-label="Copy summary to clipboard"
                    >
                        {copied ? (
                            <span className="flex items-center gap-1">
                                <span className="text-[12px]">✓</span>
                                <span>COPIED</span>
                            </span>
                        ) : (
                            <>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                </svg>
                                <span>COPY</span>
                            </>
                        )}
                    </button>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed mt-1">{summaryText}</p>
            </section>
        </>
    );
}

export default SummarySection;