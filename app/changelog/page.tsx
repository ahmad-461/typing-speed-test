"use client";

import Link from "next/link";

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export default function ChangelogPage() {
  const entries: ChangelogEntry[] = [
    {
      version: "v1.6",
      date: "February 2026",
      title: "Gamification & Premium HUD Mission Controls",
      changes: [
        "Implemented a comprehensive gamification system tracing user levels, XP calculation thresholds, and retroactively determined statistics.",
        "Launched 6 interactive core Practice Modes (Code Arena, Knowledge Quest, AI Lab, World Explorer, Weak-Key Drill, and flat 20s Speed Sprint countdown).",
        "Added advanced professional typing formats supporting customizable Time (15s/30s/60s/120s) and Word Count (10/25/50/100 words) settings.",
        "Engineered strict per-player local data isolation using namespaced localStorage structures to support multi-operator setups.",
        "Redesigned the application footer into a responsive 4-column 'Mission Control' terminal dashboard (System Status, Commands, Operator Metrics, Telemetry).",
        "Integrated client-side active session uptime counters, real-time status badges, and single-trigger typewriter canvas elements."
      ]
    },
    {
      version: "v1.5",
      date: "January 2026",
      title: "Homepage Hub Redesign & Player Verification Flow",
      changes: [
        "Replaced static landing prompts with a sleek, central gamified 'Mission Select' mission control console.",
        "Implemented the player identity-first setup intercepting first visits with a command-line style custom modal overlay.",
        "Synchronized globally updated operator names across headers, result screens, and leaderboards using local subscription registries."
      ]
    },
    {
      version: "v1.4",
      date: "December 2025",
      title: "AI Coach & Adaptive Category Frameworks",
      changes: [
        "Added the Adaptive AI Coach running asynchronous POST evaluations directly to Google Gemini models with rotating local tips as fallback.",
        "Built the Spaced Repetition 'Weak-Key Drill' mode isolating individual keyboard keys triggering low-precision logs.",
        "Expanded test categories to include specialized prompt contexts for developer practices (Code Arena, Knowledge Quest, AI Lab, World Explorer)."
      ]
    },
    {
      version: "v1.3",
      date: "November 2025",
      title: "Global Standings & Supabase Integration",
      changes: [
        "Introduced the central global leaderboard page featuring a clean Podium styling for Top 3 rankings.",
        "Wired secure connections to a remote PostgreSQL backend via Supabase RESTful operations.",
        "Implemented smooth tab-based filter switches (All / Easy / Medium / Hard) with immediate 'Fetching Rankings...' loader overlays to prevent flicker."
      ]
    },
    {
      version: "v1.2",
      date: "September 2025",
      title: "Gemini API Passage Integration & Live Tracking",
      changes: [
        "Engineered the server-side Next.js route calling Google Gemini to feed endless custom typing passages dynamically.",
        "Developed structured local JSON backup bank in lib/passages.ts for robust off-line static retrieval on rate-limits.",
        "Constructed zero-latency, key-by-key reactive state tracking to render accurate real-time metrics."
      ]
    },
    {
      version: "v1.1",
      date: "July 2025",
      title: "Interactive Typing Core & Editor Highlighting",
      changes: [
        "Created an invisible focused input buffer natively compatible with standard physical and virtual mobile software key triggers.",
        "Programmed a custom character highlighter layer displaying correct (muted blue-slate) vs incorrect (soft red) strokes overlaying the text.",
        "Implemented smooth caret animations tracking live character positions."
      ]
    },
    {
      version: "v1.0",
      date: "May 2025",
      title: "Initial Launch & Terminal Foundation",
      changes: [
        "Established the baseline Next.js App Router framework paired with Tailwind CSS and fully configured TypeScript definitions.",
        "Designed the premium dark UI aesthetic emphasizing electric blue accents, JetBrains Mono typography, and dense, scannable spacing."
      ]
    }
  ];

  return (
    <main className="flex-grow bg-[#0c0d0f] text-slate-100 min-h-screen font-mono flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background overlay for styling */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.03),transparent_40%)] pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full relative z-10 space-y-8">

        {/* TOP NAVIGATION */}
        <div className="flex items-center justify-between border-b border-[#3B82F6]/10 pb-4">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1 group font-bold"
          >
            <span className="text-[#3B82F6] group-hover:-translate-x-0.5 transition-transform inline-block">&lt;</span> BACK TO MISSION CONTROL
          </Link>
          <div className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">
            ARCHIVE: PATCH_LOGS
          </div>
        </div>

        {/* HEADER */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#3B82F6] font-bold">
            <span className="animate-pulse">●</span> VERSION_HISTORY_ARCHIVE
          </div>
          <h1 className="text-3xl font-sans font-black tracking-tight text-white flex items-center gap-2">
            PATCH_NOTES<span className="text-[#3B82F6]/70">.log</span>
          </h1>
          <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-xl">
            A chronological timeline documenting the technical engineering and aesthetic evolution of the NOKY typing ecosystem.
          </p>
        </div>

        {/* CHANGELOG CHRONOLOGY */}
        <div className="space-y-10 relative pl-4 sm:pl-6 border-l border-[#1e293b] ml-2 py-4">
          {entries.map((entry, index) => (
            <div key={entry.version} className="relative space-y-3">

              {/* Timeline dot marker */}
              <div className="absolute -left-[21px] sm:-left-[29px] top-1 w-2.5 h-2.5 rounded-full bg-[#0c0d0f] border-2 border-[#3B82F6] shadow-[0_0_8px_rgba(59,130,246,0.6)]" />

              {/* Version & Date row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-xs font-bold text-[#3B82F6] tracking-wider">
                  [{entry.version}]
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {entry.date}
                </span>
              </div>

              {/* Title Header */}
              <h3 className="text-sm font-bold text-white font-sans tracking-tight">
                {entry.title}
              </h3>

              {/* Bullet list of shifts */}
              <ul className="space-y-2 font-sans text-xs text-slate-300 leading-relaxed max-w-3xl pl-4 list-disc marker:text-[#3B82F6]/40">
                {entry.changes.map((change, cIdx) => (
                  <li key={cIdx} className="hover:text-slate-100 transition-colors">
                    {change}
                  </li>
                ))}
              </ul>

              {/* Visual Divider between log nodes (except last) */}
              {index < entries.length - 1 && (
                <div className="pt-4 pb-2">
                  <div className="h-[1px] bg-[#1e293b]/40 w-full" />
                </div>
              )}

            </div>
          ))}
        </div>

        {/* BOTTOM NAVIGATION RETURN */}
        <div className="pt-6 flex justify-center">
          <Link
            href="/"
            className="group py-3 px-6 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all duration-150 border border-[#3B82F6]/20 bg-[#0e1013] text-slate-400 hover:text-white hover:border-[#3B82F6]/50 shadow-[0_4px_12px_rgba(59,130,246,0.03)] cursor-pointer"
          >
            &gt; [CMD] return_to_hub.sh
          </Link>
        </div>

      </div>
    </main>
  );
}
