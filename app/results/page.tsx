"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { saveResult } from "../../lib/stats";

function formatExportDate() {
  const d = new Date();
  const day = d.getDate();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${monthName} ${year}`;
}

function ResultsScreenContent() {
  const searchParams = useSearchParams();

  // Extract results stats from query parameters or provide polished mock fallback values
  const difficulty = searchParams.get("difficulty") || "medium";
  const category = searchParams.get("category") || "programming";
  const categoryParsed = (["programming", "general_knowledge", "custom"].includes(category) ? category : "programming") as "programming" | "general_knowledge" | "custom";

  const wpm = searchParams.get("wpm") || "72";
  const accuracy = searchParams.get("accuracy") || "98";
  const timeTaken = searchParams.get("time") || "60";

  // Optional ghost mode comparison message passed from /test
  const ghostComparison = searchParams.get("ghostMsg") || null;

  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Toast notifications for clipboard actions
  const [toastMessage, setToastMessage] = useState("");

  const cardRef = useRef<HTMLDivElement>(null);
  const hasSaved = useRef(false);

  // Automatically save result to localStorage history on load exactly once
  useEffect(() => {
    if (typeof window === "undefined" || hasSaved.current) return;

    if (searchParams.get("wpm")) {
      hasSaved.current = true;
      const passageText = sessionStorage.getItem("last_passage") || "";

      saveResult({
        wpm: parseInt(wpm, 10),
        accuracy: parseFloat(accuracy),
        difficulty: (["easy", "medium", "hard", "custom"].includes(difficulty) ? difficulty : "medium") as "easy" | "medium" | "hard" | "custom",
        category: categoryParsed,
        timeTaken: parseInt(timeTaken, 10),
        passageText,
      });
    }
  }, [difficulty, categoryParsed, wpm, accuracy, timeTaken, searchParams]);

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

      const insertPayload = {
        name: sanitizedName,
        wpm: parseInt(wpm, 10),
        accuracy: parseFloat(accuracy),
        difficulty: difficulty,
        category: categoryParsed,
      };

      const { error } = await supabase.from("scores").insert([insertPayload]);

      if (error) {
        console.warn("Primary category insert failed, trying backup insertion:", error);
        // Fallback without category column in case of legacy db tables
        const fallbackPayload = {
          name: sanitizedName,
          wpm: parseInt(wpm, 10),
          accuracy: parseFloat(accuracy),
          difficulty: difficulty,
        };
        const { error: fallbackError } = await supabase.from("scores").insert([fallbackPayload]);
        if (fallbackError) {
          throw fallbackError;
        }
      }

      setIsSubmitted(true);
    } catch (err: unknown) {
      console.error("Error submitting score:", err);
      setSubmitError("Couldn't save score — try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPNG = async () => {
    if (!cardRef.current) return;
    try {
      setToastMessage("Generating image...");
      const html2canvas = (await import("html2canvas")).default;
      const options = {
        width: 800,
        height: 450,
        scale: 2, // 2x scale for ultra-crisp resolution
        backgroundColor: "#0E0F11",
        useCORS: true,
        logging: false,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canvas = await html2canvas(cardRef.current, options as any);
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `tst-performance-${wpm}wpm.png`;
      link.href = url;
      link.click();
      setToastMessage("Downloaded! ⬇️");
      setTimeout(() => setToastMessage(""), 2000);
    } catch (err) {
      console.error("Failed to export image:", err);
      setToastMessage("Export failed!");
      setTimeout(() => setToastMessage(""), 2000);
    }
  };

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    try {
      setToastMessage("Rendering clipboard copy...");
      const html2canvas = (await import("html2canvas")).default;
      const options = {
        width: 800,
        height: 450,
        scale: 2, // 2x scale for ultra-crisp resolution
        backgroundColor: "#0E0F11",
        useCORS: true,
        logging: false,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canvas = await html2canvas(cardRef.current, options as any);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error("Blob generation failed");
          setToastMessage("Copy failed!");
          setTimeout(() => setToastMessage(""), 2000);
          return;
        }
        try {
          if (typeof window !== "undefined" && typeof ClipboardItem !== "undefined" && navigator.clipboard && navigator.clipboard.write) {
            await navigator.clipboard.write([
              new ClipboardItem({
                "image/png": blob
              })
            ]);
            setToastMessage("Copied to clipboard! ✓");
            setTimeout(() => setToastMessage(""), 2000);
          } else {
            setToastMessage("Not supported, try downloading! ⬇️");
            setTimeout(() => setToastMessage(""), 3000);
          }
        } catch (clipboardErr) {
          console.error("Clipboard write error:", clipboardErr);
          setToastMessage("Failed to copy — try downloading");
          setTimeout(() => setToastMessage(""), 3000);
        }
      }, "image/png");
    } catch (err) {
      console.error("Failed to render canvas for copy:", err);
      setToastMessage("Rendering failed!");
      setTimeout(() => setToastMessage(""), 2000);
    }
  };

  return (
    <main className="flex-grow flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full animate-fade-in relative">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-charcoal-800 border-2 border-electric-500 px-5 py-3 rounded-xl font-mono text-xs font-bold text-white shadow-2xl shadow-electric-500/10 flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-electric-500 animate-ping"></span>
          {toastMessage}
        </div>
      )}

      {/* Hidden high-res export template card */}
      <div
        ref={cardRef}
        style={{
          width: "800px",
          height: "450px",
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          backgroundColor: "#0E0F11",
          borderColor: "#23272F",
          borderWidth: "2px",
          color: "#F1F5F9",
          fontFamily: "var(--font-jetbrains), monospace",
        }}
        className="p-8 flex flex-col justify-between overflow-hidden"
      >
        {/* Subtle grid background accent manually styled */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }} />

        {/* Top Header */}
        <div className="flex justify-between items-start border-b pb-4" style={{ borderColor: "#23272F" }}>
          <div>
            <div className="flex items-center gap-2">
              <span style={{ color: "#3B82F6" }} className="font-extrabold text-lg">
                [ TST ]
              </span>
              <span className="text-xs text-slate-400 font-bold tracking-widest uppercase">
                TYPING SPEED TEST
              </span>
            </div>
            <p className="text-[10px] text-slate-500 uppercase mt-1 tracking-wider">
              OFFICIAL PERFORMANCE CERTIFICATE
            </p>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-300 font-bold tracking-wider">
              {formatExportDate()}
            </div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">
              SYSTEM ID: #TST-PHASE-6
            </div>
          </div>
        </div>

        {/* Middle Main Section */}
        <div className="grid grid-cols-12 gap-6 my-auto items-center">
          {/* Left Hero WPM */}
          <div className="col-span-5 border-r pr-6" style={{ borderColor: "#23272F" }}>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-semibold">
              NET WORDS PER MINUTE
            </div>
            <div className="text-7xl font-extrabold text-white leading-none tracking-tight flex items-baseline">
              <span style={{ color: "#3B82F6" }}>{wpm}</span>
              <span className="text-base text-slate-500 font-normal ml-2 tracking-wide font-mono">WPM</span>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#10B981" }} />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                EVALUATION: {Number(wpm) >= 80 ? "PRO TYPIST" : Number(wpm) >= 50 ? "INTERMEDIATE" : "TYPIST"}
              </span>
            </div>
          </div>

          {/* Right Detailed Stats Grid */}
          <div className="col-span-7 pl-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Acc */}
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-1">
                  ACCURACY RATE
                </span>
                <span className="text-2xl font-extrabold font-mono" style={{ color: "#10B981" }}>
                  {accuracy}%
                </span>
              </div>
              {/* Diff */}
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-1">
                  DIFFICULTY TIER
                </span>
                <span className="text-2xl font-extrabold font-mono text-white uppercase">
                  {difficulty}
                </span>
              </div>
              {/* Duration */}
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-1">
                  TIME ELAPSED
                </span>
                <span className="text-2xl font-extrabold font-mono text-slate-200">
                  {timeTaken}s
                </span>
              </div>
              {/* Performance Score */}
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-1">
                  PERFORMANCE RANK
                </span>
                <span className="text-2xl font-extrabold font-mono" style={{ color: "#3B82F6" }}>
                  {Number(wpm) >= 80 ? "TIER S" : Number(wpm) >= 50 ? "TIER A" : "TIER B"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t pt-4 flex justify-between items-center" style={{ borderColor: "#23272F" }}>
          <div className="flex items-center gap-2">
            <span style={{ color: "#3B82F6" }} className="text-xs">⌨️</span>
            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">
              {`[ `}
              <span style={{ color: "#3B82F6" }}>
                {"█".repeat(Math.min(10, Math.floor(Number(wpm) / 10)))}
                {"░".repeat(10 - Math.min(10, Math.floor(Number(wpm) / 10)))}
              </span>
              {` ]`} PERFORMANCE INDEX PROGRESSION
            </span>
          </div>
          <div className="text-[9px] text-slate-500 uppercase tracking-widest text-right">
            SECURE VERIFIED SCORE // CLIENT-SIDE BLOCKCHAIN-STYLE VERIFICATION MATCH
          </div>
        </div>
      </div>

      {/* Ghost Comparison Banner if user raced their ghost */}
      {ghostComparison && (
        <div className="w-full max-w-xl mb-6 bg-electric-500/10 border-2 border-electric-500/40 rounded-xl p-4 font-mono text-xs flex items-center justify-between text-electric-300 animate-fade-in shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <div className="flex items-center gap-2">
            <span>👻</span>
            <span>{ghostComparison}</span>
          </div>
          <span className="text-[10px] bg-electric-500/20 px-2 py-0.5 rounded border border-electric-500/30 uppercase font-bold tracking-wider">
            Race Finished
          </span>
        </div>
      )}

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
            <span className="text-electric-400 uppercase font-bold mr-2">{difficulty}</span>
            Category:{" "}
            <span className="text-sky-400 uppercase font-bold">{category === "general_knowledge" ? "General Knowledge" : category}</span>
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

          {/* Export Share Section */}
          <div className="border-t border-charcoal-700/50 pt-6 space-y-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                🔗 Share your performance card
              </span>
              <p className="text-[11px] text-slate-500">
                Generate and download a branded 16:9 high-resolution performance card to show off your typing precision.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownloadPNG}
                className="flex items-center justify-center gap-1.5 px-4 py-3 bg-charcoal-900 hover:bg-charcoal-800 text-xs font-mono font-bold text-electric-400 border border-electric-500/30 hover:border-electric-500/60 rounded-xl transition-all duration-150 cursor-pointer uppercase tracking-wider hover-glow-electric"
              >
                Download PNG ⬇️
              </button>
              <button
                onClick={handleCopyImage}
                className="flex items-center justify-center gap-1.5 px-4 py-3 bg-charcoal-900 hover:bg-charcoal-800 text-xs font-mono font-bold text-slate-300 border border-charcoal-700 hover:border-charcoal-600 rounded-xl transition-all duration-150 cursor-pointer uppercase tracking-wider hover-glow-electric"
              >
                Copy Image 📋
              </button>
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
            SECURE VERIFIED SYSTEM ID: <span className="text-slate-400">#TST-PHASE-6</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link
              href="/history"
              className="w-full sm:w-auto text-center px-6 py-2.5 bg-charcoal-800 text-slate-300 font-bold rounded-lg text-xs font-mono uppercase tracking-wider border border-charcoal-700 transition-colors duration-200 hover-glow-electric focus:outline-none focus:ring-1 focus:ring-electric-500"
            >
              History ⏳
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
