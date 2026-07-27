"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type ScoreEntry = {
  id: string;
  name: string;
  wpm: number;
  accuracy: number;
  difficulty: "easy" | "medium" | "hard" | "custom";
  created_at: string;
};

type DifficultyFilter = "all" | "easy" | "medium" | "hard";

function formatTimeLog(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "00:00:00";
  return d.toTimeString().split(" ")[0];
}

function LeaderboardContent() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [filter, setFilter] = useState<DifficultyFilter>("all");
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPlayerName, setCurrentPlayerName] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tst_player_name") || "";
      setCurrentPlayerName(stored);
    }
  }, []);

  const fetchScores = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let fetched: ScoreEntry[] = [];
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");
      let hasDbFetchError = false;

      if (!isPlaceholder) {
        try {
          let query = supabase
            .from("scores")
            .select("id, name, wpm, accuracy, difficulty, created_at")
            .order("wpm", { ascending: false })
            .order("accuracy", { ascending: false })
            .order("created_at", { ascending: true })
            .limit(Math.min(pageSize, 50));

          if (filter !== "all") {
            query = query.eq("difficulty", filter);
          }

          const { data, error: queryError } = await query;
          if (queryError) {
            throw queryError;
          }
          fetched = (data as ScoreEntry[]) || [];
        } catch (dbErr) {
          console.warn("Supabase fetch failed, relying on local scores fallback:", dbErr);
          hasDbFetchError = true;
        }
      }

      // Load local scores from localStorage
      let local: ScoreEntry[] = [];
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("tst_local_scores_v1");
          if (stored) {
            local = JSON.parse(stored) as ScoreEntry[];
          }
        } catch (e) {
          console.error("Error reading tst_local_scores_v1:", e);
        }
      }

      // Filter local scores by difficulty filter if selected
      if (filter !== "all") {
        local = local.filter((s) => s.difficulty === filter);
      }

      // Merge fetched and local scores, de-duplicating by ID
      const seenIds = new Set<string>();
      const merged: ScoreEntry[] = [];

      for (const score of [...fetched, ...local]) {
        if (!seenIds.has(score.id)) {
          seenIds.add(score.id);
          merged.push(score);
        }
      }

      // Sort merged standings by WPM (descending), then Accuracy (descending), then Date (ascending)
      merged.sort((a, b) => {
        if (b.wpm !== a.wpm) {
          return b.wpm - a.wpm;
        }
        if (b.accuracy !== a.accuracy) {
          return b.accuracy - a.accuracy;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      // If we had a database fetch error and we have no local scores either, then raise the error
      if (hasDbFetchError && merged.length === 0) {
        throw new Error("Unable to connect to database");
      }

      // Limit to current page size (max 50)
      const finalized = merged.slice(0, Math.min(pageSize, 50));
      setScores(finalized);
    } catch (err: unknown) {
      console.error("Failed to fetch leaderboard scores:", err);
      setError("Failed to load leaderboard data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [filter, pageSize]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  // Reset page size back to initial 20 and clear scores when filter changes
  const handleFilterChange = (newFilter: DifficultyFilter) => {
    setScores([]);
    setFilter(newFilter);
    setPageSize(20);
  };

  const handleLoadMore = () => {
    // Increase limit up to 50
    setPageSize((prev) => Math.min(prev + 15, 50));
  };

  const hasMore = scores.length === pageSize && scores.length < 50;

  // Separate top 3 entries for podium
  const top3 = scores.slice(0, 3);
  // Rearrange top 3 for horizontal center-weighted podium: [Rank 2, Rank 1, Rank 3]
  const podiumEntries = (() => {
    const arranged: (ScoreEntry | null)[] = [null, null, null];
    top3.forEach((score, index) => {
      if (index === 0) arranged[1] = score; // Rank 1 center
      else if (index === 1) arranged[0] = score; // Rank 2 left
      else if (index === 2) arranged[2] = score; // Rank 3 right
    });
    return arranged;
  })();

  const terminalLogEntries = scores.slice(3);

  return (
    <main className="flex-grow flex flex-col items-center justify-start px-4 py-8 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full animate-fade-in">
      {/* Navigation Header */}
      <div className="w-full flex items-center justify-between mb-8 pb-4 border-b border-charcoal-700/60">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal-800 border border-charcoal-700 hover-glow-electric"
          >
            ← Home
          </Link>
          <Link
            href="/history"
            className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal-800 border border-charcoal-700 hover-glow-electric"
          >
            History ⏳
          </Link>
        </div>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest hidden sm:inline-block">
          🏆 global speed typing standings
        </span>
      </div>

      {/* Header Info */}
      <div className="text-center space-y-3 mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-none">
          Global <span className="text-electric-500 bg-gradient-to-r from-electric-400 to-electric-600 bg-clip-text text-transparent">Leaderboard</span>
        </h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          The ultimate typist standings. Compete with the fastest fingers in the world.
        </p>
      </div>

      {/* Difficulty Filter Tabs */}
      <div className="w-full flex justify-center mb-10">
        <div className="flex bg-charcoal-800 p-1 rounded-xl border border-charcoal-700 max-w-md w-full shadow-lg">
          {(["all", "easy", "medium", "hard"] as DifficultyFilter[]).map((tab) => {
            const isActive = filter === tab;
            return (
              <button
                key={tab}
                onClick={() => handleFilterChange(tab)}
                className={`flex-1 text-center py-2 text-xs font-mono font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-electric-500 ${
                  isActive
                    ? "bg-electric-500 text-white shadow-md shadow-electric-500/15"
                    : "text-slate-400 hover:text-white hover:bg-charcoal-900/40"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className="w-full bg-charcoal-800 border border-charcoal-700 rounded-2xl p-12 text-center space-y-4 font-mono shadow-2xl">
          <div className="text-rose-500 text-sm font-bold uppercase tracking-wider">
            &gt;_ error: fetch_failed
          </div>
          <p className="text-slate-400 text-xs">Couldn&apos;t load leaderboard — try again</p>
          <button
            onClick={fetchScores}
            className="px-5 py-2 rounded-lg bg-charcoal-700 hover:bg-charcoal-600 text-slate-200 border border-charcoal-600 text-xs font-bold transition-all hover-glow-electric focus:outline-none focus:ring-1 focus:ring-electric-500 cursor-pointer"
          >
            Retry Connection 🔄
          </button>
        </div>
      ) : loading && scores.length === 0 ? (
        <div className="w-full bg-charcoal-800 border border-charcoal-700 rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-3 shadow-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-electric-500"></div>
          <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
            Fetching rankings...
          </p>
        </div>
      ) : scores.length === 0 ? (
        <div className="w-full bg-charcoal-800 border border-charcoal-700 rounded-2xl p-16 text-center space-y-4 font-mono shadow-2xl">
          <div className="text-slate-400 text-sm">No scores submitted yet for this difficulty tier.</div>
          <p className="text-xs text-slate-500">Be the very first typist to secure a legendary spot!</p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-electric-500 text-white text-xs font-bold rounded-lg hover-glow-electric transition-colors cursor-pointer"
          >
            Start Typing Test Now ⚡
          </Link>
        </div>
      ) : (
        <div className="w-full space-y-12">

          {/* HORIZONTAL CENTER-WEIGHTED PODIUM SECTION */}
          <div className="grid grid-cols-3 gap-4 items-end max-w-2xl mx-auto w-full pt-6">
            {podiumEntries.map((score, idx) => {
              const rank = idx === 1 ? 1 : idx === 0 ? 2 : 3;

              if (!score) {
                return (
                  <div key={`empty-podium-${rank}`} className="flex flex-col items-center">
                    <div className="font-mono text-[10px] text-slate-600 uppercase tracking-widest mb-2">
                      Rank {rank}
                    </div>
                    <div className={`w-full bg-charcoal-850 border border-dashed border-charcoal-700 rounded-t-2xl flex flex-col items-center justify-center ${
                      rank === 1 ? "h-48" : rank === 2 ? "h-36" : "h-32"
                    }`}>
                      <span className="text-slate-700 font-mono text-xs">VOID</span>
                    </div>
                  </div>
                );
              }

              const isMe = currentPlayerName && score.name.toLowerCase() === currentPlayerName.toLowerCase();
              const heightClass = rank === 1 ? "h-56 sm:h-64" : rank === 2 ? "h-40 sm:h-48" : "h-36 sm:h-44";
              const borderStyles = rank === 1
                ? "border-electric-500 bg-electric-500/[0.03] shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                : "border-charcoal-700 bg-charcoal-800/40";

              return (
                <div key={score.id} className="flex flex-col items-center animate-slide-up-fade" style={{ animationDelay: `${rank * 80}ms` }}>
                  {/* Top Crown/Medal Badge */}
                  <div className="mb-3 flex flex-col items-center text-center">
                    {rank === 1 ? (
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-electric-500/10 border border-electric-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)] relative">
                        <svg className="w-5 h-5 text-electric-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M5 16L3 5L8.5 10L12 3L15.5 10L21 5L19 16H5ZM19 18H5V20H19V18Z"/>
                        </svg>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-charcoal-800 border border-charcoal-700">
                        <svg className={`w-4 h-4 ${rank === 2 ? "text-slate-300" : "text-amber-700"}`} viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                          <path d="M9 13L7 21L12 18.5L17 21L15 13H9Z"/>
                        </svg>
                      </div>
                    )}
                    <span className="font-mono text-[9px] text-slate-500 font-extrabold tracking-wider uppercase mt-1">
                      {rank === 1 ? "CHAMPION" : rank === 2 ? "CONTENDER" : "FINALIST"}
                    </span>
                  </div>

                  {/* Pedestal block */}
                  <div className={`w-full border-2 rounded-t-2xl flex flex-col justify-between p-4 relative overflow-hidden transition-all duration-300 ${borderStyles} ${
                    isMe ? "ring-2 ring-electric-400/40" : ""
                  } ${heightClass}`}>

                    {rank === 1 && (
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-electric-400 via-sky-400 to-electric-600" />
                    )}

                    {/* Pedestal Top */}
                    <div className="text-center space-y-1">
                      <div className="font-mono text-2xl sm:text-3xl font-black text-white leading-none">
                        {score.wpm}
                        <span className="text-[10px] sm:text-xs font-normal text-slate-500 block">WPM</span>
                      </div>
                      <div className="font-mono text-[10px] text-emerald-400 font-bold">
                        {Number(score.accuracy).toFixed(1)}%
                      </div>
                    </div>

                    {/* Pedestal Bottom */}
                    <div className="text-center space-y-1.5 z-10">
                      <div className="flex items-center justify-center gap-1 max-w-full">
                        <span className={`font-sans text-xs sm:text-sm font-bold truncate max-w-full block normal-case ${
                          rank === 1 ? "text-electric-400" : "text-slate-200"
                        }`}>
                          {score.name}
                        </span>
                        {isMe && (
                          <span className="text-[8px] font-mono font-bold bg-electric-500/20 text-electric-400 border border-electric-500/30 px-1 rounded">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="inline-block text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border border-charcoal-700 bg-charcoal-900 text-slate-400">
                        {score.difficulty}
                      </span>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* SYSTEM OVERHAUL SEPARATOR */}
          <div className="max-w-2xl mx-auto flex items-center justify-between font-mono text-[10px] text-slate-500 uppercase tracking-widest">
            <span className="h-[1px] bg-charcoal-700/60 flex-grow mr-4"></span>
            <span>REST OF THE FIELD</span>
            <span className="h-[1px] bg-charcoal-700/60 flex-grow ml-4"></span>
          </div>

          {/* Option A - TERMINAL SYSTEM LOGS FOR remaining ranks (#4+) */}
          <div className="w-full bg-[#0B0C0E] border-2 border-charcoal-750 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col font-mono text-xs">
            {/* Simulation header bar */}
            <div className="bg-charcoal-900/80 px-4 py-3 border-b border-charcoal-750 flex items-center justify-between text-[10px] text-slate-400 tracking-wider">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>SYSTEM_LOG::ACTIVE_STANDINGS_STREAM</span>
              </div>
              <span className="hidden sm:inline-block">CAPPED_LIMIT::50_ENTRIES</span>
            </div>

            {terminalLogEntries.length === 0 ? (
              <div className="p-8 text-center text-slate-500 italic">
                [SYSTEM LOGS EMPTY: NO CONTENDERS IN THIS FIELD YET]
              </div>
            ) : (
              <div className="divide-y divide-charcoal-800/40 max-h-[450px] overflow-y-auto font-mono scrollbar-thin">
                {terminalLogEntries.map((score, idx) => {
                  const rank = idx + 4;
                  const isMe = currentPlayerName && score.name.toLowerCase() === currentPlayerName.toLowerCase();

                  return (
                    <div
                      key={score.id}
                      className={`px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                        isMe
                          ? "bg-electric-500/[0.04] border-l-2 border-electric-500 text-electric-300"
                          : "hover:bg-charcoal-900/30 text-slate-300"
                      }`}
                    >
                      {/* Log Line prefix */}
                      <div className="flex items-center gap-2.5 min-w-[240px]">
                        <span className="text-slate-600 font-bold">
                          [{formatTimeLog(score.created_at)}]
                        </span>
                        <span className={`font-black tracking-wider ${isMe ? "text-electric-400" : "text-slate-500"}`}>
                          #{rank.toString().padStart(2, "0")}
                        </span>
                        <span className={`font-bold truncate max-w-[150px] normal-case ${isMe ? "text-white" : "text-slate-200"}`} title={score.name}>
                          {score.name}
                        </span>
                        {isMe && (
                          <span className="text-[9px] font-bold bg-electric-500/20 text-electric-400 border border-electric-500/30 px-1 rounded leading-none">
                            YOU
                          </span>
                        )}
                      </div>

                      {/* Log Line Metrics */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] sm:text-xs">
                        <div>
                          <span className="text-slate-500">SPEED:</span>{" "}
                          <span className="font-extrabold text-white">{score.wpm}</span>{" "}
                          <span className="text-slate-500">WPM</span>
                        </div>
                        <div className="hidden sm:inline text-slate-700">|</div>
                        <div>
                          <span className="text-slate-500">ACC:</span>{" "}
                          <span className="font-bold text-emerald-400">{Number(score.accuracy).toFixed(1)}%</span>
                        </div>
                        <div className="hidden sm:inline text-slate-700">|</div>
                        <div>
                          <span className="text-slate-500">TIER:</span>{" "}
                          <span className="font-bold uppercase text-sky-400">{score.difficulty}</span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Load More Trigger */}
          {hasMore && !loading && !error && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleLoadMore}
                className="px-6 py-2.5 bg-charcoal-700 text-slate-300 hover:text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg border border-charcoal-600 transition-all cursor-pointer hover-glow-electric focus:outline-none focus:ring-1 focus:ring-electric-500"
              >
                Load More Standings 📊
              </button>
            </div>
          )}

          {/* Capped Standings Note */}
          {scores.length > 0 && !hasMore && (
            <div className="text-center font-mono">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                {scores.length >= 50 ? "🏆 Showing top 50 standings limit reached" : `🏁 Showing all ${scores.length} standings`}
              </span>
            </div>
          )}

        </div>
      )}

      {/* Aesthetic Footer Info */}
      <p className="text-center text-xs text-slate-500 font-mono mt-8 max-w-md leading-relaxed">
        💡 High scores are calculated based on net speed (WPM) and accuracy. Practice daily to climb the leaderboard!
      </p>
    </main>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-electric-500"></div>
      </div>
    }>
      <LeaderboardContent />
    </Suspense>
  );
}
