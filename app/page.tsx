"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getPersonalBest, getHistory, TestResult } from "../lib/stats";
import { getGamificationState, GamificationState } from "../lib/gamification";

type Difficulty = "easy" | "medium" | "hard";
type Category = "code_arena" | "knowledge_quest" | "ai_lab" | "world_explorer" | "speed_sprint" | "weak_key_drill";

interface PracticeMode {
  value: Category;
  label: string;
  desc: string;
  icon: string;
  accentClass: string;
  badge?: string;
  styles: string;
}

export default function Home() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [category, setCategory] = useState<Category>("code_arena");
  const [hasPB, setHasPB] = useState(false);
  const [ghostEnabled, setGhostEnabled] = useState(false);
  const [pbWPM, setPbWPM] = useState<number | null>(null);
  const [history, setHistory] = useState<TestResult[]>([]);

  // Gamification state
  const [gamification, setGamification] = useState<GamificationState | null>(null);

  // Tooltip trigger state for locked Weak-Key Drill
  const [showDrillTooltip, setShowDrillTooltip] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch metrics & stats
  useEffect(() => {
    const hist = getHistory();
    setHistory(hist);
    const gam = getGamificationState();
    setGamification(gam);
  }, []);

  // Update personal best whenever difficulty or category changes
  useEffect(() => {
    // If the category is weak_key_drill or speed_sprint, we don't support ghost mode (or only easy/medium/hard standard)
    const isStandardMode = ["code_arena", "knowledge_quest", "ai_lab", "world_explorer"].includes(category);
    if (!isStandardMode) {
      setGhostEnabled(false);
      setHasPB(false);
      setPbWPM(null);
      return;
    }

    const pb = getPersonalBest(difficulty);
    setHasPB(!!pb);
    setPbWPM(pb ? pb.wpm : null);
    if (!pb) {
      setGhostEnabled(false);
    }
  }, [difficulty, category]);

  const handleStartTest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    router.push(`/test?difficulty=${difficulty}&category=${category}${ghostEnabled ? "&ghost=true" : ""}`);
  };

  // 6 Practice Modes definition
  const practiceModes: PracticeMode[] = [
    {
      value: "code_arena",
      label: "Code Arena",
      desc: "Master syntax paradigms & tech concepts.",
      icon: "💻",
      accentClass: "from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400 focus:ring-blue-500/40",
      styles: "hover:border-blue-500/60 shadow-blue-500/5",
    },
    {
      value: "knowledge_quest",
      label: "Knowledge Quest",
      desc: "Type through science, astronomy & factual trivia.",
      icon: "🧠",
      accentClass: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400 focus:ring-amber-500/40",
      styles: "hover:border-amber-500/60 shadow-amber-500/5",
    },
    {
      value: "ai_lab",
      label: "AI Lab",
      desc: "Explore machine learning futures & neural nets.",
      icon: "🤖",
      accentClass: "from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400 focus:ring-purple-500/40",
      styles: "hover:border-purple-500/60 shadow-purple-500/5",
    },
    {
      value: "world_explorer",
      label: "World Explorer",
      desc: "Travel scenic world vistas & global history.",
      icon: "🌍",
      accentClass: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400 focus:ring-emerald-500/40",
      styles: "hover:border-emerald-500/60 shadow-emerald-500/5",
    },
    {
      value: "speed_sprint",
      label: "Speed Sprint",
      desc: "High-pressure 20s burst. Shorter passages.",
      icon: "⚡",
      accentClass: "from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-400 focus:ring-rose-500/40",
      badge: "HOT",
      styles: "hover:border-rose-500/60 shadow-rose-500/5",
    },
    {
      value: "weak_key_drill",
      label: "Weak-Key Drill",
      desc: "AI targeted spacing on your error patterns.",
      icon: "🎯",
      accentClass: "from-indigo-500/20 to-violet-500/10 border-indigo-500/30 text-indigo-400 focus:ring-indigo-500/40",
      styles: "hover:border-indigo-500/60 shadow-indigo-500/5",
    },
  ];

  // Difficulty Tier styling
  const difficulties: { value: Difficulty; label: string; desc: string; activeColor: string }[] = [
    {
      value: "easy",
      label: "Easy Tier",
      desc: "~30 words. Minimal punctuation.",
      activeColor: "border-emerald-500 text-emerald-400 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20",
    },
    {
      value: "medium",
      label: "Medium Tier",
      desc: "~60 words. Balanced paragraphs.",
      activeColor: "border-electric-500 text-electric-400 bg-electric-500/5 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-electric-500/20",
    },
    {
      value: "hard",
      label: "Hard Tier",
      desc: "~100 words. Sophisticated prose.",
      activeColor: "border-rose-500 text-rose-400 bg-rose-500/5 shadow-[0_0_15px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/20",
    },
  ];

  // Calculated session stats
  const sessionStats = () => {
    if (!history.length) {
      return {
        testsToday: 0,
        currentStreak: 0,
        closestAchievement: {
          title: "Speed Demon",
          progress: 0,
          desc: "Reach 80+ WPM in any test",
          percentage: 0,
        },
      };
    }

    // Filter tests today
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const testsToday = history.filter((r) => r.timestamp >= startOfToday).length;

    // Streak
    const currentStreak = gamification?.streakDays || 0;

    // Closest achievement calculation
    // Collect progress values for locked achievements
    const maxWpm = Math.max(...history.map((r) => r.wpm), 0);
    const hasPerfect = history.some((r) => r.accuracy === 100);
    const codeArenaCount = history.filter((r) => r.category === "code_arena" || r.category === "programming").length;
    const knowledgeQuestCount = history.filter((r) => r.category === "knowledge_quest" || r.category === "general_knowledge").length;
    const totalTests = history.length;

    const achsProgress = [
      {
        id: "speed_demon",
        title: "Speed Demon",
        desc: "Reach 80+ WPM",
        current: maxWpm,
        target: 80,
        percentage: Math.min(99, Math.round((maxWpm / 80) * 100)),
      },
      {
        id: "perfect_accuracy",
        title: "Perfect Accuracy",
        desc: "Achieve exactly 100% accuracy",
        current: hasPerfect ? 1 : 0,
        target: 1,
        percentage: hasPerfect ? 99 : 0, // Keep as locked unless unlocked
      },
      {
        id: "seven_day_streak",
        title: "7-Day Streak",
        desc: "Maintain a daily typing streak for 7 days",
        current: currentStreak,
        target: 7,
        percentage: Math.min(99, Math.round((currentStreak / 7) * 100)),
      },
      {
        id: "code_warrior",
        title: "Code Warrior",
        desc: "Complete 10 Code Arena tests",
        current: codeArenaCount,
        target: 10,
        percentage: Math.min(99, Math.round((codeArenaCount / 10) * 100)),
      },
      {
        id: "knowledge_master",
        title: "Knowledge Quest Master",
        desc: "Complete 10 Knowledge Quest tests",
        current: knowledgeQuestCount,
        target: 10,
        percentage: Math.min(99, Math.round((knowledgeQuestCount / 10) * 100)),
      },
      {
        id: "typing_legend_badge",
        title: "Typing Legend",
        desc: "Complete 100 typing tests total",
        current: totalTests,
        target: 100,
        percentage: Math.min(99, Math.round((totalTests / 100) * 100)),
      },
    ];

    // Filter to only those NOT unlocked yet in the active gamificationState
    const unlockedList = gamification?.unlockedAchievements || [];
    const lockedAchs = achsProgress.filter((a) => !unlockedList.includes(a.id));

    // Find the one with highest percentage progress
    let closest = lockedAchs.sort((a, b) => b.percentage - a.percentage)[0];

    if (!closest) {
      closest = {
        id: "all_clear",
        title: "All Complete! 🎉",
        desc: "You have completed all unlockable badges.",
        current: 100,
        target: 100,
        percentage: 100,
      };
    }

    return {
      testsToday,
      currentStreak,
      closestAchievement: closest,
    };
  };

  const currentStats = sessionStats();

  const handleDrillClick = () => {
    const isLocked = history.length < 3;
    if (isLocked) {
      setShowDrillTooltip(true);
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowDrillTooltip(false);
      }, 3000);
    } else {
      setCategory("weak_key_drill");
    }
  };

  return (
    <div className="flex-grow flex flex-col w-full max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 animate-fade-in space-y-8">

      {/* HUD HEADER AREA */}
      <div className="w-full bg-charcoal-800/80 border border-charcoal-700 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#3B82F6]/30 to-transparent" />

        <div className="space-y-1.5 text-left">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-charcoal-700 bg-charcoal-900 text-[10px] font-mono text-slate-400 tracking-wider uppercase font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-electric-500 animate-pulse"></span>
            ACTIVE SESSION DATASET
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight font-sans">
            Welcome back, {history.length > 0 ? "Typist" : "New Recruit"}
          </h1>
          <p className="text-xs text-slate-400 font-sans max-w-md">
            All training missions are initialized. Select your primary target below to engage.
          </p>
        </div>

        {/* Cohesive HUD Progress Sheet */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="border border-charcoal-700 bg-charcoal-900/50 rounded-xl px-4 py-2.5 font-mono text-left min-w-[100px]">
            <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">LEVEL</div>
            <div className="text-base font-extrabold text-electric-400">
              {gamification ? `${gamification.currentLevel} : ${gamification.levelTitle}` : "1 : Beginner"}
            </div>
          </div>

          <div className="border border-charcoal-700 bg-charcoal-900/50 rounded-xl px-4 py-2.5 font-mono text-left min-w-[90px]">
            <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">STREAK</div>
            <div className="text-base font-extrabold text-amber-500 flex items-center gap-1">
              <span>🔥</span>
              <span>{gamification ? gamification.streakDays : 0} days</span>
            </div>
          </div>

          <div className="border border-charcoal-700 bg-charcoal-900/50 rounded-xl px-4 py-2.5 font-mono text-left min-w-[90px]">
            <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">PERSONAL BEST</div>
            <div className="text-base font-extrabold text-white">
              {history.length > 0 ? `${getPersonalBest()?.wpm || 0} WPM` : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* GAME MENU / MISSION SELECT GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-mono text-slate-400 uppercase tracking-widest font-bold">
            ⚔️ [ MISSION SELECT SCREEN ]
          </h2>
          <span className="text-[10px] font-mono text-slate-500 uppercase">6 active test portals</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {practiceModes.map((mode) => {
            const isDrill = mode.value === "weak_key_drill";
            const isDrillLocked = isDrill && history.length < 3;
            const isSelected = category === mode.value;

            return (
              <div key={mode.value} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (isDrillLocked) {
                      handleDrillClick();
                    } else {
                      setCategory(mode.value);
                    }
                  }}
                  className={`w-full text-left p-6 rounded-2xl border bg-gradient-to-br transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-[150px] cursor-pointer outline-none focus:ring-1 ${
                    isSelected
                      ? `border-white shadow-lg shadow-white/5 ring-1 ring-white/10 ${mode.accentClass}`
                      : isDrillLocked
                      ? "border-charcoal-700/45 bg-charcoal-900/10 text-slate-600 select-none opacity-60"
                      : `border-charcoal-700 bg-charcoal-800/40 hover:bg-charcoal-800/80 ${mode.styles}`
                  }`}
                >
                  {/* Subtle Grid Accent Pattern inside card */}
                  <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:16px_16px]" />

                  {/* Top line: Icon & Title */}
                  <div className="flex items-center justify-between w-full z-10">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl leading-none">{isDrillLocked ? "🔒" : mode.icon}</span>
                      <span className={`font-mono text-xs font-bold uppercase tracking-wider ${isSelected ? "text-white" : isDrillLocked ? "text-slate-500" : "text-slate-200"}`}>
                        {mode.label}
                      </span>
                    </div>

                    {mode.badge && !isDrillLocked && (
                      <span className="px-1.5 py-0.5 text-[8px] font-mono font-bold bg-rose-500/20 text-rose-400 rounded border border-rose-500/30 uppercase tracking-wider">
                        {mode.badge}
                      </span>
                    )}

                    {isDrillLocked && (
                      <span className="px-1.5 py-0.5 text-[8px] font-mono font-bold bg-charcoal-700 text-slate-400 rounded uppercase tracking-wider">
                        LOCKED
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className={`text-xs leading-relaxed z-10 max-w-[240px] ${isSelected ? "text-white/90" : isDrillLocked ? "text-slate-600" : "text-slate-400"}`}>
                    {mode.desc}
                  </p>

                  {/* Active Indicator on bottom-right */}
                  <div className="flex justify-end w-full font-mono text-[9px] uppercase tracking-widest font-extrabold">
                    {isSelected ? (
                      <span className="text-white flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        Portal Engaged
                      </span>
                    ) : isDrillLocked ? (
                      <span className="text-slate-500">Need 3+ Runs ({history.length}/3)</span>
                    ) : (
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white">Activate →</span>
                    )}
                  </div>
                </button>

                {/* Drill Locked Tooltip popover */}
                {isDrill && showDrillTooltip && (
                  <div className="absolute top-[-50px] left-1/2 transform -translate-x-1/2 z-20 w-64 bg-charcoal-900 border border-charcoal-700 rounded-xl p-3 shadow-2xl text-center text-xs text-slate-300 font-sans animate-fade-in">
                    <p className="leading-relaxed">
                      ⚠️ Complete at least <span className="text-electric-400 font-bold font-mono">{3 - history.length} more</span> standard typing tests to build precision history data and unlock Weak-Key Drills.
                    </p>
                    <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-charcoal-900 border-r border-b border-charcoal-700 rotate-45" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SESSION PROGRESS / STATS STRIP (Secondary element) */}
      <div className="bg-charcoal-800/40 border border-charcoal-750 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs items-center">
        {/* Metric 1: Tests today */}
        <div className="flex items-center gap-3.5 border-b md:border-b-0 md:border-r border-charcoal-700 pb-4 md:pb-0">
          <div className="w-9 h-9 rounded-lg bg-electric-500/10 border border-electric-500/30 flex items-center justify-center text-base">
            📊
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider block">TESTS COMPLETED TODAY</span>
            <div className="text-sm font-extrabold text-white">
              {currentStats.testsToday} {currentStats.testsToday === 1 ? "run" : "runs"}
            </div>
          </div>
        </div>

        {/* Metric 2: Streak Status */}
        <div className="flex items-center gap-3.5 border-b md:border-b-0 md:border-r border-charcoal-700 pb-4 md:pb-0">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-base">
            🔥
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider block">CURRENT SEQUENCE</span>
            <div className="text-sm font-extrabold text-white">
              {currentStats.currentStreak === 0 ? (
                <span className="text-slate-500">Initialize a streak today!</span>
              ) : (
                <span>{currentStats.currentStreak}-day practice streak</span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 3: Closest Achievement progress bar */}
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-base">
            🏆
          </div>
          <div className="flex-grow space-y-1">
            <div className="flex justify-between text-[10px] uppercase tracking-wider">
              <span className="text-slate-500 font-bold truncate max-w-[120px]">{currentStats.closestAchievement.title}</span>
              <span className="text-emerald-400 font-bold">{currentStats.closestAchievement.percentage}%</span>
            </div>
            <div className="w-full h-1.5 bg-charcoal-900 border border-charcoal-700 rounded-full overflow-hidden">
              <div
                style={{ width: `${currentStats.closestAchievement.percentage}%` }}
                className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"
              />
            </div>
            <div className="text-[8px] text-slate-500 uppercase truncate">
              {currentStats.closestAchievement.desc}
            </div>
          </div>
        </div>
      </div>

      {/* OPTION C: CENTERED MISSION CONFIGURATION CONSOLE */}
      <div className="w-full bg-charcoal-800 border border-charcoal-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 transition-all duration-300 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-1 bg-electric-500" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-charcoal-750 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-electric-400 font-bold bg-electric-500/10 px-2 py-0.5 rounded border border-electric-500/20">
                ACTIVE PORTAL: {category.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white uppercase tracking-wider font-sans">
              Set Mission Parameters
            </h3>
          </div>

          <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5 uppercase bg-charcoal-900/60 border border-charcoal-700/60 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Telemetry Stream Calibrated
          </div>
        </div>

        {/* Console grid: Difficulty & Ghost Settings */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Difficulty Block */}
          <div className="md:col-span-8 space-y-3">
            <span className="font-mono text-xs text-slate-400 uppercase tracking-widest font-bold block">
              Choose Difficulty Tier:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {difficulties.map((item) => {
                const isSelected = difficulty === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setDifficulty(item.value)}
                    className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 ${
                      isSelected
                        ? item.activeColor
                        : "border-charcoal-700 bg-charcoal-900/40 text-slate-300 hover:border-charcoal-600 hover:bg-charcoal-900/60"
                    }`}
                  >
                    <span className="font-mono text-[10px] uppercase tracking-wider font-extrabold mb-0.5 block">
                      {item.label}
                    </span>
                    <p className="text-[10px] text-slate-400 leading-normal font-sans">
                      {item.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ghost Mode settings segment */}
          <div className="md:col-span-4 flex flex-col justify-center">
            {/* Standard Category Check for Ghost Mode eligibility */}
            {["code_arena", "knowledge_quest", "ai_lab", "world_explorer"].includes(category) && hasPB ? (
              <div className="bg-charcoal-900/40 border border-charcoal-700 rounded-xl p-4 flex items-center justify-between transition-all">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1">
                      <span>👻</span> Ghost Race
                    </span>
                    <span className={`px-1 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                      ghostEnabled
                        ? "bg-electric-500/20 text-electric-400 border border-electric-500/30"
                        : "bg-charcoal-700 text-slate-400 border border-charcoal-600"
                    }`}>
                      {ghostEnabled ? "Active" : "Off"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal font-sans">
                    Race your best run of <span className="text-electric-400 font-mono font-semibold">{pbWPM} WPM</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGhostEnabled(!ghostEnabled)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-electric-500 ${
                    ghostEnabled ? "bg-electric-500" : "bg-charcoal-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      ghostEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ) : (
              <div className="border border-charcoal-750 bg-charcoal-900/25 rounded-xl p-4 text-center font-mono text-[10px] text-slate-500 leading-relaxed uppercase">
                {category === "speed_sprint" ? (
                  <span>⏱️ Countdown active. Ghost Mode unavailable.</span>
                ) : category === "weak_key_drill" ? (
                  <span>🎯 Drill Active. Ghost Mode unavailable.</span>
                ) : (
                  <span>🔒 complete standard run to unlock ghost</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Start Control Actions */}
        <div className="pt-4 border-t border-charcoal-750 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono uppercase">
            <span className="text-electric-500 animate-pulse">⚡</span> engaging portal initiates instant telemetry calibration
          </div>
          <button
            onClick={handleStartTest}
            className="w-full sm:w-auto text-center px-10 py-3.5 bg-electric-500 hover:bg-electric-400 text-white font-semibold rounded-xl shadow-lg shadow-electric-500/15 transition-all duration-200 hover-glow-electric cursor-pointer text-xs uppercase tracking-wider font-mono border border-electric-400/30"
          >
            Launch Mission →
          </button>
        </div>
      </div>

    </div>
  );
}
