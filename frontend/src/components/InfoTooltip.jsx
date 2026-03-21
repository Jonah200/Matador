import { useState } from "react";

function InfoTooltip({ text }) {
    const [open, setOpen] = useState(false);

    return (
        <span className="relative inline-flex items-center">
            <button
                type="button"
                className="ml-2 flex items-center justify-center w-4 h-4 rounded-full border border-slate-300 text-[10px] text-slate-500 hover:bg-slate-50 transition-colors"
                onClick={() => setOpen((v) => !v)}
            >
                i
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute bottom-full mb-2 right-[-25px] w-[180px] rounded-xl border border-slate-200 bg-white shadow-xl p-3 z-50 animate-in fade-in zoom-in-95">
                        <div className="absolute top-full right-[28px] -mt-px border-8 border-transparent border-t-white" />

                        <div className="text-[11px] text-slate-700 leading-normal font-medium">
                            {text}
                        </div>

                        <button
                            onClick={() => setOpen(false)}
                            className="mt-2 text-[10px] font-bold text-blue-600 uppercase block"
                        >
                            Close
                        </button>
                    </div>
                </>
            )}
        </span>
    );
}

export default InfoTooltip;