"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type HistoryEntry = {
  wpm: number;
  accuracy: number;
  difficulty: "easy" | "medium" | "hard";
  date: string;
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tst_history_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Sort by date descending
          const sorted = [...parsed].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setHistory(sorted);
        }
      }
    } catch (e) {
      console.warn("Could not read tst_history_v1 from localStorage:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your entire local typing history?")) {
      localStorage.removeItem("tst_history_v1");
      setHistory([]);
      // Dispatch update event to let the HUD know
      window.dispatchEvent(new Event("tst_history_updated"));
    }
  };

  // Compute stats
  const totalTests = history.length;
  const highWPM = totalTests > 0 ? Math.max(...history.map((h) => h.wpm)) : 0;
  const averageWPM =
    totalTests > 0
      ? Math.round(history.reduce((acc, curr) => acc + curr.wpm, 0) / totalTests)
      : 0;
  const averageAccuracy =
    totalTests > 0
      ? Math.round(
          history.reduce((acc, curr) => acc + curr.accuracy, 0) / totalTests
        )
      : 100;

  // Render hand-crafted SVG progression line chart
  const renderProgressionChart = () => {
    // We only display up to 10 of the oldest tests chronologically to make the line flow left-to-right
    const chartData = [...history]
      .slice(0, 10)
      .reverse();

    if (chartData.length < 2) {
      return (
        <div className="h-48 flex items-center justify-center border border-charcoal-700/60 rounded-xl bg-charcoal-900/40 p-4">
          <span className="text-xs font-mono text-slate-500">
            📊 Complete at least 2 tests to render a progress line chart
          </span>
        </div>
      );
    }

    const width = 500;
    const height = 180;
    const padding = 25;

    const minVal = 0;
    const maxVal = Math.max(...chartData.map((d) => d.wpm), 100) + 10;

    const getX = (index: number) => {
      return padding + (index * (width - padding * 2)) / (chartData.length - 1);
    };

    const getY = (wpmValue: number) => {
      return (
        height -
        padding -
        ((wpmValue - minVal) * (height - padding * 2)) / (maxVal - minVal)
      );
    };

    // Construct path string d
    let pathD = "";
    chartData.forEach((d, i) => {
      const x = getX(i);
      const y = getY(d.wpm);
      if (i === 0) {
        pathD += `M ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
      }
    });

    return (
      <div className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            ⚡ SPEED PROGRESSION CHART (LAST 10 RUNS)
          </span>
          <span className="text-[10px] font-mono text-electric-400">
            Max WPM: {highWPM}
          </span>
        </div>
        <div className="relative w-full overflow-hidden flex justify-center items-center">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full max-w-lg overflow-visible"
          >
            {/* Grid Lines */}
            <line
              x1={padding}
              y1={getY(50)}
              x2={width - padding}
              y2={getY(50)}
              stroke="#23272F"
              strokeDasharray="4 4"
            />
            <line
              x1={padding}
              y1={getY(100)}
              x2={width - padding}
              y2={getY(100)}
              stroke="#23272F"
              strokeDasharray="4 4"
            />
            <text
              x={padding - 5}
              y={getY(50) + 4}
              fill="#4D5668"
              fontSize="8"
              fontFamily="var(--font-jetbrains)"
              textAnchor="end"
            >
              50
            </text>
            <text
              x={padding - 5}
              y={getY(100) + 4}
              fill="#4D5668"
              fontSize="8"
              fontFamily="var(--font-jetbrains)"
              textAnchor="end"
            >
              100
            </text>

            {/* Glowing Gradient definition using HEX only */}
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Closed area under line for smooth gradient glow */}
            {chartData.length > 0 && (
              <path
                d={`${pathD} L ${getX(chartData.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`}
                fill="url(#chartGradient)"
              />
            )}

            {/* Line Path with smooth CSS draw-in transition */}
            <path
              d={pathD}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-draw"
              style={{
                strokeDasharray: 1000,
                strokeDashoffset: 1000,
                animation: "draw 1.8s ease-out forwards",
              }}
            />

            {/* Data Points */}
            {chartData.map((d, i) => (
              <g key={i}>
                <circle
                  cx={getX(i)}
                  cy={getY(d.wpm)}
                  r="3.5"
                  fill="#16181C"
                  stroke="#3B82F6"
                  strokeWidth="2"
                  className="transition-all hover:scale-150 cursor-pointer"
                />
                {/* Score hover tags */}
                <text
                  x={getX(i)}
                  y={getY(d.wpm) - 8}
                  fill="#94A3B8"
                  fontSize="7"
                  fontFamily="var(--font-jetbrains)"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {d.wpm}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <main className="flex-grow flex flex-col items-center justify-start px-4 py-8 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full animate-fade-in">

      {/* Secondary Inner-Page Header */}
      <div className="w-full flex items-center justify-between mb-8 pb-4 border-b border-charcoal-700/60">
        <Link
          href="/"
          className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal-800 border border-charcoal-700 hover-glow-electric"
        >
          ← Home
        </Link>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          📊 personal speed history & metrics
        </span>
      </div>

      {/* Main Intro */}
      <div className="text-center space-y-3 mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-none">
          Your Typing <span className="text-electric-500 bg-gradient-to-r from-electric-400 to-electric-600 bg-clip-text text-transparent">History</span>
        </h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto font-sans leading-relaxed">
          Track your WPM progression over time, review past tests, and analyze your keyboard metrics.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center flex flex-col items-center justify-center gap-3 w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-electric-500"></div>
          <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
            Loading metrics...
          </p>
        </div>
      ) : history.length === 0 ? (
        <div className="w-full bg-charcoal-800 border border-charcoal-700 rounded-2xl p-12 text-center space-y-6 max-w-xl mx-auto">
          <div className="text-slate-400 text-sm font-mono">
            &gt;_ no_history_found
          </div>
          <p className="text-slate-400 text-sm">
            It looks like you haven&apos;t taken any speed tests on this device yet.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-electric-500 hover:bg-electric-400 text-white font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-all shadow-md shadow-electric-500/10 hover-glow-electric"
          >
            Start First Speed Test ⚡
          </Link>
        </div>
      ) : (
        <div className="w-full space-y-8">

          {/* Key Stat Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {/* High WPM */}
            <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-4 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Personal Best
              </span>
              <div className="text-3xl font-extrabold text-white font-mono">
                {highWPM}
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">MAX WPM</span>
            </div>

            {/* Average WPM */}
            <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-4 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Average WPM
              </span>
              <div className="text-3xl font-extrabold text-electric-400 font-mono">
                {averageWPM}
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">NET SPEED</span>
            </div>

            {/* Average Accuracy */}
            <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-4 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Avg Accuracy
              </span>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                {averageAccuracy}%
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">PRECISION</span>
            </div>

            {/* Total Run Count */}
            <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-4 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Tests Taken
              </span>
              <div className="text-3xl font-extrabold text-slate-300 font-mono">
                {totalTests}
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">TOTAL RUNS</span>
            </div>

          </div>

          {/* Line Chart */}
          {renderProgressionChart()}

          {/* History List */}
          <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
            <div className="h-1 w-full bg-gradient-to-r from-electric-500 to-sky-500" />
            <div className="p-4 sm:p-5 border-b border-charcoal-700 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                📋 DETAILED RUN LOGS
              </span>
              <button
                onClick={handleClearHistory}
                className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 border border-rose-900/50 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-colors focus:outline-none"
              >
                Clear Logs 🗑️
              </button>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-charcoal-700 bg-charcoal-900/40 text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    <th className="py-3 px-4 sm:px-6 w-16 text-center">No.</th>
                    <th className="py-3 px-4">Speed (WPM)</th>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4 pr-6 sm:pr-8 text-right">Completion Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-700/50">
                  {history.map((item, index) => {
                    const originalIdx = history.length - index;
                    return (
                      <tr
                        key={index}
                        className="transition-colors hover:bg-charcoal-900/10"
                      >
                        <td className="py-3 px-4 sm:px-6 text-center font-mono text-slate-500 font-bold text-xs">
                          #{originalIdx}
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-white text-sm sm:text-base">
                          {item.wpm} <span className="text-[10px] font-normal text-slate-500">WPM</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-xs sm:text-sm">
                          {item.accuracy}%
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                              item.difficulty === "easy"
                                ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/20"
                                : item.difficulty === "medium"
                                ? "text-electric-400 bg-electric-500/5 border-electric-500/20"
                                : "text-rose-400 bg-rose-500/5 border-rose-500/20"
                            }`}
                          >
                            {item.difficulty}
                          </span>
                        </td>
                        <td className="py-3 px-4 pr-6 sm:pr-8 text-right font-mono text-[10px] sm:text-xs text-slate-400">
                          {new Date(item.date).toLocaleString()}
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

      {/* Helpful Hint */}
      <p className="text-center text-xs text-slate-500 font-mono mt-8 max-w-md leading-relaxed">
        💡 Your local speed history is securely persisted inside your browser sandbox under standard storage protocols.
      </p>

    </main>
  );
}
