"use client";

import { useEffect, useState, useMemo } from "react";
import { getHistory, getHistorySummary, getPersonalBest, TestResult, getKeyErrors } from "../../lib/stats";
import { getGamificationState, ACHIEVEMENTS, GamificationState } from "../../lib/gamification";

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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
    setKeyErrors(getKeyErrors());
    setGamification(getGamificationState());
    setIsLoaded(true);
  }, []);

  const summary = useMemo(() => getHistorySummary(history), [history]);
  const pbOverall = useMemo(() => getPersonalBest(undefined, history), [history]);
  const pbEasy = useMemo(() => getPersonalBest("easy", history), [history]);
  const pbMedium = useMemo(() => getPersonalBest("medium", history), [history]);
  const pbHard = useMemo(() => getPersonalBest("hard", history), [history]);

  // Mode breakdown stats calculations
  const modeBreakdown = useMemo(() => {
    const modesList: { value: string; label: string; icon: string }[] = [
      { value: "code_arena", label: "Code Arena", icon: "💻" },
      { value: "knowledge_quest", label: "Knowledge Quest", icon: "🧠" },
      { value: "ai_lab", label: "AI Lab", icon: "🤖" },
      { value: "world_explorer", label: "World Explorer", icon: "🌍" },
      { value: "speed_sprint", label: "Speed Sprint", icon: "⚡" },
      { value: "weak_key_drill", label: "Weak-Key Drill", icon: "🎯" },
    ];

    return modesList.map((m) => {
      // Support legacy category naming mapping as well
      const runs = history.filter((r) => {
        if (m.value === "code_arena") return r.category === "code_arena" || r.category === "programming";
        if (m.value === "knowledge_quest") return r.category === "knowledge_quest" || r.category === "general_knowledge";
        return r.category === m.value;
      });

      const count = runs.length;
      const averageWPM = count > 0 ? Math.round(runs.reduce((sum, r) => sum + r.wpm, 0) / count) : 0;

      return {
        ...m,
        count,
        averageWPM,
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
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.00" />
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
              stroke="#3B82F6"
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
                className="fill-slate-500 font-mono text-[9px] uppercase tracking-wider"
              >
                {formatDateShort(p.data.timestamp)}
              </text>
            );
          })}
        </svg>
      </div>
    );
  }, [chartData]);

  // Calculate locked achievements details
  const lockedAchievementsDetails = useMemo(() => {
    if (!gamification) return [];

    const currentStreak = gamification.streakDays || 0;
    const codeArenaCount = history.filter((r) => r.category === "code_arena" || r.category === "programming").length;
    const knowledgeQuestCount = history.filter((r) => r.category === "knowledge_quest" || r.category === "general_knowledge").length;
    const totalTests = history.length;
    const maxWpm = history.length > 0 ? Math.max(...history.map((r) => r.wpm), 0) : 0;
    const hasPerfect = history.some((r) => r.accuracy === 100);

    return ACHIEVEMENTS.map((badge) => {
      const isUnlocked = gamification.unlockedAchievements.includes(badge.id);
      let progressString = "";
      let percentage = 0;

      if (badge.id === "speed_demon") {
        progressString = `Best: ${maxWpm} / 80 WPM`;
        percentage = Math.min(100, Math.round((maxWpm / 80) * 100));
      } else if (badge.id === "perfect_accuracy") {
        progressString = hasPerfect ? "Achieved" : "Not yet achieved (100% required)";
        percentage = hasPerfect ? 100 : 0;
      } else if (badge.id === "seven_day_streak") {
        progressString = `Streak: ${currentStreak} / 7 days`;
        percentage = Math.min(100, Math.round((currentStreak / 7) * 100));
      } else if (badge.id === "code_warrior") {
        progressString = `Completed: ${codeArenaCount} / 10 tests`;
        percentage = Math.min(100, Math.round((codeArenaCount / 10) * 100));
      } else if (badge.id === "knowledge_master") {
        progressString = `Completed: ${knowledgeQuestCount} / 10 tests`;
        percentage = Math.min(100, Math.round((knowledgeQuestCount / 10) * 100));
      } else if (badge.id === "typing_legend_badge") {
        progressString = `Completed: ${totalTests} / 100 tests`;
        percentage = Math.min(100, Math.round((totalTests / 100) * 100));
      }

      return {
        ...badge,
        isUnlocked,
        progressString,
        percentage,
        unlockTimestamp: gamification.achievementUnlockDates[badge.id] || null,
      };
    });
  }, [gamification, history]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-electric-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col w-full max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 animate-fade-in space-y-8">

      {/* BRAND NEW RECRUIT PLAYER CARD SUMMARY (Top profile header) */}
      <div className="bg-charcoal-800 border-2 border-charcoal-700 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-electric-500 via-sky-500 to-emerald-500" />

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl border-2 border-electric-500/40 bg-electric-500/10 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            {history.length > 0 ? "⚡" : "🔰"}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold text-electric-400 bg-electric-500/10 px-2 py-0.5 rounded border border-electric-500/20 uppercase tracking-widest">
                PLAYER RECORD SHEET
              </span>
              {history.length === 0 && (
                <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest">
                  NEW RECRUIT
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
              {gamification ? `${gamification.levelTitle} : Level ${gamification.currentLevel}` : "Beginner : Level 1"}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              STATUS: {history.length > 0 ? `COMMITTED ${history.length} TESTS` : "INITIALIZING SYSTEMS"}
            </p>
          </div>
        </div>

        {/* Profile metrics panel inside Player card */}
        <div className="w-full md:w-auto grid grid-cols-3 gap-3 md:flex md:items-center">
          <div className="bg-charcoal-900/50 border border-charcoal-700/60 rounded-xl px-4 py-2 text-center min-w-[80px]">
            <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider mb-0.5">Tests</span>
            <span className="text-base font-extrabold text-white font-mono leading-none">{history.length}</span>
          </div>
          <div className="bg-charcoal-900/50 border border-charcoal-700/60 rounded-xl px-4 py-2 text-center min-w-[80px]">
            <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider mb-0.5">Streak</span>
            <span className="text-base font-extrabold text-amber-500 font-mono leading-none flex items-center justify-center gap-1">
              <span>🔥</span>
              <span>{gamification ? gamification.streakDays : 0}</span>
            </span>
          </div>
          <div className="bg-charcoal-900/50 border border-charcoal-700/60 rounded-xl px-4 py-2 text-center min-w-[80px]">
            <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider mb-0.5">Total XP</span>
            <span className="text-base font-extrabold text-sky-400 font-mono leading-none">{gamification ? gamification.totalXp.toLocaleString() : 0}</span>
          </div>
        </div>
      </div>

      {/* Retroactive XP bar wrapper within player card structure */}
      {gamification && gamification.nextLevelXp && (
        <div className="w-full bg-charcoal-800 border border-charcoal-700 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3">
          <div className="flex justify-between items-baseline text-xs font-mono text-slate-400">
            <span>LEVEL PROGRESSION TRACKING</span>
            <span>{gamification.nextLevelXp - gamification.totalXp} XP TO LEVEL UP</span>
          </div>
          <div className="w-full h-3 bg-charcoal-900 rounded-full border border-charcoal-750 overflow-hidden relative">
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
              className="h-full bg-gradient-to-r from-electric-500 to-sky-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(59,130,246,0.4)]"
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
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

      {history.length === 0 ? (
        /* Empty State for first-time users */
        <div className="w-full bg-charcoal-800 border border-charcoal-700 rounded-2xl p-12 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-electric-500/5 border border-electric-500/20 flex items-center justify-center mx-auto text-3xl">
            ⌨️
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">No Typing History Logged</h2>
            <p className="text-sm text-slate-400 font-sans leading-relaxed max-w-md mx-auto">
              Welcome recruit! Initialize your local metrics by completing your first typing test mission. Once complete, your speed progression trends, weak-key heatmap, and achievements will unlock.
            </p>
          </div>
        </div>
      ) : (
        /* Main Dashboard Content elements */
        <div className="space-y-8">

          {/* Summary Stats Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-5 relative overflow-hidden group">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                Average Speed
              </span>
              <div className="text-2xl font-extrabold text-electric-400 font-mono leading-none">
                {summary.avgWpm} <span className="text-xs font-normal text-slate-500 font-mono">WPM</span>
              </div>
            </div>

            <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-5 relative overflow-hidden group">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                Average Accuracy
              </span>
              <div className="text-2xl font-extrabold text-emerald-400 font-mono leading-none">
                {summary.avgAccuracy}%
              </div>
            </div>

            <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-5 relative overflow-hidden group">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                Avg Consistency
              </span>
              <div className="text-2xl font-extrabold text-sky-400 font-mono leading-none">
                {summary.avgConsistency}%
              </div>
            </div>

            <div className="bg-charcoal-800 border border-electric-500/30 rounded-xl p-5 relative overflow-hidden group shadow-[0_0_12px_rgba(59,130,246,0.03)]">
              <span className="text-[10px] font-mono text-electric-400 uppercase tracking-wider block font-semibold mb-1">
                All-time Best
              </span>
              <div className="text-2xl font-extrabold text-white font-mono leading-none">
                {pbOverall ? pbOverall.wpm : 0} <span className="text-xs font-normal text-slate-500 font-mono">WPM</span>
              </div>
            </div>
          </div>

          {/* MODE BREAKDOWN SECTION */}
          <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-charcoal-700 pb-3">
              <h2 className="text-sm font-mono text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <span>📊</span> Mode Performance Breakdown
              </h2>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                6 operational practice vectors
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-1">
              {modeBreakdown.map((item) => (
                <div key={item.value} className="bg-charcoal-900/50 border border-charcoal-750 rounded-xl p-4 flex flex-col justify-between h-[110px] transition-all hover:border-charcoal-600">
                  <div className="flex items-center justify-between">
                    <span className="text-xl leading-none">{item.icon}</span>
                    <span className="text-[9px] font-mono text-slate-500 bg-charcoal-850 px-1.5 py-0.5 rounded border border-charcoal-750 uppercase">
                      {item.count} {item.count === 1 ? "run" : "runs"}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-400 block uppercase truncate">
                      {item.label}
                    </span>
                    <div className="text-lg font-black text-white font-mono leading-none">
                      {item.averageWPM > 0 ? `${item.averageWPM}` : "—"}
                      {item.averageWPM > 0 && <span className="text-[10px] font-normal text-slate-500 font-mono ml-0.5">WPM</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CELEBRATORY UNLOCKED ACHIEVEMENTS OVERHAUL */}
          <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl p-6 shadow-xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-charcoal-700 pb-3">
              <h2 className="text-sm font-mono text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <span>🏆</span> Unlockable Player Badges
              </h2>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {gamification ? gamification.unlockedAchievements.length : 0} / {ACHIEVEMENTS.length} Unlocked
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 pt-2">
              {lockedAchievementsDetails.map((badge) => {
                const isUnlocked = badge.isUnlocked;

                return (
                  <div
                    key={badge.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all duration-300 relative group select-none min-h-[160px] ${
                      isUnlocked
                        ? "border-[#3B82F6]/40 bg-electric-500/[0.04] text-white shadow-[0_0_20px_rgba(59,130,246,0.06)] scale-[1.01]"
                        : "border-charcoal-700/50 bg-charcoal-900/10 text-slate-500 opacity-70"
                    }`}
                  >
                    <div className="flex gap-3 items-start justify-between">
                      {/* Custom visual vector indicator based on achievement ID */}
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all ${
                        isUnlocked
                          ? "border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#3B82F6] shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                          : "border-charcoal-700 bg-charcoal-800/40 text-slate-600"
                      }`}>
                        {badge.id === "speed_demon" ? (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        ) : badge.id === "perfect_accuracy" ? (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : badge.id === "seven_day_streak" ? (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                          </svg>
                        ) : badge.id === "code_warrior" ? (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                        ) : badge.id === "knowledge_master" ? (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        )}
                      </div>

                      {/* Locked/Unlocked status text overlay */}
                      <div className="text-right">
                        {isUnlocked ? (
                          <span className="text-[9px] font-mono text-[#3B82F6] font-bold tracking-widest uppercase bg-[#3B82F6]/10 px-2 py-0.5 rounded border border-[#3B82F6]/20">
                            UNLOCKED
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-slate-500 font-bold tracking-widest uppercase bg-charcoal-900 px-2 py-0.5 rounded border border-charcoal-700 flex items-center gap-1">
                            🔒 LOCKED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description text */}
                    <div className="space-y-1">
                      <h4 className={`text-xs font-extrabold font-sans tracking-wide uppercase transition-colors ${
                        isUnlocked ? "text-white" : "text-slate-500"
                      }`}>
                        {badge.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 leading-normal font-sans">
                        {badge.description}
                      </p>
                    </div>

                    {/* Progress tracking display */}
                    <div className="border-t border-charcoal-750/50 pt-2 flex flex-col gap-1 z-10 font-mono text-[9px] uppercase">
                      <div className="flex justify-between text-slate-400">
                        <span>Progress Criteria</span>
                        <span>{badge.percentage}%</span>
                      </div>
                      <div className="w-full h-1 bg-charcoal-900 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${badge.percentage}%` }}
                          className={`h-full rounded-full ${isUnlocked ? "bg-electric-500" : "bg-charcoal-700"}`}
                        />
                      </div>
                      <span className="text-slate-500 mt-0.5 block tracking-wide truncate">
                        {isUnlocked && badge.unlockTimestamp
                          ? `Unlocked on ${formatDateShort(badge.unlockTimestamp)}`
                          : badge.progressString}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weak-Key Heatmap Keyboard Visualization */}
          <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-charcoal-700 pb-3">
              <h2 className="text-sm font-mono text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <span>⌨️</span> Weak-Key Error Map
              </h2>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Target expected keys causing mistakes
              </span>
            </div>

            <div className="py-4 space-y-4">
              <div className="flex flex-col items-center gap-2 font-mono">
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
          </div>

          {/* Difficulty Personal Records (PBs) Segment */}
          <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-mono text-slate-300 uppercase tracking-widest flex items-center gap-1.5 border-b border-charcoal-700 pb-3">
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
            <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-charcoal-700 pb-3">
                <h2 className="text-sm font-mono text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <span>📈</span> typing speed progression (WPM)
                </h2>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  showing last {chartData.length} tests
                </span>
              </div>
              <div className="py-2">
                {svgChart}
              </div>
            </div>
          )}

          {/* History Table Log */}
          <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-charcoal-700 flex justify-between items-center bg-charcoal-900/10">
              <h2 className="text-sm font-mono text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <span>⏱️</span> chronological test log
              </h2>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
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
                          <span
                            className={`inline-block text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
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
    </div>
  );
}
