"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type ScoreEntry = {
  id: string;
  name: string;
  wpm: number;
  accuracy: number;
  difficulty: "easy" | "medium" | "hard";
  created_at: string;
};

type DifficultyFilter = "all" | "easy" | "medium" | "hard";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";

  const day = d.getDate();
  // Standard UTC/local month names
  const allMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthName = allMonths[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${monthName} ${year}`;
}

function LeaderboardContent() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [filter, setFilter] = useState<DifficultyFilter>("all");
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("scores")
        .select("id, name, wpm, accuracy, difficulty, created_at")
        .order("wpm", { ascending: false })
        .order("accuracy", { ascending: false })
        .order("created_at", { ascending: true })
        // Fetch up to the current page size, capped at the top 50 maximum entries constraint
        .limit(Math.min(pageSize, 50));

      if (filter !== "all") {
        query = query.eq("difficulty", filter);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      setScores((data as ScoreEntry[]) || []);
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

  // Reset page size back to initial 20 when filter changes
  const handleFilterChange = (newFilter: DifficultyFilter) => {
    setFilter(newFilter);
    setPageSize(20);
  };

  const handleLoadMore = () => {
    // Increase limit up to 50
    setPageSize((prev) => Math.min(prev + 15, 50));
  };

  const hasMore = scores.length === pageSize && scores.length < 50;

  return (
    <main className="flex-grow flex flex-col items-center justify-start px-4 py-8 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full animate-fade-in">
      {/* Navigation Header */}
      <div className="w-full flex items-center justify-between mb-8 pb-4 border-b border-charcoal-700/60">
        <Link
          href="/"
          className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal-800 border border-charcoal-700 hover-glow-electric"
        >
          ← Home
        </Link>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
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
      <div className="w-full flex justify-center mb-6">
        <div className="flex bg-charcoal-800 p-1 rounded-xl border border-charcoal-700 max-w-md w-full">
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

      {/* Leaderboard Table Container */}
      <div className="w-full bg-charcoal-800 border border-charcoal-700 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
        {/* Subtle decorative color bar */}
        <div className="h-1 w-full bg-gradient-to-r from-electric-500 via-sky-500 to-emerald-500" />

        {error ? (
          <div className="p-12 text-center space-y-4 font-mono">
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
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-electric-500"></div>
            <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
              Fetching rankings...
            </p>
          </div>
        ) : scores.length === 0 ? (
          <div className="p-16 text-center space-y-4 font-mono">
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
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-charcoal-700 bg-charcoal-900/40 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  <th className="py-4 px-4 sm:px-6 text-center w-16">Rank</th>
                  <th className="py-4 px-4">Name</th>
                  <th className="py-4 px-4 text-center w-24">WPM</th>
                  <th className="py-4 px-4 text-center w-28">Accuracy</th>
                  <th className="py-4 px-4 text-center w-28">Difficulty</th>
                  <th className="py-4 px-4 text-right pr-6 sm:pr-8 w-36">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-700/50">
                {scores.map((score, idx) => {
                  const rank = idx + 1;
                  let rankBadge = `${rank}`;
                  let rankColorClass = "text-slate-400";
                  let bgRowClass = "hover:bg-charcoal-900/10";

                  if (rank === 1) {
                    rankBadge = "🥇";
                    rankColorClass = "text-amber-400 font-extrabold text-base";
                    bgRowClass = "bg-amber-500/5 hover:bg-amber-500/10";
                  } else if (rank === 2) {
                    rankBadge = "🥈";
                    rankColorClass = "text-slate-300 font-bold text-base";
                    bgRowClass = "bg-slate-300/5 hover:bg-slate-300/10";
                  } else if (rank === 3) {
                    rankBadge = "🥉";
                    rankColorClass = "text-amber-600 font-bold text-base";
                    bgRowClass = "bg-amber-600/5 hover:bg-amber-600/10";
                  }

                  return (
                    <tr key={score.id} className={`transition-colors duration-150 ${bgRowClass}`}>
                      {/* Rank */}
                      <td className={`py-4 px-4 sm:px-6 text-center font-mono font-bold ${rankColorClass}`}>
                        {rankBadge}
                      </td>

                      {/* Name */}
                      <td className="py-4 px-4 font-sans font-semibold text-slate-100 max-w-[150px] sm:max-w-[200px] truncate">
                        {score.name}
                      </td>

                      {/* WPM */}
                      <td className="py-4 px-4 text-center font-mono font-extrabold text-white text-base">
                        {score.wpm}
                      </td>

                      {/* Accuracy */}
                      <td className="py-4 px-4 text-center font-mono font-bold text-emerald-400">
                        {Number(score.accuracy).toFixed(1)}%
                      </td>

                      {/* Difficulty */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                            score.difficulty === "easy"
                              ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/20"
                              : score.difficulty === "medium"
                              ? "text-electric-400 bg-electric-500/5 border-electric-500/20"
                              : "text-rose-400 bg-rose-500/5 border-rose-500/20"
                          }`}
                        >
                          {score.difficulty}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 pr-6 sm:pr-8 text-right font-mono text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(score.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Load More Trigger */}
        {hasMore && !loading && !error && (
          <div className="p-4 bg-charcoal-900/20 border-t border-charcoal-700/50 flex justify-center">
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
          <div className="p-4 bg-charcoal-900/30 border-t border-charcoal-700/50 text-center">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              {scores.length >= 50 ? "🏆 Showing top 50 standings limit reached" : `🏁 Showing all ${scores.length} standings`}
            </span>
          </div>
        )}
      </div>

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
