import { useMemo, useState } from "react";
import "./App.css";

import Header from "./components/Header";
import SummarySection from "./components/SummarySection";
import SubjectsSection from "./components/SubjectsSection";
import AnalysisGrid from "./components/AnalysisGrid";
import BiasHighlightsSection from "./components/BiasHighlightsSection";

import useArticleAnalysis from "./hooks/useArticleAnalysis";

import {
  getDomain,
  getSubjects,
  getSubjectCounts,
  getFilteredHighlights,
  getSignalsByType,
  getCountByType,
  getPresenceLabel,
  getPresencePillClass,
} from "./utils/analysisHelpers";

function App() {
  const [copied, setCopied] = useState(false);
  const [showBias, setShowBias] = useState(true);
  const [activeSubject, setActiveSubject] = useState("ALL");
  const [sortMode, setSortMode] = useState("order");
  const [showAllSubjects, setShowAllSubjects] = useState(false);

  const {
    article,
    highlights,
    summaryText,
    isAnalyzing,
    errorMsg,
    lastUpdated,
    handleAnalyze,
  } = useArticleAnalysis();

  const domain = useMemo(() => getDomain(article?.url || ""), [article]);
  const subjects = useMemo(() => getSubjects(highlights), [highlights]);
  const subjectCounts = useMemo(() => getSubjectCounts(highlights), [highlights]);

  const filteredHighlights = useMemo(
    () => getFilteredHighlights(highlights, activeSubject, sortMode),
    [highlights, activeSubject, sortMode]
  );

  const emotionalSignals = useMemo(
    () => getSignalsByType(highlights, "emotional"),
    [highlights]
  );

  const subjectivitySignals = useMemo(
    () => getSignalsByType(highlights, "subjective"),
    [highlights]
  );

  const emotionalCount = useMemo(
    () => getCountByType(highlights, "emotional"),
    [highlights]
  );

  const subjectivityCount = useMemo(
    () => getCountByType(highlights, "subjective"),
    [highlights]
  );

  const emotionalPresence = getPresenceLabel(emotionalCount);
  const subjectivityPresence = getPresenceLabel(subjectivityCount);

  const totalHighlightCount = highlights.length;
  const shownHighlightCount = filteredHighlights.length;

  const handleCopy = () => {
    const text = `Summary (${domain || "current article"}):\n\n${summaryText}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleJumpToHighlight = (h) => {
    console.log("Jump requested:", h);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <Header isAnalyzing={isAnalyzing} onAnalyze={handleAnalyze} />

      <main className="p-3 space-y-4">
        {errorMsg ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] text-red-700">
            {errorMsg}
          </div>
        ) : null}

        <SummarySection
          domain={domain}
          summaryText={summaryText}
          copied={copied}
          onCopy={handleCopy}
          lastUpdated={lastUpdated}
        />

        <SubjectsSection
          highlights={highlights}
          subjects={subjects}
          subjectCounts={subjectCounts}
          activeSubject={activeSubject}
          setActiveSubject={setActiveSubject}
          showAllSubjects={showAllSubjects}
          setShowAllSubjects={setShowAllSubjects}
        />

        <AnalysisGrid
          emotionalPresence={emotionalPresence}
          emotionalPillClass={getPresencePillClass(emotionalPresence)}
          emotionalCount={emotionalCount}
          emotionalSignals={emotionalSignals}
          subjectivityPresence={subjectivityPresence}
          subjectivityPillClass={getPresencePillClass(subjectivityPresence)}
          subjectivityCount={subjectivityCount}
          subjectivitySignals={subjectivitySignals}
        />

        <BiasHighlightsSection
          showBias={showBias}
          setShowBias={setShowBias}
          sortMode={sortMode}
          setSortMode={setSortMode}
          filteredHighlights={filteredHighlights}
          shownHighlightCount={shownHighlightCount}
          totalHighlightCount={totalHighlightCount}
          activeSubject={activeSubject}
          onJump={handleJumpToHighlight}
        />
      </main>
    </div>
  );
}

export default App;