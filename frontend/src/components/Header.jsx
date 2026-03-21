function Header({ isAnalyzing, onAnalyze }) {
    return (
        <header className="p-4 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
            <h1 className="text-xl font-black text-blue-600 tracking-tight">Matador</h1>

            <button
                type="button"
                onClick={onAnalyze}
                disabled={isAnalyzing}
                className={[
                    "text-[11px] font-black py-2 px-5 rounded-full shadow-md transition-colors block",
                    isAnalyzing
                        ? "bg-blue-300 text-white cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white",
                    "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2",
                ].join(" ")}
                aria-label="Analyze the current article"
            >
                {isAnalyzing ? "Analyzing…" : "Analyze"}
            </button>
        </header>
    );
}

export default Header;