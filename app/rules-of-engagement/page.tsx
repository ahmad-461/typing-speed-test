"use client";

import Link from "next/link";

export default function RulesOfEngagementPage() {
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
            MISSION: ENGAGEMENT_RULES
          </div>
        </div>

        {/* HEADER */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#3B82F6] font-bold font-mono uppercase tracking-wider">
            <span className="animate-pulse">●</span> ESTABLISHED_OPERATIONAL_PARAMETERS
          </div>
          <h1 className="text-3xl sm:text-4xl font-sans font-black tracking-tight text-white flex items-center gap-2">
            RULES_OF_ENGAGEMENT<span className="text-[#3B82F6]/70">.txt</span>
          </h1>
          <p className="text-xs text-slate-450 font-sans leading-relaxed max-w-xl">
            Welcome to NOKY. Operating in this sector requires strict adherence to our rules of engagement. This is a game of skill, speed, and integrity.
          </p>
        </div>

        {/* RULES CONTENT BLOCKS */}
        <div className="space-y-6 pt-2">

          {/* RULE 1: FAIR PLAY */}
          <div className="border border-[#1e293b]/80 bg-[#0e1013]/60 p-4 sm:p-6 rounded-xl space-y-3 card-hover-lift">
            <h2 className="text-xs font-black tracking-widest text-[#3B82F6] uppercase font-mono">
              [SECTION_01: FAIR_PLAY]
            </h2>
            <div className="space-y-2 font-sans text-xs text-slate-300 leading-relaxed">
              <p>
                NOKY operates on a strict, pure honor-system leaderboard. Leaderboard positions and ranked logs must reflect your <strong className="text-white">genuine physical typing performance</strong>.
              </p>
              <p className="font-mono text-[11px] text-[#3B82F6]/90 bg-[#3B82F6]/[0.02] border border-[#3B82F6]/10 p-2.5 rounded-lg">
                &gt; PROHIBITED: Automated input macros, browser console injectors, script-assisted auto-typers, or hardware-emulated inputs. Keep it human. Keep it honest.
              </p>
            </div>
          </div>

          {/* RULE 2: WHAT NOKY PROVIDES */}
          <div className="border border-[#1e293b]/80 bg-[#0e1013]/60 p-4 sm:p-6 rounded-xl space-y-3 card-hover-lift">
            <h2 className="text-xs font-black tracking-widest text-[#3B82F6] uppercase font-mono">
              [SECTION_02: PLATFORM_PROVISION]
            </h2>
            <div className="space-y-2 font-sans text-xs text-slate-300 leading-relaxed">
              <p>
                NOKY is offered entirely for free as a personal developer portfolio project.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400 text-xs">
                <li><strong className="text-slate-300">AI-Generated Content:</strong> Passages are generated live via Gemini. While the models are heavily instructed, text templates may occasionally include spelling quirks, code syntax anomalies, or language eccentricities.</li>
                <li><strong className="text-slate-300">Uptime & Availability:</strong> Service is maintained on a best-effort basis. No uptime SLA, backing service guarantees, or maintenance intervals are promised.</li>
              </ul>
            </div>
          </div>

          {/* RULE 3: WARRANTY */}
          <div className="border border-[#1e293b]/80 bg-[#0e1013]/60 p-4 sm:p-6 rounded-xl space-y-3 card-hover-lift">
            <h2 className="text-xs font-black tracking-widest text-amber-500 uppercase font-mono">
              [SECTION_03: DISCLAIMER_OF_WARRANTY]
            </h2>
            <div className="space-y-2 font-mono text-[11px] text-slate-300 leading-relaxed">
              <p className="font-sans text-xs">
                To the maximum extent permitted by local law, NOKY is provided &quot;as-is&quot; and &quot;as-available&quot; without warranties of any kind.
              </p>
              <div className="bg-amber-500/[0.02] border border-amber-500/10 p-3 rounded-lg text-amber-400 font-bold uppercase tracking-wider text-[10px] font-mono">
                &gt; SYSTEM PROVIDED AS-IS. NO GUARANTEES BEYOND YOUR NEXT PERSONAL BEST. CHASE YOUR OWN SPEED LIMITS.
              </div>
            </div>
          </div>

          {/* RULE 4: OPEN SOURCE */}
          <div className="border border-[#1e293b]/80 bg-[#0e1013]/60 p-4 sm:p-6 rounded-xl space-y-3 card-hover-lift">
            <h2 className="text-xs font-black tracking-widest text-[#3B82F6] uppercase font-mono">
              [SECTION_04: REPOSITORY_ENGAGEMENT]
            </h2>
            <div className="space-y-2 font-sans text-xs text-slate-300 leading-relaxed">
              <p>
                This terminal is built transparently. Developers, speed typists, and tinkerers are welcome to inspect, branch, or fork our architectural systems.
              </p>
              <div className="pt-1">
                <a
                  href="https://github.com/ahmad-461/typing-speed-test"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-mono font-bold text-white hover:text-[#3B82F6] transition-colors border-b border-white hover:border-[#3B82F6] pb-0.5"
                >
                  &gt; git clone https://github.com/ahmad-461/typing-speed-test.git
                </a>
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
