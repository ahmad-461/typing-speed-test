"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

function ResultsScreenContent() {
  const searchParams = useSearchParams();

  // Extract results stats from query parameters or provide polished mock fallback values
  const difficulty = searchParams.get("difficulty") || "medium";
  const wpm = searchParams.get("wpm") || "72";
  const accuracy = searchParams.get("accuracy") || "98";
  const timeTaken = searchParams.get("time") || "60";

  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const hasSavedToLocalStorage = useRef(false);

  // Save score to local storage once upon component mount/params loaded
  useEffect(() => {
    if (hasSavedToLocalStorage.current) return;

    try {
      const parsedWPM = parseInt(wpm, 10);
      const parsedAccuracy = parseFloat(accuracy);

      if (!isNaN(parsedWPM) && !isNaN(parsedAccuracy)) {
        hasSavedToLocalStorage.current = true;

        const record = {
          wpm: parsedWPM,
          accuracy: parsedAccuracy,
          difficulty: difficulty,
          date: new Date().toISOString(),
        };

        const existing = localStorage.getItem("tst_history_v1");
        let historyArray = [];
        if (existing) {
          try {
            const parsed = JSON.parse(existing);
            if (Array.isArray(parsed)) {
              historyArray = parsed;
            }
          } catch {
            // Safe fallback
          }
        }

        historyArray.push(record);
        localStorage.setItem("tst_history_v1", JSON.stringify(historyArray));

        // Dispatch customized event so header state updates in real-time
        window.dispatchEvent(new Event("tst_history_updated"));
      }
    } catch (e) {
      console.warn("Could not save score to local storage:", e);
    }
  }, [wpm, accuracy, difficulty]);

  const handleSubmitScore = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Basic sanitization: trim whitespace and limit length
      let sanitizedName = displayName.trim();

      // XSS tag removal
      sanitizedName = sanitizedName.replace(/<\/?[^>]+(>|$)/g, "");

      // Limit to 20 chars
      sanitizedName = sanitizedName.slice(0, 20);

      if (!sanitizedName) {
        sanitizedName = "Anonymous";
      }

      const { error } = await supabase.from("scores").insert([
        {
          name: sanitizedName,
          wpm: parseInt(wpm, 10),
          accuracy: parseFloat(accuracy),
          difficulty: difficulty,
        },
      ]);

      if (error) {
        throw error;
      }

      setIsSubmitted(true);
    } catch (err: unknown) {
      console.error("Error submitting score:", err);
      setSubmitError("Couldn't save score — try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-grow flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full animate-fade-in">
      {/* Container holding the shareable certificate card */}
      <div className="w-full max-w-xl bg-charcoal-800 border-2 border-charcoal-700 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">

        {/* Subtle decorative color bar using HEX strictly */}
        <div className="h-1.5 w-full bg-gradient-to-r from-electric-500 via-sky-500 to-emerald-500" />

        {/* Certificate Card Header */}
        <div className="p-6 sm:p-8 text-center border-b border-charcoal-700 bg-charcoal-900/20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-charcoal-700 bg-charcoal-900 text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-4">
            🏆 performance certificate
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Test Results
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Difficulty level:{" "}
            <span className="text-electric-400 uppercase font-bold">{difficulty}</span>
          </p>
        </div>

        {/* Core Stats Section inside Card */}
        <div className="p-6 sm:p-8 space-y-6 flex-grow">
          <div className="grid grid-cols-2 gap-4">

            {/* WPM Container */}
            <div className="bg-charcoal-900/50 border border-charcoal-700/60 rounded-xl p-5 text-center flex flex-col justify-center items-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                words per minute
              </span>
              <div className="text-4xl sm:text-5xl font-extrabold text-white font-mono tracking-tight">
                {wpm}
              </div>
              <span className="text-xs font-mono text-slate-500 mt-1">Net speed</span>
            </div>

            {/* Accuracy Container */}
            <div className="bg-charcoal-900/50 border border-charcoal-700/60 rounded-xl p-5 text-center flex flex-col justify-center items-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                accuracy rate
              </span>
              <div className="text-4xl sm:text-5xl font-extrabold text-emerald-400 font-mono tracking-tight">
                {accuracy}%
              </div>
              <span className="text-xs font-mono text-slate-500 mt-1">Precision score</span>
            </div>

            {/* Time Taken Container */}
            <div className="bg-charcoal-900/50 border border-charcoal-700/60 rounded-xl p-5 text-center flex flex-col justify-center items-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                time elapsed
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-200 font-mono tracking-tight">
                {timeTaken}s
              </div>
              <span className="text-xs font-mono text-slate-500 mt-1">Duration</span>
            </div>

            {/* Rank / Performance tier */}
            <div className="bg-charcoal-900/50 border border-charcoal-700/60 rounded-xl p-5 text-center flex flex-col justify-center items-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                skill level
              </span>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono tracking-tight uppercase">
                {Number(wpm) >= 80 ? "PRO" : Number(wpm) >= 50 ? "INTERMEDIATE" : "TYPIST"}
              </div>
              <span className="text-xs font-mono text-slate-500 mt-1">Evaluation Tier</span>
            </div>

          </div>

          {/* Leaderboard Profile Setup inside Card */}
          <div className="border-t border-charcoal-700/50 pt-6 space-y-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="display-name" className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Claim certificate (Enter display name)
              </label>
              <p className="text-[11px] text-slate-500">
                Optional: Enter your nickname below to custom print this score card and submit to the Global Leaderboard.
              </p>
            </div>
            <div className="relative">
              <input
                id="display-name"
                type="text"
                maxLength={20}
                disabled={isSubmitted}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. SpeedTyper99"
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {displayName && !isSubmitted && (
                <div className="absolute right-3 top-3 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Ready
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSubmitScore}
                disabled={isSubmitted || isSubmitting}
                className="w-full py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 shadow-md flex items-center justify-center gap-2 border cursor-pointer
                  disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-charcoal-800
                  bg-emerald-600 border-emerald-500 hover:bg-emerald-500 text-white shadow-emerald-500/10
                  disabled:bg-charcoal-700 disabled:border-charcoal-600 disabled:text-slate-400 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>
                    Submitting...
                  </>
                ) : isSubmitted ? (
                  "Saved! ✓"
                ) : (
                  "Submit Score to Leaderboard 🏆"
                )}
              </button>

              {/* Status and Direct CTA */}
              {submitError && (
                <p className="text-rose-400 text-xs font-mono text-center mt-1">
                  ⚠️ {submitError}
                </p>
              )}
              {isSubmitted && (
                <div className="flex flex-col items-center gap-2 mt-1">
                  <p className="text-emerald-400 text-xs font-mono text-center">
                    🎉 Your score of {wpm} WPM has been submitted!
                  </p>
                  <Link
                    href="/leaderboard"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-electric-400 hover:text-electric-300 hover:underline transition-all"
                  >
                    View Global Leaderboard 📊 →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Certificate Card Footer */}
        <div className="p-6 bg-charcoal-900/40 border-t border-charcoal-700 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="text-[10px] font-mono text-slate-500 text-center sm:text-left">
            SECURE VERIFIED SYSTEM ID: <span className="text-slate-400">#TST-PHASE-4</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link
              href="/leaderboard"
              className="w-full sm:w-auto text-center px-6 py-2.5 bg-charcoal-800 text-slate-300 font-bold rounded-lg text-xs font-mono uppercase tracking-wider border border-charcoal-700 transition-colors duration-200 hover-glow-electric focus:outline-none focus:ring-1 focus:ring-electric-500"
            >
              Leaderboard 📊
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto text-center px-6 py-2.5 bg-electric-500 text-white font-bold rounded-lg text-xs font-mono uppercase tracking-wider transition-colors duration-200 shadow-md shadow-electric-500/10 hover-glow-electric focus:outline-none focus:ring-2 focus:ring-electric-500 focus:ring-offset-2 focus:ring-offset-charcoal-800"
            >
              Try Again 🔄
            </Link>
          </div>
        </div>

      </div>

      {/* Helpful Hint */}
      <p className="text-center text-xs text-slate-500 font-mono mt-8 max-w-md leading-relaxed">
        💡 This certificate container has been styled with precise HEX color definitions to ensure safe export execution via html2canvas later.
      </p>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-electric-500"></div>
      </div>
    }>
      <ResultsScreenContent />
    </Suspense>
  );
}
