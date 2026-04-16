import { useEffect, useRef, useState } from "react";

function InfoTooltip({ text }) {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef(null);
    const [position, setPosition] = useState(null);

    useEffect(() => {
        if (!open || !buttonRef.current) {
            return;
        }

        const rect = buttonRef.current.getBoundingClientRect();
        const tooltipWidth = Math.min(260, window.innerWidth - 16);
        const left = Math.max(8, Math.min(rect.right - tooltipWidth, window.innerWidth - tooltipWidth - 8));
        const top = Math.max(8, rect.top - 12);

        setPosition({
            left,
            top,
            arrowLeft: Math.max(14, Math.min(tooltipWidth - 22, rect.right - left - 10)),
        });
    }, [open]);

    return (
        <span className="relative inline-flex items-center">
            <button
                ref={buttonRef}
                type="button"
                className="ml-2 flex items-center justify-center w-4 h-4 rounded-full border border-slate-300 text-[10px] font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                onClick={() => setOpen((v) => !v)}
                aria-label="More information"
            >
                ?
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div
                        className="fixed z-50 w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-xl animate-in fade-in zoom-in-95 sm:w-60"
                        style={{
                            left: position?.left ?? 8,
                            top: position?.top ?? 8,
                            transform: "translateY(-100%)",
                        }}
                    >
                        <div
                            className="absolute top-full -mt-px border-8 border-transparent border-t-white"
                            style={{ left: position?.arrowLeft ?? 20 }}
                        />

                        <div className="text-[12px] text-slate-700 leading-5">
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
