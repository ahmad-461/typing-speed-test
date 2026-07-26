"use client";

import { useEffect, useState, useMemo } from "react";
import { getHistory, getHistorySummary, getPersonalBest, TestResult, getKeyErrors } from "../../lib/stats";

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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
    setKeyErrors(getKeyErrors());
    setIsLoaded(true);
  }, []);

  const summary = useMemo(() => getHistorySummary(history), [history]);
  const pbOverall = useMemo(() => getPersonalBest(undefined, history), [history]);
  const pbEasy = useMemo(() => getPersonalBest("easy", history), [history]);
  const pbMedium = useMemo(() => getPersonalBest("medium", history), [history]);
  const pbHard = useMemo(() => getPersonalBest("hard", history), [history]);

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

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-electric-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col w-full max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <main className="flex-grow flex flex-col w-full">
        {/* Page Title */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-charcoal-700 bg-charcoal-800 text-xs font-mono text-slate-400 tracking-wider uppercase">
            📊 Personal Dashboard
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-none">
            Your Performance <span className="text-electric-500 bg-gradient-to-r from-electric-400 to-electric-600 bg-clip-text text-transparent">History</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
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
              <h2 className="text-xl font-bold text-white tracking-tight">No Typing History Found</h2>
              <p className="text-sm text-slate-400 font-sans leading-relaxed">
                You haven&apos;t completed any speed typing tests yet on this machine. Take your first test to initialize local tracking metrics and unlock the performance charts.
              </p>
            </div>
          </div>
        ) : (
          /* Main Dashboard View */
          <div className="space-y-8">
            {/* Summary Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {/* Metric 1: Total Tests */}
              <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-5 relative overflow-hidden group">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                  Tests Completed
                </span>
                <div className="text-3xl font-extrabold text-white font-mono leading-none">
                  {summary.totalTests}
                </div>
                <div className="absolute right-3 bottom-3 text-xs opacity-10 font-mono text-electric-400 text-right uppercase">
                  Count
                </div>
              </div>

              {/* Metric 2: Avg WPM */}
              <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-5 relative overflow-hidden group">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                  Average Speed
                </span>
                <div className="text-3xl font-extrabold text-electric-400 font-mono leading-none">
                  {summary.avgWpm} <span className="text-xs font-normal text-slate-500 font-mono">WPM</span>
                </div>
                <div className="absolute right-3 bottom-3 text-xs opacity-10 font-mono text-electric-400 text-right uppercase">
                  Avg
                </div>
              </div>

              {/* Metric 3: Avg Accuracy */}
              <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-5 relative overflow-hidden group">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                  Average Accuracy
                </span>
                <div className="text-3xl font-extrabold text-emerald-400 font-mono leading-none">
                  {summary.avgAccuracy}%
                </div>
                <div className="absolute right-3 bottom-3 text-xs opacity-10 font-mono text-electric-400 text-right uppercase">
                  Acc
                </div>
              </div>

              {/* Metric 4: Avg Consistency */}
              <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-5 relative overflow-hidden group">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                  Avg Consistency
                </span>
                <div className="text-3xl font-extrabold text-sky-400 font-mono leading-none">
                  {summary.avgConsistency}%
                </div>
                <div className="absolute right-3 bottom-3 text-xs opacity-10 font-mono text-electric-400 text-right uppercase">
                  Pace
                </div>
              </div>

              {/* Metric 5: All-time Personal Best */}
              <div className="bg-charcoal-800 border border-electric-500/40 rounded-xl p-5 relative overflow-hidden group shadow-[0_0_12px_rgba(59,130,246,0.05)] col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-electric-400 uppercase tracking-wider block font-semibold">
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
                  <div className="text-[9px] font-mono text-slate-500 mt-1 uppercase">
                    On {pbOverall.difficulty}
                  </div>
                )}
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

              {history.length < 3 ? (
                <div className="p-8 text-center text-xs font-mono text-slate-500">
                  Complete a few more tests to see your weak-key map
                </div>
              ) : (
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
              )}
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
      </main>
    </div>
  );
}
