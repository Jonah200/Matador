import { useEffect, useState } from 'react'
import './App.css'

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
    <div className='side-panel-container'>
      <header className = "header">
        <div className = "brand">
          <h1>Metador</h1>
          <span className="version">v1.0</span>
        </div>
        <button className="analyze-button">Analyze Page</button>
      </header>

      <main className = "content-scroll">

        {/* Section 1: Article Summary*/}
        <section className= "summary-section">
          <div className = "section-header">
            <label className="section-label">Article SUMMARY</label>
          </div>

          {/*Placeholder*/}
          <h2 className="article-title">Global Climate Summit Accord</h2>
          <div className="summary-content">
            <p>World leaders reached a climate agreement today. While the accord sets new targets for carbon reduction, <strong>critics argue it lacks enforcement mechanisms</strong>. The summary highlights a divide between developed and developing nations regarding financial aid.</p>
          </div>
        </section>

        {/* Section 2: Article Analysis */}
        <div className="analysis-separator">BIAS & METRICS</div>

        <section className = "analysis-grid">
          <div className= "analysis-card"> 
            <label>Emotional Bias</label>
            <div className="meter-bg">
              <div className="meter-fill" style={{width: '75%'}}></div>
            </div>
          </div>

          <div className="analysis-card">
            <label>Subjectivity</label>
            <div className="meter-bg">
              <div className="meter-fill" style={{ width: '40%', backgroundColor: '#10b981' }}></div>
            </div>
          </div>
        </section>
      </main>
    </div>
    
  )
}

export default App
