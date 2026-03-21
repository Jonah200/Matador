import SectionLabel from "./SectionLabel";
import HighlightCard from "./HighlightCard";

function BiasHighlightsSection({
    showBias,
    setShowBias,
    sortMode,
    setSortMode,
    filteredHighlights,
    shownHighlightCount,
    totalHighlightCount,
    activeSubject,
    onJump,
}) {
    return (
        <section className="bg-white rounded-2xl p-0 shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-3">
                <div>
                    <SectionLabel text="Bias Highlights" />
                    <div className="text-[12px] text-slate-600">
                        Showing <span className="font-semibold">{shownHighlightCount}</span> of{" "}
                        <span className="font-semibold">{totalHighlightCount}</span>
                        {activeSubject !== "ALL" ? (
                            <>
                                {" "}
                                (filtered by <span className="font-semibold">{activeSubject}</span>)
                            </>
                        ) : null}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value)}
                        className="text-[12px] border border-slate-200 rounded-lg px-2 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                        aria-label="Sort bias highlights"
                    >
                        <option value="order">Sort: In article order</option>
                        <option value="confidence">Sort: Highest confidence</option>
                    </select>

                    <button
                        type="button"
                        onClick={() => setShowBias((v) => !v)}
                        className="rounded-lg px-3 py-2 text-[12px] font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                        aria-expanded={showBias}
                        aria-controls="bias-highlights"
                    >
                        {showBias ? "Hide" : "Show"}
                    </button>
                </div>
            </div>

            {showBias ? (
                <div id="bias-highlights" className="p-4 pt-0 space-y-3">
                    {filteredHighlights.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[12px] text-slate-600">
                            No highlights for this subject.
                        </div>
                    ) : (
                        filteredHighlights.map((h) => (
                            <HighlightCard key={h.id} h={h} onJump={onJump} />
                        ))
                    )}
                </div>
            ) : null}
        </section>
    );
}

export default BiasHighlightsSection;