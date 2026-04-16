import { useMemo, useState } from "react";
import "./App.css";

import Header from "./components/Header";
import SummarySection from "./components/SummarySection";
import RelatedCoverageSection from "./components/RelatedCoverageSection";
import SubjectsSection from "./components/SubjectsSection";
import AnalysisGrid from "./components/AnalysisGrid";
import BiasHighlightsSection from "./components/BiasHighlightsSection";
import BiasScaleCard from "./components/BiasScaleCard";
import { MATADOR_FOCUS_TEXT_REQUEST } from "./content/contentScript";

import useArticleAnalysis from "./hooks/useArticleAnalysis";

import {
  getDomain,
  getSubjects,
  getSubjectCounts,
  getFilteredHighlights,
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
    emotionStats,
    claimStats,
    biasSummary,
    nerContext,
    serviceStatus,
    handleAnalyze,
  } = useArticleAnalysis();

  const domain = useMemo(() => getDomain(article?.url || ""), [article]);
  const subjects = useMemo(() => getSubjects(highlights), [highlights]);
  const subjectCounts = useMemo(() => getSubjectCounts(highlights), [highlights]);

  const filteredHighlights = useMemo(
    () => getFilteredHighlights(highlights, activeSubject, sortMode),
    [highlights, activeSubject, sortMode]
  );

  const emotionalPresence = getPresenceLabel(emotionStats.count);
  const claimPresence = getPresenceLabel(claimStats.count);

  const totalHighlightCount = highlights.length;
  const shownHighlightCount = filteredHighlights.length;

  const handleCopy = () => {
    const text = `Summary (${domain || "current article"}):\n\n${summaryText}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleJumpToHighlight = async (h) => {
    console.log("Jump requested:", h);

    try {
      const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      const tabId = tabs[0]?.id;

      if (!tabId) {
        return;
      }

      await chrome.tabs.sendMessage(tabId, {
        type: MATADOR_FOCUS_TEXT_REQUEST,
        text: h.quote,
        fallbackText: h.subject,
      });
    } catch (error) {
      console.error("Jump failed", error);
    }
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
          articleTitle={article?.title || ""}
          authors={article?.authors || (article?.byline ? [article.byline] : [])}
          publishDate={article?.publishedAt || article?.publish_date || ""}
        />

        <RelatedCoverageSection
          keywords={nerContext.keywords}
          stories={nerContext.stories}
          currentUrl={article?.url || ""}
        />

        <BiasScaleCard
          score={biasSummary.score}
          direction={biasSummary.direction}
          unavailable={serviceStatus.isdFailed}
        />

        <AnalysisGrid
          emotionalPresence={emotionalPresence}
          emotionalPillClass={getPresencePillClass(emotionalPresence)}
          emotionalCount={emotionStats.count}
          emotionalSignals={emotionStats.signals}
          emotionalAnalyzedCount={emotionStats.analyzedCount}
          emotionalTotalMass={emotionStats.totalMass}
          emotionalProfile={emotionStats.profile}
          claimPresence={claimPresence}
          claimPillClass={getPresencePillClass(claimPresence)}
          claimCount={claimStats.count}
          claimSignals={claimStats.signals}
          claimAverageScore={claimStats.averageScore}
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
