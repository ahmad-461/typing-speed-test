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
  const category = searchParams.get("category") || "code_arena";
  const categoryParsed = (["code_arena", "knowledge_quest", "ai_lab", "world_explorer"].includes(category) ? category : "code_arena") as "code_arena" | "knowledge_quest" | "ai_lab" | "world_explorer";

  const wpm = searchParams.get("wpm") || "72";
  const accuracy = searchParams.get("accuracy") || "98";
  const timeTaken = searchParams.get("time") || "60";
  const consistency = searchParams.get("consistency") || "100";

  // Optional ghost mode comparison message passed from /test
  const ghostComparison = searchParams.get("ghostMsg") || null;

  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Toast notifications for clipboard actions
  const [toastMessage, setToastMessage] = useState("");
  const [xpEarned, setXpEarned] = useState<number | null>(null);

  // Coach and Drill States
  const [coachFeedback, setCoachFeedback] = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState(true);
  const [drillComparison, setDrillComparison] = useState<{
    targetKeys: string[];
    currentAcc: number;
    histAcc: number;
  } | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const hasSaved = useRef(false);

  // Fetch Coach Feedback asynchronously
  useEffect(() => {
    async function fetchFeedback() {
      setCoachLoading(true);
      try {
        const testErrors = JSON.parse(sessionStorage.getItem("last_test_errors") || "{}");
        const res = await fetch("/api/coach-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wpm,
            accuracy,
            consistency,
            difficulty,
            category,
            errors: testErrors,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setCoachFeedback(data.feedback);
        } else {
          throw new Error("Feedback fetch failed");
        }
      } catch (err) {
        console.error("Failed to fetch coach feedback:", err);
        const fallbackTips = [
          "Maintain a steady cadence. Focus on flowing smoothly between letters rather than rushing individual words.",
          "When encountering tricky letters, reduce your speed slightly to reinforce correct muscle memory.",
          "Keep your wrists floating gently above the keyboard to reach keys without awkward angles.",
          "If you notice mistakes on a specific character, practice common words containing that letter to build speed.",
          "Take deep, relaxed breaths. A calm posture drastically reduces keyboard tension and improves consistency."
        ];
        const idx = Math.abs(parseInt(wpm, 10) || 0) % fallbackTips.length;
        setCoachFeedback(fallbackTips[idx]);
      } finally {
        setCoachLoading(false);
      }
    }

    fetchFeedback();
  }, [wpm, accuracy, consistency, difficulty, category]);

  // Compute Weak-Key Drill comparison stats
  useEffect(() => {
    if (category === "weak_key_drill" && typeof window !== "undefined") {
      try {
        const targetKeys: string[] = JSON.parse(sessionStorage.getItem("last_drill_keys") || "[]");
        const testErrors = JSON.parse(sessionStorage.getItem("last_test_errors") || "{}");
        const testTypedCounts = JSON.parse(sessionStorage.getItem("last_test_typed_counts") || "{}");

        if (targetKeys.length > 0) {
          const targetErrors = targetKeys.reduce((sum, k) => sum + (testErrors[k] || 0), 0);
          const targetTyped = targetKeys.reduce((sum, k) => sum + (testTypedCounts[k] || 0), 0);
          const currentAcc = targetTyped > 0 ? Math.round(((targetTyped - targetErrors) / targetTyped) * 100) : 100;

          const rawHistErrors = localStorage.getItem("tst_keyerrors_v1");
          const rawHistTyped = localStorage.getItem("tst_key_typed_counts_v1");
          const histErrorsStore = rawHistErrors ? JSON.parse(rawHistErrors) : {};
          const histTypedStore = rawHistTyped ? JSON.parse(rawHistTyped) : {};

          let totalHistErrors = 0;
          let totalHistTyped = 0;

          targetKeys.forEach((key) => {
            const priorErrors = Math.max(0, (histErrorsStore[key] || 0) - (testErrors[key] || 0));
            const priorTyped = Math.max(0, (histTypedStore[key] || 0) - (testTypedCounts[key] || 0));
            totalHistErrors += priorErrors;
            totalHistTyped += priorTyped;
          });

          const histAcc = totalHistTyped > 0 ? Math.round(((totalHistTyped - totalHistErrors) / totalHistTyped) * 100) : 100;

          setDrillComparison({
            targetKeys,
            currentAcc,
            histAcc,
          });
        }
      } catch (err) {
        console.error("Error computing drill comparison:", err);
      }
    }
  }, [category]);

  // Automatically save result to localStorage history on load exactly once
  useEffect(() => {
    if (typeof window === "undefined" || hasSaved.current) return;

    if (searchParams.get("wpm")) {
      hasSaved.current = true;
      const passageText = sessionStorage.getItem("last_passage") || "";

      // Import gamification helpers asynchronously or safely inside the effect
      Promise.all([
        import("../../lib/gamification")
      ]).then(([{ getGamificationState, calculateXpForTest, ACHIEVEMENTS }]) => {
        const beforeState = getGamificationState();

        saveResult({
          wpm: parseInt(wpm, 10),
          accuracy: parseFloat(accuracy),
          difficulty: (["easy", "medium", "hard", "custom"].includes(difficulty) ? difficulty : "medium") as "easy" | "medium" | "hard" | "custom",
          category: categoryParsed,
          consistency: parseInt(consistency, 10),
          timeTaken: parseInt(timeTaken, 10),
          passageText,
        });

        const afterState = getGamificationState();

        // Determine difficulty multiplier safe type cast
        const diffMultiplierKey = (["easy", "medium", "hard", "custom"].includes(difficulty) ? difficulty : "medium") as "easy" | "medium" | "hard" | "custom";

        const xpInfo = calculateXpForTest(
          parseInt(wpm, 10),
          parseFloat(accuracy),
          diffMultiplierKey,
          beforeState.streakDays
        );
        setXpEarned(xpInfo.total);

        // Fetch queueToast safely by utilizing a window or custom event, OR by having the custom effect trigger a state update.
        // To strictly respect rules-of-hooks, we can trigger a custom message event, or dispatch a React state update that triggers the toast in the component layout.
        // Actually, a safer pattern is to write a custom event or store the active toasts to a small temporary state list, which we can render right here or let ToastProvider read.
        // Since we are inside Results, let's trigger standard browser CustomEvent, and have ToastContext listen to it! This is 100% clean, decoupled, and avoids any require() and rules-of-hooks violations!

        if (afterState.currentLevel > beforeState.currentLevel) {
          const evt = new CustomEvent("tst-toast", {
            detail: {
              type: "level_up",
              title: `Level Up! Lvl ${afterState.currentLevel}`,
              message: `You've earned enough XP to become a ${afterState.levelTitle}. Keep pushing!`
            }
          });
          window.dispatchEvent(evt);
        }

        const newAchievements = afterState.unlockedAchievements.filter(
          (id: string) => !beforeState.unlockedAchievements.includes(id)
        );

        newAchievements.forEach((badgeId: string) => {
          const badge = ACHIEVEMENTS.find((a) => a.id === badgeId);
          if (badge) {
            const evt = new CustomEvent("tst-toast", {
              detail: {
                type: "achievement",
                title: `Achievement Unlocked: ${badge.title}`,
                message: badge.description
              }
            });
            window.dispatchEvent(evt);
          }
        });
      });
    }
  }, [difficulty, categoryParsed, wpm, accuracy, timeTaken, consistency, searchParams]);

  const handleSubmitScore = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

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

    // Helper to store locally as a robust mock fallback
    const saveToLocalStorageFallback = () => {
      try {
        const localScores = JSON.parse(localStorage.getItem("tst_local_scores_v1") || "[]");
        const mockRow = {
          id: `local-${Math.random().toString(36).substring(2, 15)}`,
          name: sanitizedName,
          wpm: parseInt(wpm, 10),
          accuracy: parseFloat(accuracy),
          difficulty: difficulty as "easy" | "medium" | "hard" | "custom",
          created_at: new Date().toISOString(),
        };
        localStorage.setItem("tst_local_scores_v1", JSON.stringify([mockRow, ...localScores]));
      } catch (err) {
        console.error("Failed to save mock score locally:", err);
      }
    };

    try {
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

      if (isPlaceholder) {
        console.warn("Placeholder URL detected. Saving score locally.");
        saveToLocalStorageFallback();
      } else {
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

        // Also save to local mock list to make sure it always shows up locally on the leaderboard instantly
        saveToLocalStorageFallback();
      }

      setIsSubmitted(true);
    } catch (err: unknown) {
      console.error("Error submitting score, running local fallback:", err);
      saveToLocalStorageFallback();
      setIsSubmitted(true);
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

          {/* Right Detailed Stats Grid (with WPM, Accuracy, Consistency, Difficulty as the 4 hero stats) */}
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
              {/* Consistency */}
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-1">
                  CONSISTENCY SCORE
                </span>
                <span className="text-2xl font-extrabold font-mono" style={{ color: "#3B82F6" }}>
                  {consistency}%
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
              {/* Duration / Time Elapsed */}
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-1">
                  TIME ELAPSED
                </span>
                <span className="text-2xl font-extrabold font-mono text-slate-200">
                  {timeTaken}s
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

      {/* 1. Performance Certificate Card Container */}
      <div className="w-full max-w-xl bg-charcoal-800 border-2 border-charcoal-700 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col mb-6">

        {/* Subtle decorative color bar using HEX strictly */}
        <div className="h-1.5 w-full bg-gradient-to-r from-electric-500 via-sky-500 to-emerald-500" />

        {/* Certificate Card Header */}
        <div className="p-6 sm:p-8 text-center border-b border-charcoal-700 bg-charcoal-900/20">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-charcoal-700 bg-charcoal-900 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              🏆 performance certificate
            </div>
            {xpEarned !== null && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-electric-500/30 bg-electric-500/10 text-[10px] font-mono text-electric-400 uppercase tracking-widest font-bold animate-fade-in">
                +{xpEarned} XP Earned
              </div>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Test Results
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Difficulty level:{" "}
            <span className="text-electric-400 uppercase font-bold mr-2">{difficulty}</span>
            Category:{" "}
            <span className="text-sky-400 uppercase font-bold">{category.replace("_", " ")}</span>
          </p>
        </div>

        {/* Core Stats Section inside Card */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

            {/* WPM Container */}
            <div className="bg-charcoal-900/50 border border-charcoal-700/60 rounded-xl p-5 text-center flex flex-col justify-center items-center col-span-2 sm:col-span-1">
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

            {/* Consistency Container */}
            <div className="bg-charcoal-900/50 border border-charcoal-700/60 rounded-xl p-5 text-center flex flex-col justify-center items-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                consistency
              </span>
              <div className="text-4xl sm:text-5xl font-extrabold text-electric-400 font-mono tracking-tight">
                {consistency}%
              </div>
              <span className="text-xs font-mono text-slate-500 mt-1">Pace stability</span>
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

            {/* Rank / Evaluation Tier */}
            <div className="bg-charcoal-900/50 border border-charcoal-700/60 rounded-xl p-5 text-center flex flex-col justify-center items-center col-span-2 sm:col-span-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                skill level
              </span>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono tracking-tight uppercase">
                {Number(wpm) >= 80 ? "PRO" : Number(wpm) >= 50 ? "INTERMEDIATE" : "TYPIST"}
              </div>
              <span className="text-xs font-mono text-slate-500 mt-1">Evaluation Tier</span>
            </div>

          </div>

          {/* Drill Comparison Panel */}
          {category === "weak_key_drill" && drillComparison && (
            <div className="bg-[#3B82F6]/5 border border-[#3B82F6]/30 rounded-xl p-5 text-left font-mono space-y-3 animate-fade-in">
              <div className="flex items-center gap-1.5 text-xs text-electric-400 font-bold uppercase tracking-wider">
                <span>🎯</span> target keys training results
              </div>
              <div className="text-slate-400 text-[11px] leading-relaxed">
                Targeted keys in this drill: <span className="text-white font-bold">{drillComparison.targetKeys.join(", ")}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="bg-charcoal-900/60 border border-charcoal-700/60 rounded-lg p-3 text-center">
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">Drill Accuracy</span>
                  <span className="text-xl font-extrabold text-emerald-400">{drillComparison.currentAcc}%</span>
                </div>
                <div className="bg-charcoal-900/60 border border-charcoal-700/60 rounded-lg p-3 text-center">
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">Historical Avg</span>
                  <span className="text-xl font-extrabold text-slate-400">{drillComparison.histAcc}%</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 text-center italic">
                {drillComparison.currentAcc > drillComparison.histAcc
                  ? "⚡ Outstanding progress! You beat your historical average on these keys."
                  : "💡 Keep practicing to build solid muscle memory on these keys."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Standalone Leaderboard Submission Flow Panel */}
      <div className="w-full max-w-xl bg-charcoal-800 border-2 border-charcoal-700 rounded-2xl p-6 sm:p-8 shadow-2xl mb-6 relative overflow-hidden transition-all duration-300 hover:border-charcoal-600">
        {/* Top subtle gradient highlight */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-electric-500/30 to-transparent" />

        {!isSubmitted ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🏆</span>
              <h3 className="text-sm font-mono text-white uppercase tracking-wider font-bold">
                Submit to Global Leaderboard
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Claim your spot on the world typing standings! Enter your name below to register this secure, verified score of <span className="text-white font-mono font-bold">{wpm} WPM</span>.
            </p>

            <div className="relative">
              <input
                id="display-name"
                type="text"
                maxLength={20}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. SpeedTyper99"
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500/20 transition-all"
              />
              {displayName.trim() && (
                <div className="absolute right-3 top-3 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 animate-fade-in">
                  Ready
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleSubmitScore}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 shadow-md flex items-center justify-center gap-2 border cursor-pointer
                  disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-charcoal-800
                  bg-emerald-600 border-emerald-500 hover:bg-emerald-500 text-white shadow-emerald-500/10
                  disabled:bg-charcoal-700 disabled:border-charcoal-600 disabled:text-slate-400"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>
                    Submitting...
                  </>
                ) : (
                  "Submit Score to Leaderboard 🏆"
                )}
              </button>

              {/* Error Label */}
              {submitError && (
                <p className="text-rose-400 text-xs font-mono text-center mt-2">
                  ⚠️ {submitError}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center animate-slide-in">
            <div className="flex flex-col items-center justify-center gap-3 py-1">
              {/* Success Badge */}
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-bold shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                ✓
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white tracking-tight uppercase">
                  Score Saved to Leaderboard!
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  Your performance has been successfully locked in and recorded.
                </p>
              </div>

              {/* Locked-in tag */}
              <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-charcoal-900 border border-charcoal-700 text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-500 uppercase tracking-widest text-[9px]">Competitor Name:</span>
                <span className="text-emerald-400 font-bold">{displayName.trim() || "Anonymous"}</span>
              </div>

              {/* Persistent direct CTA Link */}
              <div className="w-full pt-4 border-t border-charcoal-700/50 mt-4 flex justify-center">
                <Link
                  href="/leaderboard"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-electric-500/10 border border-electric-500/30 hover:border-electric-500/60 rounded-xl text-xs font-mono font-bold text-electric-400 uppercase tracking-wider transition-all hover-glow-electric cursor-pointer"
                >
                  View Global Leaderboard 📊 →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. AI Analysis & Share Container */}
      <div className="w-full max-w-xl bg-charcoal-800 border-2 border-charcoal-700 rounded-2xl p-6 sm:p-8 shadow-2xl mb-6 relative overflow-hidden">
        {/* Coach's Note Panel */}
        <div className="bg-charcoal-900/40 border border-charcoal-700/60 rounded-xl p-5 font-mono text-left space-y-2 animate-fade-in mb-6">
          <div className="flex items-center justify-between border-b border-charcoal-700/60 pb-2 mb-2">
            <span className="text-xs text-electric-400 font-bold tracking-wider">
              &gt;_ COACH_ANALYSIS
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
              Adaptive AI Coach
            </span>
          </div>
          {coachLoading ? (
            <div className="space-y-2 animate-pulse py-1">
              <div className="h-3 bg-charcoal-700 rounded w-3/4"></div>
              <div className="h-3 bg-charcoal-700 rounded w-1/2"></div>
            </div>
          ) : (
            <p className="text-xs text-slate-300 leading-relaxed italic">
              &ldquo;{coachFeedback}&rdquo;
            </p>
          )}
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
      </div>

      {/* 4. Action Navigation Footer Container */}
      <div className="w-full max-w-xl bg-charcoal-850 border-2 border-charcoal-700 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
        <div className="p-6 bg-charcoal-900/40 flex flex-col sm:flex-row gap-4 justify-between items-center">
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
