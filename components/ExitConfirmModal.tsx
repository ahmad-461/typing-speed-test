"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ExitConfirmModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener("tst-open-exit-modal", handleOpen);
    return () => {
      window.removeEventListener("tst-open-exit-modal", handleOpen);
    };
  }, []);

  const handleConfirm = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("tst_player_name");
      window.dispatchEvent(new CustomEvent("tst-name-updated", { detail: "" }));
      window.dispatchEvent(new CustomEvent("tst-gamification-updated"));
    }
    setIsOpen(false);
    router.push("/");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#090A0C]/85 backdrop-blur-md animate-fade-in">
      <div className="bg-charcoal-800 border-2 border-[#EF4444]/30 rounded-2xl p-6 sm:p-8 max-w-sm w-full relative overflow-hidden shadow-2xl">
        {/* Subtle decorative exit color bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-600" />

        <div className="flex items-center justify-between border-b border-charcoal-700 pb-3 mb-4 font-mono text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-red-500 font-bold">&gt;_</span>
            <span>TERMINAL_SESSION_SIGNOUT.sh</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-500 hover:text-white transition-colors cursor-pointer"
          >
            [X]
          </button>
        </div>

        <div className="space-y-4">
          <div className="font-mono text-xs text-slate-300 leading-relaxed">
            <span className="text-rose-400 font-bold block mb-2">&gt; WARNING: ENDING ACTIVE SESSION</span>
            <p className="font-sans text-xs text-slate-400">
              End session? Your progression remains safely stored in local memory, but you will need to re-enter your callsign to log back into the hub.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-150 border border-charcoal-700 bg-charcoal-900/40 text-slate-400 hover:text-white hover:border-charcoal-600 cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-150 border border-red-500/30 bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow-lg shadow-red-500/10 text-center"
            >
              Confirm Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
