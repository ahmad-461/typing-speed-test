"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DataProtocolPage() {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleWipeData = () => {
    if (typeof window !== "undefined") {
      // Clear all namespaces and keys
      localStorage.clear();
      sessionStorage.clear();

      // Dispatch events to instantly update Header and Footer state
      window.dispatchEvent(new CustomEvent("tst-name-updated", { detail: "" }));
      window.dispatchEvent(new CustomEvent("tst-gamification-updated"));

      // Close confirmation and reload page/redirect to home
      setShowConfirm(false);
      router.push("/");
      router.refresh();
    }
  };

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
            STATUS: SECURE_MIRROR_ACTIVE
          </div>
        </div>

        {/* HEADER */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#3B82F6] font-bold">
            <span className="animate-pulse">●</span> SYSTEM_DIAGNOSTICS_READOUT
          </div>
          <h1 className="text-3xl font-sans font-black tracking-tight text-white flex items-center gap-2">
            DATA_PROTOCOL<span className="text-[#3B82F6]/70">.log</span>
          </h1>
          <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-2xl">
            This protocol outlines how data is handled within the NOKY framework. Built around player privacy, we only record what is required to track your gamification state and power the optional global leaderboard. No tracking scripts, no ads, and no hidden telemetry.
          </p>
        </div>

        {/* DIAGNOSTIC REPORT CONTENT */}
        <div className="space-y-6">

          {/* 1. LOCAL STORAGE ENTRY */}
          <div className="border border-[#1e293b] bg-[#0e1013]/80 p-5 rounded-xl space-y-3 relative overflow-hidden group hover:border-[#3B82F6]/20 transition-all duration-200">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#3B82F6]" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <span className="text-[#3B82F6]">[01]</span> [LOCAL_STORAGE]
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/[0.04] border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-black tracking-wider">
                Active Client
              </span>
            </div>
            <div className="space-y-2 font-sans text-xs text-slate-300 leading-relaxed">
              <p>
                To provide a high-performance, personalized typing experience, NOKY stores key state matrices in your browser’s local sandbox. This data belongs strictly to you and <strong className="text-white">never leaves your device</strong> unless you choose to submit a leaderboard score.
              </p>
              <div className="bg-[#090A0C] border border-slate-800/40 p-3 rounded-lg font-mono text-[11px] text-slate-400 space-y-1">
                <div>• <strong className="text-[#3B82F6]">tst_player_name:</strong> Your active callsign configuration.</div>
                <div>• <strong className="text-[#3B82F6]">tst_history_v1:[name]:</strong> Chronological typing test metrics and timestamps.</div>
                <div>• <strong className="text-[#3B82F6]">tst_keyerrors_v1:[name]:</strong> QWERTY error mapping for heatmap diagnostics.</div>
                <div>• <strong className="text-[#3B82F6]">tst_key_typed_counts_v1:[name]:</strong> Total typed metrics to calculate true letter precision.</div>
                <div>• <strong className="text-[#3B82F6]">tst_personal_wpm_goal_v1:[name]:</strong> Your custom speed targets.</div>
                <div>• <strong className="text-[#3B82F6]">XP / Level / Achievements / Streak Data:</strong> Your retroactively calculated progressions.</div>
              </div>
            </div>
          </div>

          {/* 2. REMOTE STORAGE ENTRY */}
          <div className="border border-[#1e293b] bg-[#0e1013]/80 p-5 rounded-xl space-y-3 relative overflow-hidden group hover:border-[#3B82F6]/20 transition-all duration-200">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#3B82F6]" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <span className="text-[#3B82F6]">[02]</span> [REMOTE_DB_STORAGE]
              </span>
              <span className="text-[10px] text-sky-400 bg-sky-500/[0.04] border border-sky-500/20 px-2 py-0.5 rounded uppercase font-black tracking-wider">
                On-Demand Submit
              </span>
            </div>
            <p className="font-sans text-xs text-slate-300 leading-relaxed">
              We maintain a global leaderboard backed by a secure Supabase database instance. High score sync is <strong className="text-white">strictly explicit</strong>. When you complete a test, a record is uploaded only if you click the <strong className="text-white">&quot;Submit Score&quot;</strong> button on the results screen.
            </p>
            <div className="bg-[#090A0C] border border-slate-800/40 p-3 rounded-lg font-mono text-[11px] text-slate-400 space-y-1">
              <div>• <strong className="text-[#3B82F6]">Transmitted Payload:</strong> callsing / nickname, speed (WPM), accuracy %, test difficulty, category, and system timestamp.</div>
              <div>• No email, no IP records, and no background profiling are compiled or stored.</div>
            </div>
          </div>

          {/* 3. ZERO TRACKING VERIFICATION */}
          <div className="border border-[#1e293b] bg-[#0e1013]/80 p-5 rounded-xl space-y-3 relative overflow-hidden group hover:border-[#3B82F6]/20 transition-all duration-200">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#3B82F6]" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <span className="text-[#3B82F6]">[03]</span> [TRACKING_AUDIT]
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/[0.04] border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-black tracking-wider">
                Verifiably Clear
              </span>
            </div>
            <p className="font-sans text-xs text-slate-300 leading-relaxed">
              Our code has been audited to guarantee absolute privacy:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
              <div className="bg-[#090A0C] border border-slate-800/60 p-3 rounded-lg text-center">
                <span className="text-[10px] text-rose-400 font-bold block uppercase mb-1">COOKIES</span>
                <span className="text-[11px] text-slate-400">0 Third-Party Cookies</span>
              </div>
              <div className="bg-[#090A0C] border border-slate-800/60 p-3 rounded-lg text-center">
                <span className="text-[10px] text-rose-400 font-bold block uppercase mb-1">ANALYTICS</span>
                <span className="text-[11px] text-slate-400">No trackers or pixels</span>
              </div>
              <div className="bg-[#090A0C] border border-slate-800/60 p-3 rounded-lg text-center">
                <span className="text-[10px] text-rose-400 font-bold block uppercase mb-1">ADVERTISING</span>
                <span className="text-[11px] text-slate-400">Zero ad network scripts</span>
              </div>
            </div>
          </div>

          {/* 4. THIRD PARTY ENTRY */}
          <div className="border border-[#1e293b] bg-[#0e1013]/80 p-5 rounded-xl space-y-3 relative overflow-hidden group hover:border-[#3B82F6]/20 transition-all duration-200">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#3B82F6]" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <span className="text-[#3B82F6]">[04]</span> [THIRD_PARTY_MIRRORS]
              </span>
              <span className="text-[10px] text-amber-500 bg-amber-500/[0.04] border border-amber-500/20 px-2 py-0.5 rounded uppercase font-black tracking-wider">
                External APIs
              </span>
            </div>
            <div className="space-y-2 font-sans text-xs text-slate-300 leading-relaxed">
              <p>
                To render typing passages, coordinate standings, and run web components, the client securely interfaces with the following endpoints:
              </p>
              <div className="bg-[#090A0C] border border-slate-800/40 p-3 rounded-lg font-mono text-[11px] text-slate-400 space-y-2">
                <div>
                  <strong className="text-slate-200">Google Gemini API:</strong> Generates advanced typing drills. Passed metadata is strictly parameterized (e.g. difficulty, category, selected weak keys). No personal callsigns or telemetry are sent to Google.
                </div>
                <div>
                  <strong className="text-slate-200">Supabase:</strong> Preserves global standings and submits score logs on explicit action.
                </div>
                <div>
                  <strong className="text-slate-200">Vercel:</strong> Delivers CDN mirroring and zero-latency deployment hosting. Standard anonymized request telemetry may be logged at the edge to combat DDoS anomalies.
                </div>
              </div>
            </div>
          </div>

          {/* 5. DATA MANAGEMENT */}
          <div className="border border-red-500/20 bg-red-950/[0.02] p-5 rounded-xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-400 tracking-wider flex items-center gap-1.5">
                <span>[05]</span> [LOCAL_DATA_DESTRUCTION]
              </span>
              <span className="text-[10px] text-red-400 bg-red-500/[0.04] border border-red-500/20 px-2 py-0.5 rounded uppercase font-black tracking-wider">
                Wipe Tool
              </span>
            </div>

            <div className="font-sans text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                You retain complete power over your system memory.
              </p>
              <p>
                To exit your current active identity while keeping local logs intact, use the <strong className="text-white">power/Exit icon</strong> located in the top-right Header HUD next to your callsign (or next to your name on the homepage hub).
              </p>
              <p className="text-rose-400/90">
                To completely obliterate all achievements, streaks, heatmaps, and stats from this browser forever, use the console tool below. This cannot be undone.
              </p>
            </div>

            <div className="pt-2">
              {!showConfirm ? (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="py-2.5 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all duration-150 border border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-900/30 hover:text-red-300 cursor-pointer"
                >
                  &gt; initiate_data_purge.sh
                </button>
              ) : (
                <div className="bg-[#090a0c] border border-red-500/30 p-4 rounded-lg space-y-3">
                  <div className="text-xs text-red-400 font-bold">
                    &gt; PURGE CONFIRMATION REQUIRED: This will clear localStorage entirely. Are you absolutely certain?
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleWipeData}
                      className="py-2 px-3 rounded text-[11px] font-bold bg-red-600 hover:bg-red-500 text-white uppercase cursor-pointer"
                    >
                      [CONFIRM PURGE]
                    </button>
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="py-2 px-3 rounded text-[11px] font-bold bg-charcoal-800 hover:bg-charcoal-700 text-slate-400 uppercase cursor-pointer"
                    >
                      [ABORT]
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

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
