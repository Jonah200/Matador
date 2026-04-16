import { useState } from "react";
import { formatSubjectLabel } from "../utils/analysisHelpers";

function HighlightCard({ h, onJump }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <p className="text-xs italic text-slate-800 font-serif leading-relaxed">
                    “{h.quote}”
                </p>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onJump?.(h)}
                        className="shrink-0 rounded-lg px-2 py-1 text-[12px] font-semibold text-blue-700 hover:bg-blue-100 transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-blue-50"
                        aria-label="Jump to this passage in the article"
                    >
                        Jump
                    </button>

                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        className="shrink-0 rounded-lg px-2 py-1 text-[12px] font-semibold text-blue-700 hover:bg-blue-100 transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-blue-50"
                        aria-expanded={open}
                        aria-controls={`explain-${h.id}`}
                    >
                        <span className="inline-flex items-center gap-1">
                            <span className={`transition-transform ${open ? "rotate-180" : "rotate-0"}`}>
                                ▾
                            </span>
                            Explain
                        </span>
                    </button>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-rose-100 text-rose-700 px-2 py-1 text-[11px] font-semibold">
                    ISSUE: {h.issue}
                </span>

                <span className="rounded-full bg-white text-blue-700 ring-1 ring-blue-100 px-2 py-1 text-[11px] font-semibold">
                    Confidence: {h.confidence}
                </span>

                {h.subject ? (
                    <span className="rounded-full bg-white text-slate-600 ring-1 ring-slate-200 px-2 py-1 text-[11px]">
                        {formatSubjectLabel(h.subject)}
                    </span>
                ) : null}
            </div>

            {open ? (
                <div id={`explain-${h.id}`} className="mt-3 text-[12px] leading-5 text-slate-700">
                    {h.explanation}
                </div>
            ) : null}
        </div>
    );
}

export default HighlightCard;
