"use client";

import { useState, useEffect } from "react";

export default function EditNameModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const handleOpen = () => {
      const current = typeof window !== "undefined" ? localStorage.getItem("tst_player_name") || "" : "";
      setNameInput(current);
      setError("");
      setIsOpen(true);
    };

    window.addEventListener("tst-open-name-modal", handleOpen);
    return () => {
      window.removeEventListener("tst-open-name-modal", handleOpen);
    };
  }, []);

  const handleSave = () => {
    let sanitized = nameInput.trim();
    sanitized = sanitized.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 20);

    if (!sanitized) {
      setError("Callsign cannot be empty");
      return;
    }

    localStorage.setItem("tst_player_name", sanitized);
    window.dispatchEvent(new CustomEvent("tst-name-updated", { detail: sanitized }));
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#090A0C]/85 backdrop-blur-md animate-fade-in">
      <div className="bg-charcoal-800 border-2 border-charcoal-700 rounded-2xl p-6 sm:p-8 max-w-sm w-full relative overflow-hidden shadow-2xl">
        {/* Subtle decorative color bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-electric-400 to-electric-600" />

        <div className="flex items-center justify-between border-b border-charcoal-700 pb-3 mb-4 font-mono text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-electric-400 font-bold">&gt;_</span>
            <span>IDENTITY_OVERRIDE.sh</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-500 hover:text-white transition-colors cursor-pointer"
          >
            [X]
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">
              &gt; enter new callsign
            </label>
            <input
              type="text"
              maxLength={20}
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                setError("");
              }}
              placeholder="e.g. SpeedTyper99"
              className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500/20 transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              autoFocus
            />
            {error && (
              <p className="text-rose-400 text-[10px] font-mono mt-1.5">
                ⚠️ {error}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-150 border border-charcoal-700 bg-charcoal-900/40 text-slate-400 hover:text-white hover:border-charcoal-600 cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-150 border border-electric-500/30 bg-electric-500 text-white hover:bg-electric-400 cursor-pointer shadow-lg shadow-electric-500/10 text-center"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
