import { useEffect, useState } from 'react'
import './App.css'



const SectionLabel = ({ text }) => (
  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
    {text}
  </h2>
);

const MetricCard = ({ label, percentage, colorClass }) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
    <SectionLabel text={label} />
    <div className={`text-2xl font-black ${colorClass}`}>{percentage}%</div>
    <div className="h-1.5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-1000 ${colorClass.replace('text', 'bg')}`} 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  </div>
);

function App() {
  const [url, setUrl] = useState('')

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        setUrl(tabs[0].url)
      }
    });
  }, [])

  return (
    <div className= "min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="pg-4 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-black text-blue-600 tracking-tight">Matador</h1>
        <button className="big-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-full shadow-lg shadow-lg shadow-blue-200">
          Analyze
        </button>
      </header>

      <main className = "p-3 space-y-4">

        {/* Section 1: Article Summary*/}
        <section className= "bg-white rounded-2xl p-4 shadow-sm border-l-4 border-l-blue-500">
          <SectionLabel text="Summary"/>
          <p className="text-sm text-slate-700 leading-relaxed">
            This article explores the legislative shift in climate policy. 
            The narrative relies on emotional appeals to highlight government inaction.
          </p>
        </section>

        {/* Sections 2: Subjects */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <SectionLabel text="Subjects Identified" />
          <div className="flex flex-wrap gap-2">
            {['EPA', 'Clean Air Act', 'Washington D.C.'].map(tag => (
              <span key={tag} className="bg-blue-50 text-blue-700 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-blue-100">
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* Section 3: Article Analysis */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Emotional Bias" percentage={75} colorClass="text-red-500" />
          <MetricCard label="Subjectivity" percentage={40} colorClass="text-emerald-500" />
        </div>

        {/* Section 4: HIGHLIGHTED BIAS */}
        <section className="bg-slate-900 rounded-2xl p-4 text-white shadow-xl">
          <SectionLabel text="Bias Highlight" />
          <div className="border-l-2 border-red-500 pl-4">
            <p className="text-xs italic text-slate-300 font-serif">
              "...the government's catastrophic failure..."
            </p>
          </div>
        </section>
      </main>
    </div>
    
  )
}

export default App
