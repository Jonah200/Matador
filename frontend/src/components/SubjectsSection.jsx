import SectionLabel from "./SectionLabel";

function SubjectsSection({
    highlights,
    subjects,
    subjectCounts,
    activeSubject,
    setActiveSubject,
    showAllSubjects,
    setShowAllSubjects,
}) {
    const MAX_SUBJECTS = 5;
    const visibleSubjects = showAllSubjects ? subjects : subjects.slice(0, MAX_SUBJECTS);
    const hasMoreSubjects = subjects.length > MAX_SUBJECTS;

    return (
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-end justify-between">
                <div>
                    <SectionLabel text="Subjects Identified" />
                    <div className="text-[12px] text-slate-600">Filter highlights by subject:</div>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setActiveSubject("ALL")}
                    className={[
                        "text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all",
                        activeSubject === "ALL"
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200 hover:border-blue-200",
                        "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2",
                    ].join(" ")}
                    aria-pressed={activeSubject === "ALL"}
                >
                    Show all <span className="ml-1 opacity-80">{highlights.length}</span>
                </button>

                {visibleSubjects.map((tag) => {
                    const count = subjectCounts[tag] || 0;

                    return (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => setActiveSubject(tag)}
                            className={[
                                "text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all",
                                activeSubject === tag
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : count === 0
                                        ? "bg-white text-slate-400 border-slate-200"
                                        : "bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200 hover:border-blue-200",
                                "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2",
                            ].join(" ")}
                            aria-pressed={activeSubject === tag}
                        >
                            {tag} <span className="ml-1 opacity-80">{count}</span>
                        </button>
                    );
                })}

                {hasMoreSubjects ? (
                    <button
                        type="button"
                        onClick={() => setShowAllSubjects((v) => !v)}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    >
                        {showAllSubjects ? "Show less" : `+${subjects.length - MAX_SUBJECTS} more`}
                    </button>
                ) : null}
            </div>
        </section>
    );
}

export default SubjectsSection;