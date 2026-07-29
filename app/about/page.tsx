"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="flex-grow bg-[#0c0d0f] text-slate-100 min-h-screen font-mono flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background overlay for styling */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.03),transparent_40%)] pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full relative z-10 space-y-8">

        {/* TOP NAVIGATION */}
        <div className="flex items-center justify-between border-b border-[#3B82F6]/10 pb-4">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1 group font-bold font-mono uppercase tracking-wider"
          >
            <span className="text-[#3B82F6] group-hover:-translate-x-0.5 transition-transform inline-block">&lt;</span> BACK TO MISSION CONTROL
          </Link>
          <div className="text-[10px] text-slate-600 uppercase tracking-widest font-bold font-mono">
            SEC_INTEL: ABOUT_OPERATOR
          </div>
        </div>

        {/* HEADER */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#3B82F6] font-bold font-mono uppercase tracking-wider">
            <span className="animate-pulse">●</span> SYSTEM_CREDENTIALS_VERIFICATION
          </div>
          <h1 className="text-3xl sm:text-4xl font-sans font-black tracking-tight text-white flex items-center gap-2">
            ABOUT_OPERATOR<span className="text-[#3B82F6]/70">.txt</span>
          </h1>
          <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-2xl">
            This dossier contains authentic, verifiable information regarding the architectural origin, design philosophy, and technical stack of the NOKY typing ecosystem.
          </p>
        </div>

        {/* CONTENT BLOCKS */}
        <div className="space-y-6">

          {/* 1. DEVELOPER NOTE */}
          <div className="border border-[#1e293b] bg-[#0e1013]/80 p-4 sm:p-6 rounded-xl space-y-3 relative overflow-hidden group card-hover-lift">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#3B82F6]" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 tracking-wider flex items-center gap-1.5 font-mono uppercase">
                <span className="text-[#3B82F6]">[01]</span> [DEVELOPER_LOG_NOTE]
              </span>
              <span className="text-[10px] text-[#3B82F6] bg-[#3B82F6]/[0.04] border border-[#3B82F6]/20 px-2 py-0.5 rounded-lg uppercase font-black tracking-wider font-mono">
                ORIGIN_DOCKET
              </span>
            </div>
            <div className="space-y-3 font-sans text-xs text-slate-300 leading-relaxed">
              <p>
                NOKY was built by <strong className="text-white">Ahmad</strong>, a Computer Science student, as a full-stack portfolio project exploring AI integration, gamified product design, and real-time systems. What started as a typing speed test grew into a complete typing platform — AI-generated content, a full progression system, and a persistent leaderboard — built end-to-end from a single developer&apos;s iterative process.
              </p>
              <p>
                Every feature, from namespaced data partitioning to real-time custom layout states, has been iteratively refined to provide a smooth, engaging typing environment. The development timeline and system upgrades are documented transparently for peer review.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/changelog"
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-[#0c0d0f] border border-[#3B82F6]/20 rounded-lg text-xs font-mono text-slate-400 hover:text-white hover:border-[#3B82F6]/50 transition-all active:scale-[0.97]"
                >
                  &gt;_ read_changelog.sh
                </Link>
                <a
                  href="https://github.com/ahmad-461/typing-speed-test"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-[#0c0d0f] border border-[#3B82F6]/20 rounded-lg text-xs font-mono text-slate-400 hover:text-white hover:border-[#3B82F6]/50 transition-all active:scale-[0.97]"
                >
                  &gt;_ inspect_source.git
                </a>
              </div>
            </div>
          </div>

          {/* 2. TECHNICAL EXPERTISE & ARCHITECTURE */}
          <div className="border border-[#1e293b] bg-[#0e1013]/80 p-4 sm:p-6 rounded-xl space-y-3 relative overflow-hidden group card-hover-lift">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#3B82F6]" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 tracking-wider flex items-center gap-1.5 font-mono uppercase">
                <span className="text-[#3B82F6]">[02]</span> [SYSTEM_ARCHITECTURE]
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/[0.04] border border-emerald-500/20 px-2 py-0.5 rounded-lg uppercase font-black tracking-wider font-mono">
                ENGINEERING_SPEC
              </span>
            </div>
            <div className="space-y-3 font-sans text-xs text-slate-300 leading-relaxed">
              <p>
                To demonstrate robust technical mastery, NOKY rejects boilerplate configurations in favor of low-latency, type-safe custom components designed for scalable web performance:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 font-mono text-[11px] text-slate-400">
                <div className="bg-[#090A0C] border border-slate-800/40 p-3 rounded-lg space-y-1">
                  <div className="text-white font-bold">&gt; NEXT.JS 15 (APP ROUTER)</div>
                  <p className="font-sans text-[10px] text-slate-400">
                    Utilizes Edge API routes, concurrent React streaming, strict asset optimization, and dynamic route handlers to achieve near-instantaneous load times.
                  </p>
                </div>
                <div className="bg-[#090A0C] border border-slate-800/40 p-3 rounded-lg space-y-1">
                  <div className="text-white font-bold">&gt; GOOGLE GEMINI AI API</div>
                  <p className="font-sans text-[10px] text-slate-400">
                    Integrated with <code className="text-[#3B82F6]">gemini-flash-lite-latest</code> via secure proxy routes, employing a strict 3-second abort timeout and a zero-delay local fallback framework.
                  </p>
                </div>
                <div className="bg-[#090A0C] border border-slate-800/40 p-3 rounded-lg space-y-1">
                  <div className="text-white font-bold">&gt; SUPABASE & POSTGRESQL</div>
                  <p className="font-sans text-[10px] text-slate-400">
                    Backed by a secure remote database with row-level constraints, supporting an on-demand score submission flow to maintain clean global standings.
                  </p>
                </div>
                <div className="bg-[#090A0C] border border-slate-800/40 p-3 rounded-lg space-y-1">
                  <div className="text-white font-bold">&gt; LOCAL ISOLATION MATRIX</div>
                  <p className="font-sans text-[10px] text-slate-400">
                    Implements per-player namespaced states in localStorage, retroactively computing levels, streaks, goals, and keyerror heatmaps to isolate player context.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. TRANSPARENCY & GENERATIVE AI DISCLOSURE */}
          <div className="border border-[#1e293b] bg-[#0e1013]/80 p-4 sm:p-6 rounded-xl space-y-3 relative overflow-hidden group card-hover-lift">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#3B82F6]" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 tracking-wider flex items-center gap-1.5 font-mono uppercase">
                <span className="text-[#3B82F6]">[03]</span> [AI_GENERATION_DISCLOSURE]
              </span>
              <span className="text-[10px] text-amber-500 bg-amber-500/[0.04] border border-amber-500/20 px-2 py-0.5 rounded-lg uppercase font-black tracking-wider font-mono">
                HONESTY_DOCKET
              </span>
            </div>
            <div className="space-y-3 font-sans text-xs text-slate-300 leading-relaxed">
              <p>
                NOKY operates with honest and transparent disclosure regarding AI-assisted content generation. We believe in providing clear visibility into how technology is utilized:
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                <li>
                  <strong className="text-slate-200">Typing Passages:</strong> Passages for specialized sectors (e.g. Code Arena, Knowledge Quest, AI Lab, World Explorer) are generated dynamically using Google Gemini models to ensure rich, non-repetitive practice text.
                </li>
                <li>
                  <strong className="text-slate-200">AI Coach Feedback:</strong> After each typing session, your performance metrics (WPM, precision percentage, and specific keyboard mistypes) are analyzed by the Gemini LLM proxy to generate brief, actionable coaching tips.
                </li>
                <li>
                  <strong className="text-slate-200">Static Fallback:</strong> If Google Gemini API is offline, hits rate-limits, or times out (3-second hard limit), the platform silently falls back to local static passages and a tip loop in <code className="text-[#3B82F6]">lib/passages.ts</code> to guarantee 100% uptime.
                </li>
              </ul>
              <div className="bg-amber-500/[0.02] border border-amber-500/10 p-3 rounded-lg text-amber-400 font-bold uppercase tracking-wider text-[10px] font-mono">
                &gt; DISCLOSURE ENFORCED: ALL GENERATIVE TEXT IS EXPLICITLY LABELED IN REAL-TIME WITHIN ACTIVE WORKSPACES.
              </div>
            </div>
          </div>

          {/* 4. VERIFIABLE DEVELOPMENT PROCESS */}
          <div className="border border-[#1e293b] bg-[#0e1013]/80 p-4 sm:p-6 rounded-xl space-y-3 relative overflow-hidden group card-hover-lift">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#3B82F6]" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 tracking-wider flex items-center gap-1.5 font-mono uppercase">
                <span className="text-[#3B82F6]">[04]</span> [VERIFIABLE_CODE_BASE]
              </span>
              <span className="text-[10px] text-[#3B82F6] bg-[#3B82F6]/[0.04] border border-[#3B82F6]/20 px-2 py-0.5 rounded-lg uppercase font-black tracking-wider font-mono">
                INSPECTABLE_REVIEWS
              </span>
            </div>
            <p className="font-sans text-xs text-slate-300 leading-relaxed">
              We do not present mock templates or artificial statistics. This application is supported by an open-source GitHub repository containing the complete, chronological commit logs, architectural branches, and code revisions as evidence of iterative, real-world software engineering practice:
            </p>
            <div className="bg-[#090A0C] border border-slate-800/40 p-3 rounded-lg font-mono text-[11px] text-slate-400 space-y-2">
              <div>
                • <strong className="text-white">Repository:</strong>{" "}
                <a
                  href="https://github.com/ahmad-461/typing-speed-test"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3B82F6] hover:underline"
                >
                  github.com/ahmad-461/typing-speed-test
                </a>
              </div>
              <div>
                • <strong className="text-white">License:</strong> Open Source Portfolio
              </div>
              <div>
                • <strong className="text-white">Security:</strong> Secure client mirror with CORS controls, zero tracking pixels, and strict sanitation rules.
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM NAVIGATION RETURN */}
        <div className="pt-6 flex justify-center">
          <Link
            href="/"
            className="group py-3 px-6 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all duration-150 border border-[#3B82F6]/20 bg-[#0e1013] text-slate-400 hover:text-white hover:border-[#3B82F6]/50 shadow-[0_4px_12px_rgba(59,130,246,0.03)] cursor-pointer active:scale-[0.97] min-h-[44px] flex items-center justify-center"
          >
            &gt; [CMD] return_to_hub.sh
          </Link>
        </div>

      </div>
    </main>
  );
}
