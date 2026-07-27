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
          <div className="w-full flex flex-col">
            {/* Header row */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-charcoal-700 bg-charcoal-900/40 text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold items-center">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-11 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
                <div className="col-span-4 pl-2">Name</div>
                <div className="col-span-6 grid grid-cols-3 md:grid-cols-6 gap-2 items-center text-center">
                  <div className="col-span-2">WPM</div>
                  <div className="col-span-2">Accuracy</div>
                  <div className="col-span-2">Difficulty</div>
                </div>
                <div className="col-span-2 text-right pr-2">Date</div>
              </div>
            </div>

            {/* Scores container */}
            <div className="divide-y divide-charcoal-700/50 flex flex-col">
              {scores.map((score, idx) => {
                const rank = idx + 1;

                // Base design parameters
                let rankVisual = <span className="font-mono text-slate-400 font-bold">{rank}</span>;
                let containerClass = "hover:bg-charcoal-900/10 border-transparent";
                let wpmSizeClass = "text-white text-base font-extrabold";
                let nameColorClass = "text-slate-100";

                if (rank === 1) {
                  rankVisual = (
                    <div className="flex items-center justify-center relative w-8 h-8 rounded-full bg-electric-500/10 border border-electric-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)] mx-auto animate-pulse">
                      {/* Premium Custom crown-like SVG */}
                      <svg className="w-4 h-4 text-electric-400" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 16L3 5L8.5 10L12 3L15.5 10L21 5L19 16H5ZM19 18H5V20H19V18Z"/>
                      </svg>
                    </div>
                  );
                  containerClass = "bg-electric-500/5 hover:bg-electric-500/10 border-electric-500/30 shadow-[0_0_15px_rgba(59,130,246,0.05)] scale-[1.01] ring-1 ring-electric-500/15";
                  wpmSizeClass = "text-electric-400 text-xl font-black font-mono tracking-tight";
                  nameColorClass = "text-white font-black";
                } else if (rank === 2) {
                  rankVisual = (
                    <div className="flex items-center justify-center relative w-7 h-7 rounded-full bg-electric-500/10 border border-electric-500/20 mx-auto">
                      {/* Premium Medal-like SVG */}
                      <svg className="w-3.5 h-3.5 text-electric-400/80" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <path d="M9 13L7 21L12 18.5L17 21L15 13H9Z"/>
                      </svg>
                    </div>
                  );
                  containerClass = "bg-charcoal-900/40 hover:bg-charcoal-900/60 border-electric-500/10";
                  wpmSizeClass = "text-white text-lg font-black font-mono";
                  nameColorClass = "text-slate-100 font-bold";
                } else if (rank === 3) {
                  rankVisual = (
                    <div className="flex items-center justify-center relative w-7 h-7 rounded-full bg-charcoal-900 border border-charcoal-700 mx-auto">
                      {/* Premium Medal-like SVG (More translucent) */}
                      <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <path d="M9 13L7 21L12 18.5L17 21L15 13H9Z"/>
                      </svg>
                    </div>
                  );
                  containerClass = "bg-charcoal-900/20 hover:bg-charcoal-900/40 border-charcoal-750";
                  wpmSizeClass = "text-slate-200 text-base font-extrabold font-mono";
                }

                return (
                  <div
                    key={score.id}
                    style={{ animationDelay: `${idx * 40}ms` }}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 transition-all duration-200 border-l-2 items-center text-sm md:text-base ${containerClass} animate-slide-up-fade`}
                  >
                    {/* Rank */}
                    <div className="col-span-2 md:col-span-1 text-center font-mono">
                      {rankVisual}
                    </div>

                    {/* Mobile Details Grouping */}
                    <div className="col-span-10 md:col-span-11 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">

                      {/* Name */}
                      <div className="col-span-1 md:col-span-4 pl-2">
                        <span className={`block font-sans truncate tracking-tight ${nameColorClass}`}>
                          {score.name}
                        </span>
                        <div className="md:hidden flex gap-2 items-center mt-1">
                          <span className="text-[10px] font-mono text-slate-500">Rank #{rank}</span>
                          <span className="text-[10px] text-slate-600">•</span>
                          <span className="text-[10px] font-mono text-slate-500">{formatDate(score.created_at)}</span>
                        </div>
                      </div>

                      {/* Stats columns */}
                      <div className="col-span-1 md:col-span-6 grid grid-cols-3 md:grid-cols-6 gap-2 items-center">
                        {/* WPM */}
                        <div className="col-span-1 md:col-span-2 text-left md:text-center">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block md:hidden mb-0.5">WPM</span>
                          <span className={wpmSizeClass}>
                            {score.wpm} <span className="text-[10px] font-normal text-slate-500 font-mono">wpm</span>
                          </span>
                        </div>

                        {/* Accuracy */}
                        <div className="col-span-1 md:col-span-2 text-left md:text-center">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block md:hidden mb-0.5">Accuracy</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {Number(score.accuracy).toFixed(1)}%
                          </span>
                        </div>

                        {/* Difficulty */}
                        <div className="col-span-1 md:col-span-2 text-left md:text-center">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block md:hidden mb-0.5">Tier</span>
                          <span
                            className={`inline-block text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                              score.difficulty === "easy"
                                ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/20"
                                : score.difficulty === "medium"
                                ? "text-electric-400 bg-electric-500/5 border-electric-500/20"
                                : score.difficulty === "hard"
                                ? "text-rose-400 bg-rose-500/5 border-rose-500/20"
                                : "text-sky-400 bg-sky-500/5 border-sky-500/20"
                            }`}
                          >
                            {score.difficulty}
                          </span>
                        </div>
                      </div>

                      {/* Date (hidden on mobile, shown on md screens up) */}
                      <div className="hidden md:block md:col-span-2 text-right pr-2 font-mono text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(score.created_at)}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
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
