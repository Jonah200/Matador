import { useEffect, useState, useMemo } from 'react'
import './App.css'

const SectionLabel = ({ text }) => (
  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
    {text}
  </h2>
);

const InfoTooltip = ({ label, text }) => {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50
                   focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        i
      </button>

      {open ? (
        <div
          className="absolute bottom-7 right-0 w-64 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-xl p-3 z-20"
          role="dialog"
          aria-label={label}
        >
          <div className="text-[12px] text-slate-700 leading-5">{text}</div>
          <button
            type="button"
            className="mt-2 text-[12px] font-bold text-blue-600 hover:underline
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 rounded"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
      ) : null}
    </span>
  );
};

const EvidenceCard = ({
  title,
  tooltipText,
  presenceLabel,
  presencePillClass,
  countLabel,
  signals,
}) => {
  return (
    <div
      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 min-h-[110px]"
      role="group"
      aria-label={title}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-center">
          <SectionLabel text={title} />
          <InfoTooltip label={`${title} definition`} text={tooltipText} />
        </div>

        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${presencePillClass}`}>
          {presenceLabel}
        </span>
      </div>

      <div className="mt-1">
        <div className="text-[28px] leading-8 font-black text-slate-900">{countLabel}</div>
      </div>

      <div className="mt-4">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
          Signals identified
        </div>

        {signals.length === 0 ? (
          <div className="text-[12px] text-slate-600 leading-5">
            No signals found in highlighted passages.
          </div>
        ) : (
          <ul className="space-y-1">
            {signals.map((s) => (
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
};

const HighlightCard = ({ h, onJump }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-slate-950 text-white p-4 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs italic text-slate-200 font-serif leading-relaxed">
          “{h.quote}”
        </p>

        <div className="flex items-center gap-2">
          {/* (3) NEW: Jump button (wired as a stub — see handler below) */}
          <button
            type="button"
            onClick={() => onJump?.(h)}
            className="shrink-0 rounded-lg px-2 py-1 text-[12px] text-slate-200 hover:bg-white/10 transition
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            aria-label="Jump to this passage in the article"
          >
            Jump
          </button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 rounded-lg px-2 py-1 text-[12px] text-slate-200 hover:bg-white/10 transition
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            aria-expanded={open}
            aria-controls={`explain-${h.id}`}
          >
            <span className="inline-flex items-center gap-1">
              <span className={`transition-transform ${open ? "rotate-180" : "rotate-0"}`}>▾</span>
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
};


function App() {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Bias UI state
  const [showBias, setShowBias] = useState(true);
  const [activeSubject, setActiveSubject] = useState("ALL");

  // Sorting
  const [sortMode, setSortMode] = useState("order"); 

  // Collapse subjects
  const [showAllSubjects, setShowAllSubjects] = useState(false);


  // Placeholder subjects
  const summaryText =
    "This article explores the legislative shift in climate policy. The narrative relies on emotional appeals to highlight government inaction.";

  const highlights = [
    {
      id: "h1",
      subject: "EPA",
      issue: "Loaded Adjective",
      confidence: "Medium",
      quote: "...the government's catastrophic failure to protect citizens...",
      explanation:
        "The phrase uses emotionally loaded language that frames the situation as an extreme moral failing.",
      signals: ["Loaded adjectives", "Catastrophic framing"],
      type: "emotional",
      order: 1,
    },
  ];

  const domain = useMemo(() => {
    try {
      if (!url) return "";
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return "";
    }
  }, [url]);

  const subjects = useMemo(() => {
    const set = new Set();
    for (const h of highlights) if (h.subject) set.add(h.subject);
    return Array.from(set);
  }, [highlights]);


  const subjectCounts = useMemo(() => {
    const counts = {};
    for (const h of highlights) {
      const key = h.subject || 'Other';
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [highlights]);

  const filteredHighlights = useMemo(() => {
    const base = activeSubject === "ALL"
      ? highlights
      : highlights.filter((h) => h.subject === activeSubject);

    const confidenceRank = { High: 3, Medium: 2, Low: 1 };

    const sorted = [...base].sort((a, b) => {
      if (sortMode === "confidence") {
        return (confidenceRank[b.confidence] || 0) - (confidenceRank[a.confidence] || 0);
      }
      return (a.order || 0) - (b.order || 0);
    });

    return sorted;
  }, [highlights, activeSubject, sortMode]);

  const totalHighlightCount = highlights.length;
  const shownHighlightCount = filteredHighlights.length;

  const emotionalSignals = useMemo(() => {
    const set = new Set();
    for (const h of highlights) {
      if (h.type === "emotional") for (const s of h.signals || []) set.add(s);
    }
    return Array.from(set);
  }, [highlights]);

  const subjectivitySignals = useMemo(() => {
    const set = new Set();
    for (const h of highlights) {
      if (h.type === "subjective") for (const s of h.signals || []) set.add(s);
    }
    return Array.from(set);
  }, [highlights]);

  const emotionalCount = useMemo(() => highlights.filter((h) => h.type === "emotional").length, [highlights]);
  const subjectivityCount = useMemo(() => highlights.filter((h) => h.type === "subjective").length, [highlights]);

  const emotionalPresence = emotionalCount >= 3 ? "High" : emotionalCount >= 1 ? "Detected" : "None";
  const subjectivityPresence = subjectivityCount >= 3 ? "High" : subjectivityCount >= 1 ? "Detected" : "None";

  const pillClass = (presence) =>
    presence === "High"
      ? "bg-red-50 text-red-700"
      : presence === "Detected"
        ? "bg-amber-50 text-amber-700"
        : "bg-emerald-50 text-emerald-700";

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        setUrl(tabs[0].url)
      }
    });
  }, [])

  const handleCopy = () => {
    const text = `Summary (${domain || "current article"}):\n\n${summaryText}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleAnalyze = async () => {
    setErrorMsg("");
    setIsAnalyzing(true);

    try {
      // TODO: replace with  API call
      await new Promise((r) => setTimeout(r, 800));

      setLastUpdated(new Date());
    } catch (e) {
      setErrorMsg("Couldn’t analyze this page (unsupported layout, paywall, or blocked content).");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleJumpToHighlight = (h) => {
    // TODO: Implement content script that finds text in DOM and scrolls/highlights it.
    // chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    //   chrome.tabs.sendMessage(tab.id, { type: "JUMP_TO_HIGHLIGHT", payload: h });
    // });
    console.log("Jump requested:", h);
  };

  const MAX_SUBJECTS = 5;
  const visibleSubjects = showAllSubjects ? subjects : subjects.slice(0, MAX_SUBJECTS);
  const hasMoreSubjects = subjects.length > MAX_SUBJECTS;

  return (
    <div className= "min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="p-4 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-black text-blue-600 tracking-tight">Matador</h1>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className={[
            "text-[11px] font-black py-2 px-5 rounded-full shadow-md transition-colors block",
            isAnalyzing ? "bg-blue-300 text-white cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white",
            "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2",
          ].join(" ")}
          aria-label="Analyze the current article"
        >
          {isAnalyzing ? "Analyzing…" : "Analyze"}
        </button>
      </header>

      <main className = "p-3 space-y-4">

        {/* Verified source row */}
        <div className="flex items-center gap-2 px-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
              Verified Source: Associated Press
            </span>
          </div>

          {/* Last updated */}
          <div className="text-[10px] text-slate-500 font-semibold">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
          </div>
        </div>

        {/* Show domain and errors */}
        {domain ? (
          <div className="px-1 text-[12px] text-slate-600">
            Analyzed from: <span className="font-semibold">{domain}</span>
          </div>
        ) : null}

        {errorMsg ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] text-red-700">
            {errorMsg}
          </div>
        ) : null}

        {/* Article Summary*/}
        <section className= "bg-white rounded-2xl p-4 shadow-sm border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <SectionLabel text="Summary"/>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              aria-label="Copy summary to clipboard"
            >
              {copied ? '✓ COPIED' : 'COPY'}
            </button>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{summaryText}</p>
        </section>

       {/* Subjects */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-end justify-between">
            <div>
              <SectionLabel text="Subjects Identified" />
              <div className="text-[12px] text-slate-600">
                Filter highlights by subject:
              </div>
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
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50
                           focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              >
                {showAllSubjects ? "Show less" : `+${subjects.length - MAX_SUBJECTS} more`}
              </button>
            ) : null}
          </div>
        </section>

        {/* Section 3: Analysis */}
        <div className="grid grid-cols-2 gap-3">
          <EvidenceCard
            title="Emotional Language"
            tooltipText="Flags emotionally charged framing such as loaded adjectives, intensifiers, moralized language, or catastrophic wording."
            presenceLabel={emotionalPresence}
            presencePillClass={pillClass(emotionalPresence)}
            countLabel={
              emotionalCount === 0
                ? "None detected"
                : `Detected in ${emotionalCount} passage${emotionalCount === 1 ? "" : "s"}`
            }
            signals={emotionalSignals}
          />

          <EvidenceCard
            title="Subjectivity"
            tooltipText="Flags opinionated or interpretive phrasing (e.g., speculation, editorial language) rather than straightforward statements of fact."
            presenceLabel={subjectivityPresence}
            presencePillClass={pillClass(subjectivityPresence)}
            countLabel={
              subjectivityCount === 0
                ? "None detected"
                : `Detected in ${subjectivityCount} passage${subjectivityCount === 1 ? "" : "s"}`
            }
            signals={subjectivitySignals}
          />
        </div>

        {/* Bias Highlights */}
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
                className="text-[12px] border border-slate-200 rounded-lg px-2 py-2 bg-white text-slate-700
                           focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                aria-label="Sort bias highlights"
              >
                <option value="order">Sort: In article order</option>
                <option value="confidence">Sort: Highest confidence</option>
              </select>

              <button
                type="button"
                onClick={() => setShowBias((v) => !v)}
                className="rounded-lg px-3 py-2 text-[12px] font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50
                           focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
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
                  <HighlightCard key={h.id} h={h} onJump={handleJumpToHighlight} />
                ))
              )}
            </div>
          ) : null}
        </section>
      </main>
    </div>

  )
}

export default App
