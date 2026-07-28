"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getHistory, getHistorySummary, getPersonalBest, TestResult, getKeyErrors, getTrendComparison, TrendComparison, getNamespacedKey } from "../../lib/stats";
import { getGamificationState, ACHIEVEMENTS, GamificationState, computeMilestones, MilestoneEvent } from "../../lib/gamification";

function formatDateShort(timestamp: number) {
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthName = months[d.getMonth()];
  return `${day} ${monthName}`;
}

function formatDateLong(timestamp: number) {
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${monthName} ${year}`;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<TestResult[]>([]);
  const [keyErrors, setKeyErrors] = useState<Record<string, number>>({});
  const [gamification, setGamification] = useState<GamificationState | null>(null);
  const [trend, setTrend] = useState<TrendComparison | null>(null);
  const [milestones, setMilestones] = useState<MilestoneEvent[]>([]);
  const [personalGoal, setPersonalGoal] = useState<number | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [activeSkin, setActiveSkin] = useState("electric-blue");

  const activeSkinColor = useMemo(() => {
    if (activeSkin === "emerald-terminal") return "#10B981";
    if (activeSkin === "amber-crt") return "#F59E0B";
    if (activeSkin === "crimson-protocol") return "#EF4444";
    return "#3B82F6"; // electric-blue
  }, [activeSkin]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setActiveSkin(localStorage.getItem("tst_active_skin") || "electric-blue");
    }
  }, []);

  const handleSelectSkin = (skinId: string) => {
    localStorage.setItem("tst_active_skin", skinId);
    setActiveSkin(skinId);
    window.dispatchEvent(new CustomEvent("tst-skin-changed", { detail: skinId }));
  };

  useEffect(() => {
    const hist = getHistory();
    setHistory(hist);
    setKeyErrors(getKeyErrors());
    setGamification(getGamificationState());
    setTrend(getTrendComparison(hist));
    setMilestones(computeMilestones(hist));

    // Load WPM goal
    const stored = localStorage.getItem(getNamespacedKey("tst_personal_wpm_goal_v1"));
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setPersonalGoal(parsed);
      }
    }
  }, []);

  const handleSaveGoal = (val: string) => {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      localStorage.setItem(getNamespacedKey("tst_personal_wpm_goal_v1"), parsed.toString());
      setPersonalGoal(parsed);
      setIsEditingGoal(false);
      // Recalculate gamification state (to immediately recognize Goal Crusher unlock if applicable)
      setGamification(getGamificationState());
    } else {
      localStorage.removeItem(getNamespacedKey("tst_personal_wpm_goal_v1"));
      setPersonalGoal(null);
      setIsEditingGoal(false);
      setGamification(getGamificationState());
    }
  };

  const summary = useMemo(() => getHistorySummary(history), [history]);
  const pbOverall = useMemo(() => getPersonalBest(undefined, history), [history]);
  const pbEasy = useMemo(() => getPersonalBest("easy", history), [history]);
  const pbMedium = useMemo(() => getPersonalBest("medium", history), [history]);
  const pbHard = useMemo(() => getPersonalBest("hard", history), [history]);

  const SKINS = useMemo(() => {
    return [
      {
        id: "electric-blue",
        name: "Electric Blue",
        colorHex: "#3B82F6",
        desc: "Default sleek, modern operator interface. High-contrast electric styling.",
        unlockLabel: "Always Unlocked",
        isUnlocked: true,
      },
      {
        id: "emerald-terminal",
        name: "Emerald Terminal",
        colorHex: "#10B981",
        desc: "Classic Matrix hacker green. Maximum terminal nostalgia.",
        unlockLabel: "Requires 'Speed Demon' Achievement (80+ WPM)",
        isUnlocked: gamification?.unlockedAchievements.includes("speed_demon") ?? false,
      },
      {
        id: "amber-crt",
        name: "Amber CRT",
        colorHex: "#F59E0B",
        desc: "Warm monochrome phosphor glow. Vintage retro CRT styling.",
        unlockLabel: "Requires 'Typing Legend' Achievement (100 completed tests)",
        isUnlocked: gamification?.unlockedAchievements.includes("typing_legend_badge") ?? false,
      },
      {
        id: "crimson-protocol",
        name: "Crimson Protocol",
        colorHex: "#EF4444",
        desc: "Elite red alert overlay. S-Tier operator prestige styling.",
        unlockLabel: "Requires reaching Operator Level 6 (10,000+ XP)",
        isUnlocked: (gamification?.currentLevel ?? 1) >= 6,
      },
    ];
  }, [gamification]);

  const skillProfile = useMemo(() => {
    const recentTests = [...history].slice(0, 10);
    if (recentTests.length === 0) return null;

    const avgWpm = recentTests.reduce((sum, r) => sum + r.wpm, 0) / recentTests.length;
    const avgAccuracy = recentTests.reduce((sum, r) => sum + r.accuracy, 0) / recentTests.length;

    const testsWithConsistency = recentTests.filter((r) => typeof r.consistency === "number");
    const avgConsistency = testsWithConsistency.length > 0
      ? testsWithConsistency.reduce((sum, r) => sum + (r.consistency || 0), 0) / testsWithConsistency.length
      : 0;

    const speedRating = Math.round(Math.min(100, (avgWpm / 120) * 100));
    const accuracyRating = Math.round(avgAccuracy);
    const consistencyRating = Math.round(avgConsistency);

    return {
      speed: speedRating,
      accuracy: accuracyRating,
      consistency: consistencyRating,
      avgWpm: Math.round(avgWpm),
      avgAccuracy: Math.round(avgAccuracy * 10) / 10,
      avgConsistency: Math.round(avgConsistency),
      count: recentTests.length,
    };
  }, [history]);

  const modeBreakdown = useMemo(() => {
    const categoriesList = [
      { id: "code_arena", label: "Code Arena", icon: "💻" },
      { id: "knowledge_quest", label: "Knowledge Quest", icon: "🧠" },
      { id: "ai_lab", label: "AI Lab", icon: "🤖" },
      { id: "world_explorer", label: "World Explorer", icon: "🌍" },
      { id: "weak_key_drill", label: "Weak-Key Drill", icon: "🎯" },
      { id: "speed_sprint", label: "Speed Sprint", icon: "⚡" },
    ];

    return categoriesList.map((cat) => {
      const matching = history.filter((r) => {
        if (cat.id === "code_arena") return r.category === "code_arena" || r.category === "programming";
        if (cat.id === "knowledge_quest") return r.category === "knowledge_quest" || r.category === "general_knowledge";
        return r.category === cat.id;
      });

      if (matching.length === 0) {
        return {
          ...cat,
          count: 0,
          avgWpm: 0,
          avgAccuracy: 0,
        };
      }

      const totalWpm = matching.reduce((sum, r) => sum + r.wpm, 0);
      const totalAcc = matching.reduce((sum, r) => sum + r.accuracy, 0);

      return {
        ...cat,
        count: matching.length,
        avgWpm: Math.round(totalWpm / matching.length),
        avgAccuracy: Math.round((totalAcc / matching.length) * 10) / 10,
      };
    });
  }, [history]);

  // Last 20 tests for the chart, in chronological order (left to right)
  const chartData = useMemo(() => {
    return [...history].slice(0, 20).reverse();
  }, [history]);

  // Max error count for heatmap relative scaling
  const maxErrorCount = useMemo(() => {
    const vals = Object.values(keyErrors);
    return vals.length > 0 ? Math.max(...vals, 1) : 1;
  }, [keyErrors]);

  const qwertyRows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
    ["SPACE"]
  ];

  // Render beautiful hand-crafted Custom SVG line chart
  const svgChart = useMemo(() => {
    if (chartData.length < 2) return null;

    // Dimensions
    const width = 800;
    const height = 260;
    const paddingLeft = 50;
    const paddingRight = 30;
    const paddingTop = 20;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Find min/max WPM for standardizing chart scale
    const wpms = chartData.map((d) => d.wpm);
    const maxWpm = Math.max(...wpms, 100); // floor of 100 max range
    const minWpm = Math.min(...wpms, 0); // floor of 0 min range
    const wpmRange = maxWpm - minWpm || 1;

    // Map each data point to X, Y coordinates
    const points = chartData.map((d, index) => {
      const x = paddingLeft + (index / (chartData.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - ((d.wpm - minWpm) / wpmRange) * chartHeight;
      return { x, y, data: d, index };
    });

    // Create SVG path string
    const pathD = points.reduce((acc, p, idx) => {
      if (idx === 0) return `M ${p.x} ${p.y}`;
      return `${acc} L ${p.x} ${p.y}`;
    }, "");

    // Path for gradient filling under the curve
    const areaD = points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
      : "";

    // Generate horizontal grid lines and vertical labels
    const gridCount = 4;
    const yGridLines = Array.from({ length: gridCount + 1 }).map((_, idx) => {
      const val = minWpm + (idx / gridCount) * wpmRange;
      const y = paddingTop + chartHeight - (idx / gridCount) * chartHeight;
      return { val: Math.round(val), y };
    });

    return (
      <div className="w-full relative group">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            {/* Custom linear gradient using strictly HEX colors */}
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeSkinColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={activeSkinColor} stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yGridLines.map((line, idx) => (
            <g key={idx} className="opacity-40">
              <line
                x1={paddingLeft}
                y1={line.y}
                x2={width - paddingRight}
                y2={line.y}
                stroke="#23272F"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 10}
                y={line.y + 4}
                textAnchor="end"
                className="fill-slate-500 font-mono text-[10px]"
              >
                {line.val}
              </text>
            </g>
          ))}

          {/* Gradient area */}
          {areaD && (
            <path
              d={areaD}
              fill="url(#chartGradient)"
              className="animate-fade-in"
              style={{ animationDuration: "1s" }}
            />
          )}

          {/* Line path */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={activeSkinColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="path-draw-in"
              style={{
                strokeDasharray: 2000,
                strokeDashoffset: 0,
              }}
            />
          )}

          {/* Points & Hover Tooltips */}
          {points.map((p, idx) => (
            <g key={idx} className="group/node">
              {/* Outer hover ring */}
              <circle
                cx={p.x}
                cy={p.y}
                r="8"
                className="fill-electric-500/0 hover:fill-electric-500/20 transition-all duration-150 cursor-pointer"
              />
              {/* Core point dot */}
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                className="fill-electric-500 stroke-charcoal-900 stroke-[2.5px] transition-all duration-150 group-hover/node:scale-125"
              />
              {/* Minimalist interactive node tooltip overlay on SVG */}
              <title>{`${p.data.wpm} WPM (${p.data.difficulty}) - ${formatDateShort(p.data.timestamp)}`}</title>
            </g>
          ))}

          {/* X Axis Labels for tests (Dates or Indices) */}
          {points.map((p, idx) => {
            // Only show labels on odd indices or bounds to prevent crowding
            const step = Math.ceil(points.length / 7);
            if (idx % step !== 0 && idx !== points.length - 1) return null;

            return (
              <text
                key={idx}
                x={p.x}
                y={height - 15}
                textAnchor="middle"
                className="fill-slate-500 font-mono text-[9px] uppercase tracking-wider font-bold"
              >
                {formatDateShort(p.data.timestamp)}
              </text>
            );
          })}
        </svg>
      </div>
    );
  }, [chartData, activeSkinColor]);

  return (
    <div className="flex-grow flex flex-col w-full max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <main className="flex-grow flex flex-col w-full space-y-8">
        {/* Page Title */}
        <div className="text-center space-y-3 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-charcoal-700 bg-charcoal-800 text-xs font-mono text-slate-400 tracking-wider uppercase">
            📊 Personal Dashboard
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-none">
            Your Performance <span className="text-electric-500 bg-gradient-to-r from-electric-400 to-electric-600 bg-clip-text text-transparent">History</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto font-sans">
            Analyze your speed progression, view personal records, and race against your past ghost.
          </p>
        </div>

        {history.length === 0 ? (
          /* Empty State for first-time users */
          <div className="w-full bg-charcoal-800 border border-charcoal-700 rounded-2xl p-12 text-center space-y-6 max-w-xl mx-auto shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-electric-500/5 border border-electric-500/20 flex items-center justify-center mx-auto text-3xl">
              ⌨️
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight font-sans">No Typing History Found</h2>
              <p className="text-sm text-slate-400 font-sans leading-relaxed">
                You haven&apos;t completed any speed typing tests yet on this machine. Take your first test to initialize local tracking metrics and unlock the performance charts.
              </p>
            </div>
            <Link
              href="/"
              className="btn-primary min-h-[44px] px-6 py-2.5 bg-electric-500 text-white font-bold rounded-xl active:scale-[0.97] transition-all cursor-pointer"
            >
              [ LAUNCH FIRST TEST ⚡ ]
            </Link>
          </div>
        ) : (
          /* Main Dashboard View */
          <div className="space-y-8">
            {/* Gamification Player profile card Summary Block */}
            {gamification && (
              <div className="bg-charcoal-800 border-2 border-[#3B82F6]/30 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 relative overflow-hidden animate-fade-in">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-electric-400 to-electric-600" />

                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-electric-400 uppercase tracking-widest font-extrabold block">
                      {"// RECRUIT PROGRESSION TRACKING"}
                    </span>
                    <h2 className="text-xl font-extrabold text-white font-mono">
                      {gamification.levelTitle} <span className="text-sm font-mono text-slate-500">(Level {gamification.currentLevel})</span>
                    </h2>
                  </div>

                  <div className="flex gap-6 items-center text-left sm:text-right font-mono text-xs">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block font-bold">Total Tests</span>
                      <strong className="text-white text-sm font-black">{history.length}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block font-bold">Active Streak</span>
                      <strong className="text-amber-500 text-sm font-black flex items-center gap-0.5">
                        <span>🔥</span> {gamification.streakDays}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block font-bold">XP Base</span>
                      <strong className="text-white text-sm font-black">{gamification.totalXp.toLocaleString()} XP</strong>
                    </div>
                  </div>
                </div>

                {/* Progress Bar Container */}
                {gamification.nextLevelXp && (
                  <div className="space-y-1.5">
                    <div className="w-full h-3 bg-[#121316] rounded-full border border-charcoal-700 overflow-hidden relative">
                      <div
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              ((gamification.totalXp - gamification.prevLevelXp) /
                                (gamification.nextLevelXp - gamification.prevLevelXp)) *
                                100
                            )
                          )}%`,
                        }}
                        className="h-full bg-electric-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                      <span>{gamification.prevLevelXp} XP</span>
                      <span>
                        {Math.round(
                          ((gamification.totalXp - gamification.prevLevelXp) /
                            (gamification.nextLevelXp - gamification.prevLevelXp)) *
                            100
                        )}
                        % Complete
                      </span>
                      <span>{gamification.nextLevelXp} XP</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Trends and Goal Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Progress Trends Card */}
              <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-charcoal-700 pb-3">
                  <h2 className="text-sm font-mono text-slate-300 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                    <span>📈</span> performance trends
                  </h2>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                    Rolling 7-day windows
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2">
                  {/* WPM Trend */}
                  <div className="bg-charcoal-900/40 border border-charcoal-700/60 rounded-xl p-4 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                      WPM Trend
                    </span>
                    {trend && trend.thisWeekWpm !== null ? (
                      <div className="space-y-1">
                        <div className="text-2xl font-extrabold text-white font-mono">
                          {trend.thisWeekWpm} <span className="text-xs font-normal text-slate-500 font-mono">WPM avg</span>
                        </div>
                        {trend.wpmDiff !== null ? (
                          <div className={`text-xs font-mono font-bold ${trend.wpmDiff >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {trend.wpmDiff >= 0 ? `+${trend.wpmDiff}` : trend.wpmDiff} WPM vs last week
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-electric-400 font-bold bg-electric-500/10 px-2.5 py-1 rounded-xl inline-block border border-electric-500/20">
                            First week of training!
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 italic py-2">No tests this week</div>
                    )}
                  </div>

                  {/* Accuracy Trend */}
                  <div className="bg-charcoal-900/40 border border-charcoal-700/60 rounded-xl p-4 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                      Accuracy Trend
                    </span>
                    {trend && trend.thisWeekAcc !== null ? (
                      <div className="space-y-1">
                        <div className="text-2xl font-extrabold text-white font-mono">
                          {trend.thisWeekAcc}% <span className="text-xs font-normal text-slate-500 font-mono">avg</span>
                        </div>
                        {trend.accDiff !== null ? (
                          <div className={`text-xs font-mono font-bold ${trend.accDiff >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {trend.accDiff >= 0 ? `+${trend.accDiff}` : trend.accDiff}% vs last week
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-electric-400 font-bold bg-electric-500/10 px-2.5 py-1 rounded-xl inline-block border border-electric-500/20">
                            First week of training!
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 italic py-2">No tests this week</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Goal Setting Card */}
              <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-charcoal-700 pb-3">
                  <h2 className="text-sm font-mono text-slate-300 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                    <span>🎯</span> personal speed target
                  </h2>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                    deliberate practice goal
                  </span>
                </div>

                {personalGoal === null ? (
                  /* No Goal Defined State */
                  <div className="py-4 text-center space-y-3">
                    <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-sm mx-auto">
                      Define a clear target WPM to unlock interactive goal-tracking and focus on deliberate skill acquisition.
                    </p>
                    <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                      <input
                        type="number"
                        placeholder="e.g. 70"
                        id="goal-input-init"
                        className="w-24 bg-[#121316] border border-[#23272F] rounded-xl px-3 py-3 text-sm font-mono text-white text-center focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500/20 min-h-[44px]"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = (e.target as HTMLInputElement).value;
                            handleSaveGoal(val);
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById("goal-input-init") as HTMLInputElement;
                          if (input) handleSaveGoal(input.value);
                        }}
                        className="btn-primary min-h-[44px] px-4 py-2 hover:bg-electric-400 text-white font-mono text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-[0.97]"
                      >
                        Set Goal
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Goal Defined State with Progress Bar */
                  <div className="space-y-4 py-2">
                    <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                      <span>Current PB: <strong className="text-white font-mono">{pbOverall ? pbOverall.wpm : 0} WPM</strong></span>
                      <span>Target: <strong className="text-electric-400 font-mono">{personalGoal} WPM</strong></span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-[#121316] rounded-full border border-charcoal-700 overflow-hidden relative">
                        <div
                          style={{
                            width: `${Math.min(100, Math.max(0, ((pbOverall ? pbOverall.wpm : 0) / personalGoal) * 100))}%`,
                          }}
                          className="h-full bg-electric-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                        <span>0 WPM</span>
                        <span>
                          {Math.min(100, Math.round(((pbOverall ? pbOverall.wpm : 0) / personalGoal) * 100))}% Completed
                        </span>
                        <span>{personalGoal} WPM</span>
                      </div>
                    </div>

                    {/* Completion Celebration Message and Edit Actions */}
                    <div className="flex justify-between items-center pt-2">
                      {pbOverall && pbOverall.wpm >= personalGoal ? (
                        <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded inline-flex items-center gap-1 font-bold">
                          <span>🎉</span> Goal Met! Level Up Target.
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono text-slate-500 italic">
                          Keep pushing to meet your target.
                        </div>
                      )}

                      {isEditingGoal ? (
                        <div className="flex items-center gap-1.5 animate-fade-in">
                          <input
                            type="number"
                            defaultValue={personalGoal}
                            id="goal-input-edit"
                            className="w-16 bg-[#121316] border border-[#23272F] rounded-lg px-2 py-2 text-xs font-mono text-white text-center focus:outline-none focus:border-electric-500 min-h-[36px]"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const val = (e.target as HTMLInputElement).value;
                                handleSaveGoal(val);
                              }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              const input = document.getElementById("goal-input-edit") as HTMLInputElement;
                              if (input) handleSaveGoal(input.value);
                            }}
                            className="text-[10px] font-mono text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 rounded hover:bg-emerald-500/10 font-bold"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsEditingGoal(true)}
                          className="btn-secondary h-9 py-1 px-3 text-[10px] font-mono rounded-lg transition-colors cursor-pointer"
                        >
                          Modify Target
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {/* Metric 1: Total Tests */}
              <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-4 sm:p-5 relative overflow-hidden group">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1 font-bold">
                  Tests Completed
                </span>
                <div className="text-3xl font-extrabold text-white font-mono leading-none">
                  {summary.totalTests}
                </div>
                <div className="absolute right-3 bottom-3 text-xs opacity-10 font-mono text-electric-400 text-right uppercase font-bold">
                  Count
                </div>
              </div>

              {/* Metric 2: Avg WPM */}
              <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-4 sm:p-5 relative overflow-hidden group">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1 font-bold">
                  Average Speed
                </span>
                <div className="text-3xl font-extrabold text-electric-400 font-mono leading-none">
                  {summary.avgWpm} <span className="text-xs font-normal text-slate-500 font-mono">WPM</span>
                </div>
                <div className="absolute right-3 bottom-3 text-xs opacity-10 font-mono text-electric-400 text-right uppercase font-bold">
                  Avg
                </div>
              </div>

              {/* Metric 3: Avg Accuracy */}
              <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-4 sm:p-5 relative overflow-hidden group">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1 font-bold">
                  Average Accuracy
                </span>
                <div className="text-3xl font-extrabold text-emerald-400 font-mono leading-none">
                  {summary.avgAccuracy}%
                </div>
                <div className="absolute right-3 bottom-3 text-xs opacity-10 font-mono text-electric-400 text-right uppercase font-bold">
                  Acc
                </div>
              </div>

              {/* Metric 4: Avg Consistency */}
              <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-4 sm:p-5 relative overflow-hidden group">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1 font-bold">
                  Avg Consistency
                </span>
                <div className="text-3xl font-extrabold text-sky-400 font-mono leading-none">
                  {summary.avgConsistency}%
                </div>
                <div className="absolute right-3 bottom-3 text-xs opacity-10 font-mono text-electric-400 text-right uppercase font-bold">
                  Pace
                </div>
              </div>

              {/* Metric 5: All-time Personal Best */}
              <div className="bg-charcoal-800 border border-electric-500/40 rounded-xl p-4 sm:p-5 relative overflow-hidden group shadow-[0_0_12px_rgba(59,130,246,0.05)] col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-electric-400 uppercase tracking-wider block font-bold">
                    Personal Best
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-electric-500 text-white leading-none">
                    PB
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-white font-mono leading-none">
                  {pbOverall ? pbOverall.wpm : 0} <span className="text-xs font-normal text-slate-500 font-mono">WPM</span>
                </div>
                {pbOverall && (
                  <div className="text-[9px] font-mono text-slate-500 mt-1 uppercase font-bold">
                    On {pbOverall.difficulty}
                  </div>
                )}
              </div>
            </div>

            {/* Skins Customization Section */}
            <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-charcoal-700 pb-3">
                <h2 className="text-sm font-mono text-slate-300 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                  <span>🎨</span> Custom Operator Skins
                </h2>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                  Unlock theme variations via achievements
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                {SKINS.map((skin) => {
                  const isActive = activeSkin === skin.id;
                  return (
                    <div
                      key={skin.id}
                      onClick={() => skin.isUnlocked && handleSelectSkin(skin.id)}
                      className={`relative rounded-xl border p-4 font-mono text-xs flex flex-col justify-between min-h-[140px] select-none transition-all duration-300 ${
                        skin.isUnlocked
                          ? "cursor-pointer hover:border-electric-500/50 hover:bg-charcoal-900/20 card-hover-lift"
                          : "opacity-45 bg-charcoal-900/10 cursor-not-allowed"
                      } ${
                        isActive
                          ? "border-electric-500 bg-electric-500/[0.04] shadow-[0_0_12px_rgba(var(--color-accent-rgb),0.15)] ring-1 ring-electric-500/30"
                          : "border-charcoal-700 bg-charcoal-800"
                      }`}
                    >
                      <div>
                        {/* Top color circle badge */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              style={{ backgroundColor: skin.colorHex }}
                              className="w-3.5 h-3.5 rounded-full inline-block border border-black/30"
                            />
                            <span className="font-extrabold text-white text-xs">{skin.name}</span>
                          </div>
                          {isActive && (
                            <span className="text-[9px] bg-electric-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
                              ACTIVE
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-[10px] text-slate-400 font-sans leading-normal mb-3">
                          {skin.desc}
                        </p>
                      </div>

                      {/* Unlock status at the bottom */}
                      <div className="pt-2 border-t border-charcoal-700/50 flex items-center justify-between text-[9px] font-mono">
                        {skin.isUnlocked ? (
                          <span className="text-emerald-400 font-bold uppercase tracking-wider">
                            ✓ UNLOCKED
                          </span>
                        ) : (
                          <div className="text-rose-400/90 font-bold leading-tight pr-2 uppercase" title={skin.unlockLabel}>
                            🔒 LOCKED
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Skill Profile & Mode Breakdown Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Active Skill Profile */}
              <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-charcoal-700 pb-3">
                  <h2 className="text-sm font-mono text-slate-300 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                    <span>👤</span> Active Skill Profile
                  </h2>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                    Recent 10 completed tests
                  </span>
                </div>

                {skillProfile ? (
                  <div className="space-y-4 py-2">
                    {/* Speed Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white font-bold uppercase">SPEED RATING</span>
                        <span className="text-electric-400 font-bold">
                          {skillProfile.speed}/100 <span className="text-[10px] text-slate-500 font-normal font-mono">({skillProfile.avgWpm} WPM)</span>
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#121316] rounded-full overflow-hidden relative">
                        <div
                          style={{ width: `${skillProfile.speed}%` }}
                          className="h-full bg-[#3B82F6] rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-fade-in"
                        />
                      </div>
                    </div>

                    {/* Accuracy Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white font-bold uppercase">ACCURACY RATING</span>
                        <span className="text-emerald-400 font-bold">
                          {skillProfile.accuracy}/100 <span className="text-[10px] text-slate-500 font-normal font-mono">({skillProfile.avgAccuracy}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#121316] rounded-full overflow-hidden relative">
                        <div
                          style={{ width: `${skillProfile.accuracy}%` }}
                          className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-fade-in"
                        />
                      </div>
                    </div>

                    {/* Consistency Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white font-bold uppercase">CONSISTENCY RATING</span>
                        <span className="text-sky-400 font-bold">
                          {skillProfile.consistency}/100 <span className="text-[10px] text-slate-500 font-normal font-mono">({skillProfile.avgConsistency}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#121316] rounded-full overflow-hidden relative">
                        <div
                          style={{ width: `${skillProfile.consistency}%` }}
                          className="h-full bg-sky-500 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.5)] animate-fade-in"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs font-mono text-slate-500">
                    Complete your first test to initialize your active skill profile.
                  </div>
                )}
              </div>

              {/* Mode Breakdown */}
              <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                  <h2 className="text-sm font-mono text-slate-300 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                    <span>🎮</span> Practice Mode Breakdown
                  </h2>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                    Lifetime category performance
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {modeBreakdown.map((mode) => (
                    <div
                      key={mode.id}
                      className={`p-3 rounded-xl border font-mono text-[11px] flex flex-col justify-between min-h-[64px] ${
                        mode.count > 0
                          ? "border-charcoal-700 bg-charcoal-900/30 text-white"
                          : "border-charcoal-850 bg-charcoal-900/10 text-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span>{mode.icon}</span>
                        <span className="font-bold truncate" title={mode.label}>{mode.label}</span>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 pt-1 border-t border-charcoal-700/30">
                        <span>{mode.count} {mode.count === 1 ? "run" : "runs"}</span>
                        {mode.count > 0 && (
                          <span className="text-[#3B82F6] font-bold font-mono">
                            {mode.avgWpm}W / {mode.avgAccuracy}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Weak-Key Heatmap Keyboard Visualization */}
            <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-charcoal-700 pb-3">
                <h2 className="text-sm font-mono text-slate-300 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                  <span>⌨️</span> Weak-Key Error Map
                </h2>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                  Target expected keys causing mistakes
                </span>
              </div>

              {history.length < 3 ? (
                <div className="p-8 text-center text-xs font-mono text-slate-500">
                  Complete a few more tests to see your weak-key map
                </div>
              ) : (
                <div className="py-4 space-y-4">
                  <div className="flex flex-col items-center gap-2 font-mono overflow-x-auto pb-2 scrollbar-thin">
                    <div className="min-w-[600px] space-y-2 flex flex-col items-center">
                      {qwertyRows.map((row, rowIdx) => (
                        <div key={rowIdx} className="flex gap-1.5 justify-center w-full">
                          {row.map((key) => {
                            const isSpace = key === "SPACE";
                            const count = keyErrors[key] || 0;
                            const intensity = count / maxErrorCount;

                            const bgStyle = count > 0
                              ? {
                                  backgroundColor: `rgba(59, 130, 246, ${0.1 + intensity * 0.9})`,
                                  borderColor: `rgba(59, 130, 246, ${0.3 + intensity * 0.7})`,
                                  color: `#FFFFFF`,
                                  boxShadow: intensity > 0.5 ? `0 0 10px rgba(59, 130, 246, ${intensity * 0.25})` : "none",
                                }
                              : {
                                  backgroundColor: "rgba(15, 23, 42, 0.4)",
                                  borderColor: "rgba(51, 65, 85, 0.3)",
                                  color: "rgba(148, 163, 184, 0.5)",
                                };

                            return (
                              <div
                                key={key}
                                style={bgStyle}
                                className={`flex flex-col items-center justify-center rounded-lg border font-bold text-[10px] sm:text-xs transition-all duration-200 uppercase relative ${
                                  isSpace ? "w-36 sm:w-56 h-9" : "w-8 h-8 sm:w-10 sm:h-10"
                                }`}
                                title={`${key}: ${count} mistakes`}
                              >
                                <span>{isSpace ? "Spacebar" : key}</span>
                                {count > 0 && (
                                  <span className="absolute bottom-0.5 right-1 text-[8px] font-normal opacity-70">
                                    {count}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 text-[10px] font-mono text-slate-500 w-full max-w-sm mx-auto">
                    <span>Low mistake frequency</span>
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded bg-blue-500/10 border border-blue-500/30" />
                      <div className="w-3 h-3 rounded bg-blue-500/40 border border-blue-500/50" />
                      <div className="w-3 h-3 rounded bg-blue-500/70 border border-blue-500/70" />
                      <div className="w-3 h-3 rounded bg-blue-500/90 border border-blue-500/95 shadow-[0_0_8px_rgba(59,130,246,0.2)]" />
                    </div>
                    <span>High mistake frequency</span>
                  </div>
                </div>
              )}
            </div>

            {/* Difficulty Personal Records (PBs) Segment */}
            <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
              <h2 className="text-sm font-mono text-slate-300 uppercase tracking-widest flex items-center gap-1.5 border-b border-charcoal-700 pb-3 font-bold">
                <span>🏆</span> difficulty personal bests
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {/* Easy PB */}
                <div className="bg-charcoal-900/40 border border-charcoal-700/60 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">
                      Easy
                    </span>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {pbEasy ? `${formatDateShort(pbEasy.timestamp)} • ${pbEasy.accuracy}% acc` : "No completed runs"}
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono">
                    {pbEasy ? pbEasy.wpm : "—"} <span className="text-xs font-normal text-slate-500">WPM</span>
                  </div>
                </div>

                {/* Medium PB */}
                <div className="bg-charcoal-900/40 border border-charcoal-700/60 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-electric-400 uppercase tracking-wider font-bold">
                      Medium
                    </span>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {pbMedium ? `${formatDateShort(pbMedium.timestamp)} • ${pbMedium.accuracy}% acc` : "No completed runs"}
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono">
                    {pbMedium ? pbMedium.wpm : "—"} <span className="text-xs font-normal text-slate-500">WPM</span>
                  </div>
                </div>

                {/* Hard PB */}
                <div className="bg-charcoal-900/40 border border-charcoal-700/60 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold">
                      Hard
                    </span>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {pbHard ? `${formatDateShort(pbHard.timestamp)} • ${pbHard.accuracy}% acc` : "No completed runs"}
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono">
                    {pbHard ? pbHard.wpm : "—"} <span className="text-xs font-normal text-slate-500">WPM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Over Time Chart Section */}
            {chartData.length >= 2 && (
              <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-charcoal-700 pb-3">
                  <h2 className="text-sm font-mono text-slate-300 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                    <span>📈</span> typing speed progression (WPM)
                  </h2>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                    showing last {chartData.length} tests
                  </span>
                </div>
                <div className="py-2">
                  {svgChart}
                </div>
              </div>
            )}

            {/* Unlocked Achievements & Milestone Timeline Section */}
            {gamification && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Achievements (8/12 span) */}
                <div className="lg:col-span-8 bg-charcoal-800 border border-charcoal-700 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-charcoal-700 pb-3">
                    <h2 className="text-sm font-mono text-slate-300 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                      <span>🏆</span> Unlockable Achievements
                    </h2>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                      {gamification.unlockedAchievements.length} / {ACHIEVEMENTS.length} Unlocked
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {ACHIEVEMENTS.map((badge) => {
                      const isUnlocked = gamification.unlockedAchievements.includes(badge.id);
                      const unlockTimestamp = gamification.achievementUnlockDates[badge.id];

                      return (
                        <div
                          key={badge.id}
                          className={`p-4 rounded-xl border flex gap-3.5 transition-all duration-300 relative group select-none ${
                            isUnlocked
                              ? "border-[#3B82F6]/30 bg-electric-500/[0.03] text-white shadow-[0_0_12px_rgba(59,130,246,0.03)] card-hover-lift"
                              : "border-charcoal-700/50 bg-charcoal-900/10 text-slate-500"
                          }`}
                        >
                          {/* Custom visual vector indicator based on achievement ID */}
                          <div className={`w-11 h-11 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
                            isUnlocked
                              ? "border-[#3B82F6]/40 bg-[#3B82F6]/10 text-[#3B82F6]"
                              : "border-charcoal-700 bg-charcoal-800/40 text-slate-600"
                          }`}>
                            {badge.id === "speed_demon" ? (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            ) : badge.id === "perfect_accuracy" ? (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : badge.id === "seven_day_streak" ? (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                              </svg>
                            ) : badge.id === "code_warrior" ? (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                              </svg>
                            ) : badge.id === "knowledge_master" ? (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            ) : badge.id === "goal_crusher" ? (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                            ) : badge.id === "trend_setter" ? (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                            )}
                          </div>

                          {/* Description block */}
                          <div className="flex-grow space-y-1">
                            <h4 className={`text-xs font-bold font-sans tracking-wide uppercase transition-colors ${
                              isUnlocked ? "text-white" : "text-slate-500"
                            }`}>
                              {badge.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 leading-normal font-sans">
                              {badge.description}
                            </p>
                            {isUnlocked && unlockTimestamp && (
                              <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase block pt-0.5">
                                Unlocked: {formatDateShort(unlockTimestamp)}
                              </span>
                            )}
                          </div>

                          {/* Top-right lock/unlock overlay badge */}
                          <div className="absolute top-3 right-3">
                            {isUnlocked ? (
                              <span className="text-[9px] font-mono text-[#3B82F6]/80 font-bold tracking-widest uppercase">
                                UNLOCKED
                              </span>
                            ) : (
                              <div className="text-slate-600 flex items-center" title={badge.condition}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Milestone Timeline (4/12 span) */}
                <div className="lg:col-span-4 bg-charcoal-800 border border-charcoal-700 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-charcoal-700 pb-3">
                    <h2 className="text-sm font-mono text-slate-300 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                      <span>🗺️</span> Journey Timeline
                    </h2>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                      Key milestones
                    </span>
                  </div>

                  <div className="flex-grow overflow-y-auto max-h-[380px] pr-1.5 space-y-4 scrollbar-thin scrollbar-thumb-charcoal-700 scrollbar-track-transparent">
                    {milestones.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center p-8 text-xs font-mono text-slate-500 italic">
                        Your milestones will appear here chronologically as you complete speed typing tests.
                      </div>
                    ) : (
                      <div className="relative border-l border-charcoal-700/60 pl-4 ml-2.5 space-y-6">
                        {milestones.map((milestone) => (
                          <div key={milestone.id} className="relative animate-fade-in">
                            {/* Dot indicator */}
                            <span className="absolute -left-[27px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-charcoal-900 border border-charcoal-700 text-[10px] select-none">
                              {milestone.icon}
                            </span>
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">
                                {formatDateShort(milestone.timestamp)}
                              </span>
                              <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                                {milestone.title}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-sans leading-normal">
                                {milestone.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* History Table Log */}
            <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-charcoal-700 flex justify-between items-center bg-charcoal-900/10">
                <h2 className="text-sm font-mono text-slate-300 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                  <span>⏱️</span> chronological test log
                </h2>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                  Total logged: {history.length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-charcoal-700 bg-charcoal-900/30 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                      <th className="py-3 px-6 w-20">Index</th>
                      <th className="py-3 px-6">Date &amp; Time</th>
                      <th className="py-3 px-6 text-center w-24">WPM</th>
                      <th className="py-3 px-6 text-center w-28">Accuracy</th>
                      <th className="py-3 px-6 text-center w-28">Consistency</th>
                      <th className="py-3 px-6 text-center w-28">Difficulty</th>
                      <th className="py-3 px-6 text-center w-28">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-charcoal-700/40 text-sm">
                    {history.map((item, idx) => {
                      const numberIndex = history.length - idx;
                      return (
                        <tr key={item.id} className="hover:bg-charcoal-900/10 transition-colors">
                          {/* Index */}
                          <td className="py-3 px-6 font-mono text-xs text-slate-500 font-bold">
                            #{numberIndex.toString().padStart(2, "0")}
                          </td>

                          {/* Date and Time */}
                          <td className="py-3 px-6 font-mono text-slate-300 whitespace-nowrap">
                            {formatDateLong(item.timestamp)}
                          </td>

                          {/* WPM */}
                          <td className="py-3 px-6 text-center font-mono font-extrabold text-white text-base">
                            {item.wpm}
                          </td>

                          {/* Accuracy */}
                          <td className="py-3 px-6 text-center font-mono font-bold text-emerald-400">
                            {item.accuracy}%
                          </td>

                          {/* Consistency */}
                          <td className="py-3 px-6 text-center font-mono font-bold text-sky-400">
                            {typeof item.consistency === "number" ? `${item.consistency}%` : "—"}
                          </td>

                          {/* Difficulty */}
                          <td className="py-3 px-6 text-center">
                            {item.modeType === "time" ? (
                              <span className="inline-block text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border text-cyan-400 bg-cyan-500/5 border-cyan-500/20 font-mono">
                                ⏱️ Time: {item.modeDuration || item.timeTaken}s
                              </span>
                            ) : item.modeType === "words" ? (
                              <span className="inline-block text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border text-purple-400 bg-purple-500/5 border-purple-500/20 font-mono">
                                ✍️ Words: {item.modeWordCount || 25}
                              </span>
                            ) : (
                              <span
                                className={`inline-block text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border font-mono ${
                                  item.difficulty === "easy"
                                    ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/20"
                                    : item.difficulty === "medium"
                                    ? "text-electric-400 bg-electric-500/5 border-electric-500/20"
                                    : item.difficulty === "hard"
                                    ? "text-rose-400 bg-rose-500/5 border-rose-500/20"
                                    : "text-sky-400 bg-sky-500/5 border-sky-500/20"
                                }`}
                              >
                                {item.difficulty}
                              </span>
                            )}
                          </td>

                          {/* Duration */}
                          <td className="py-3 px-6 text-center font-mono text-xs text-slate-400">
                            {item.timeTaken}s
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
