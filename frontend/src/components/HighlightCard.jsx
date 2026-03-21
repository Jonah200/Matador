import { useState } from "react";

function HighlightCard({ h, onJump }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="rounded-2xl bg-slate-950 text-white p-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
                <p className="text-xs italic text-slate-200 font-serif leading-relaxed">
                    “{h.quote}”
                </p>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onJump?.(h)}
                        className="shrink-0 rounded-lg px-2 py-1 text-[12px] text-slate-200 hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                        aria-label="Jump to this passage in the article"
                    >
                        Jump
                    </button>

                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        className="shrink-0 rounded-lg px-2 py-1 text-[12px] text-slate-200 hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950"
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
                <span className="rounded-full bg-red-600/15 text-red-200 px-2 py-1 text-[11px] font-semibold">
                    ISSUE: {h.issue}
                </span>

                <span className="rounded-full bg-white/10 text-slate-200 px-2 py-1 text-[11px] font-semibold">
                    Confidence: {h.confidence}
                </span>

                {h.subject ? (
                    <span className="rounded-full bg-white/10 text-slate-200 px-2 py-1 text-[11px]">
                        Subject: {h.subject}
                    </span>
                ) : null}
            </div>

            {open ? (
                <div id={`explain-${h.id}`} className="mt-3 text-[12px] leading-5 text-slate-200">
                    {h.explanation}
                </div>
            ) : null}
        </div>
    );
}

export default HighlightCard;