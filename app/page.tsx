"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getPersonalBest, getHistory } from "../lib/stats";

type Difficulty = "easy" | "medium" | "hard";
type Category = "code_arena" | "knowledge_quest" | "ai_lab" | "world_explorer" | "weak_key_drill";

const SNIPPETS = [
  "A compiler translates human-readable code into efficient machine language instructions.",
  "The light emitted from the sun takes approximately eight minutes to reach the Earth.",
  "Deep neural networks process vast layers of information to synthesize highly intricate patterns."
];

interface CustomWindow extends Window {
  scrollToConfig?: () => void;
}

export default function Home() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [hasPB, setHasPB] = useState(false);
  const [ghostEnabled, setGhostEnabled] = useState(false);
  const [pbWPM, setPbWPM] = useState<number | null>(null);
  const [historyLength, setHistoryLength] = useState(0);

  // Identity Gate and Callsign setup states
  const [playerName, setPlayerName] = useState<string>("");
  const [isIdentityInitialized, setIsIdentityInitialized] = useState<boolean>(true);
  const [callsignInput, setCallsignInput] = useState<string>("");
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editInput, setEditInput] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tst_player_name");
      if (!stored) {
        setIsIdentityInitialized(false);
      } else {
        setPlayerName(stored);
      }
    }
  }, []);

  // Sync state on name modal custom event
  useEffect(() => {
    const handleNameUpdated = () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("tst_player_name") || "";
        setPlayerName(stored);
      }
    };
    const handleOpenModal = () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("tst_player_name") || "";
        setEditInput(stored);
        setIsEditModalOpen(true);
      }
    };

    window.addEventListener("tst-name-updated", handleNameUpdated);
    window.addEventListener("tst-open-name-modal", handleOpenModal);
    return () => {
      window.removeEventListener("tst-name-updated", handleNameUpdated);
      window.removeEventListener("tst-open-name-modal", handleOpenModal);
    };
  }, []);

  const handleConfirmCallsign = (e: React.FormEvent) => {
    e.preventDefault();
    let sanitized = callsignInput.trim();
    // basic XSS tag removal
    sanitized = sanitized.replace(/<\/?[^>]+(>|$)/g, "");
    sanitized = sanitized.slice(0, 20);

    if (sanitized) {
      localStorage.setItem("tst_player_name", sanitized);
      setPlayerName(sanitized);
      setIsIdentityInitialized(true);
      window.dispatchEvent(new Event("tst-name-updated"));
    }
  };

  const handleUpdateCallsign = (e: React.FormEvent) => {
    e.preventDefault();
    let sanitized = editInput.trim();
    sanitized = sanitized.replace(/<\/?[^>]+(>|$)/g, "");
    sanitized = sanitized.slice(0, 20);

    if (sanitized) {
      localStorage.setItem("tst_player_name", sanitized);
      setPlayerName(sanitized);
      setIsEditModalOpen(false);
      window.dispatchEvent(new Event("tst-name-updated"));
    }
  };

  // PB check when difficulty changes
  useEffect(() => {
    const history = getHistory();
    setHistoryLength(history.length);
  }, []);

  // Live typing animation state for right column
  const [typedSnippet, setTypedSnippet] = useState("");
  const [snippetIndex, setSnippetIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reference to the main options area for the footer CTA scroll behavior
  const configSectionRef = useRef<HTMLDivElement>(null);

  // PB check when difficulty changes
  useEffect(() => {
    const pb = getPersonalBest(difficulty);
    setHasPB(!!pb);
    setPbWPM(pb ? pb.wpm : null);
    if (!pb) {
      setGhostEnabled(false);
    }
  }, [difficulty]);

  // Typing animation effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const currentPhrase = SNIPPETS[snippetIndex];

    if (isDeleting) {
      timer = setTimeout(() => {
        setTypedSnippet((prev) => prev.slice(0, -1));
      }, 30);
    } else {
      timer = setTimeout(() => {
        setTypedSnippet((prev) => currentPhrase.slice(0, prev.length + 1));
      }, 50);
    }

    if (!isDeleting && typedSnippet === currentPhrase) {
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 2500); // Wait before backspacing
    } else if (isDeleting && typedSnippet === "") {
      setIsDeleting(false);
      setSnippetIndex((prev) => (prev + 1) % SNIPPETS.length);
    }

    return () => clearTimeout(timer);
  }, [typedSnippet, isDeleting, snippetIndex]);

  // Setup click target for footer scroll-to-element
  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as unknown as CustomWindow;
      // Expose a global callback or trigger that the footer can execute
      win.scrollToConfig = () => {
        if (configSectionRef.current) {
          configSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
          // Highlight with a quick flash effect
          configSectionRef.current.classList.add("ring-2", "ring-electric-500/30");
          setTimeout(() => {
            if (configSectionRef.current) {
              configSectionRef.current.classList.remove("ring-2", "ring-electric-500/30");
            }
          }, 1000);
        }
      };
    }
    return () => {
      if (typeof window !== "undefined") {
        const win = window as unknown as CustomWindow;
        delete win.scrollToConfig;
      }
    };
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<HubCategory | null>(null);
  const [isLockedMessageVisible, setIsLockedMessageVisible] = useState<boolean>(false);

  // Gamification dashboard elements
  const [gamification, setGamification] = useState<{
    level: number;
    title: string;
    streak: number;
    totalXp: number;
    nextLevelXp: number | null;
    prevLevelXp: number;
  } | null>(null);

  const [testsToday, setTestsToday] = useState(0);
  const [closestAchievement, setClosestAchievement] = useState<{
    title: string;
    description: string;
    progressText: string;
    progressPct: number;
  } | null>(null);

  useEffect(() => {
    import("../lib/gamification").then(({ getGamificationState, ACHIEVEMENTS }) => {
      const state = getGamificationState();
      setGamification({
        level: state.currentLevel,
        title: state.levelTitle,
        streak: state.streakDays,
        totalXp: state.totalXp,
        nextLevelXp: state.nextLevelXp,
        prevLevelXp: state.prevLevelXp,
      });

      // Calculate tests completed today from chronological local history
      const history = getHistory();
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const countToday = history.filter((run) => run.timestamp >= todayStart).length;
      setTestsToday(countToday);

      // Closest locked achievement calculation
      const locked = ACHIEVEMENTS.filter((ach) => !state.unlockedAchievements.includes(ach.id));

      let bestProgressPct = -1;
      let targetAchievement = null;

      // Map progress metrics
      const codeArenaCount = history.filter((run) => run.category === "code_arena" || run.category === "programming").length;
      const knowledgeQuestCount = history.filter((run) => run.category === "knowledge_quest" || run.category === "general_knowledge").length;
      const totalTests = history.length;
      const pb = getPersonalBest();
      const hasPerfect = history.some((run) => run.accuracy === 100);

      locked.forEach((ach) => {
        let current = 0;
        let target = 1;

        if (ach.id === "speed_demon") {
          current = pb ? pb.wpm : 0;
          target = 80;
        } else if (ach.id === "perfect_accuracy") {
          current = hasPerfect ? 1 : 0;
          target = 1;
        } else if (ach.id === "seven_day_streak") {
          current = state.streakDays;
          target = 7;
        } else if (ach.id === "code_warrior") {
          current = codeArenaCount;
          target = 10;
        } else if (ach.id === "knowledge_master") {
          current = knowledgeQuestCount;
          target = 10;
        } else if (ach.id === "typing_legend_badge") {
          current = totalTests;
          target = 100;
        }

        const pct = Math.min(100, Math.max(0, (current / target) * 100));
        if (pct < 100 && pct > bestProgressPct) {
          bestProgressPct = pct;
          targetAchievement = {
            title: ach.title,
            description: ach.description,
            progressText: `${Math.min(target, current)}/${target}`,
            progressPct: pct,
          };
        }
      });

      // Default fallback first milestone if no closer locked achievement
      if (!targetAchievement) {
        targetAchievement = {
          title: "Code Warrior",
          description: "Complete 10 Code Arena tests",
          progressText: `${Math.min(10, codeArenaCount)}/10`,
          progressPct: Math.min(100, (codeArenaCount / 10) * 100),
        };
      }

      setClosestAchievement(targetAchievement);
    });
  }, []);

  const handleStartTest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedCategory) return;
    router.push(`/test?difficulty=${difficulty}&category=${selectedCategory}${ghostEnabled ? "&ghost=true" : ""}`);
  };

  const handleSelectMode = (mode: HubCategory) => {
    setIsLockedMessageVisible(false);
    if (mode === "weak_key_drill" && historyLength < 3) {
      setIsLockedMessageVisible(true);
      return;
    }
    setSelectedCategory(mode);
  };

  // Difficulty configurations with varying borders/glows representing progression
  const difficulties: { value: Difficulty; label: string; desc: string; styles: string; activeStyles: string }[] = [
    {
      value: "easy",
      label: "Easy Tier",
      desc: "~30 words. Clean vocabulary, basic punctuation.",
      styles: "border-emerald-500/10 hover:border-emerald-500/40 text-emerald-400 bg-charcoal-900/40",
      activeStyles: "border-emerald-500 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20",
    },
    {
      value: "medium",
      label: "Medium Tier",
      desc: "~60 words. Balanced prose, narrative sentences.",
      styles: "border-electric-500/10 hover:border-electric-500/40 text-electric-400 bg-charcoal-900/40",
      activeStyles: "border-electric-500 bg-electric-500/5 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-2 ring-electric-500/20",
    },
    {
      value: "hard",
      label: "Hard Tier",
      desc: "~100 words. Sophisticated jargon, high punctuation density.",
      styles: "border-rose-500/10 hover:border-rose-500/40 text-rose-400 bg-charcoal-900/40",
      activeStyles: "border-rose-500 bg-rose-500/5 shadow-[0_0_25px_rgba(244,63,94,0.25)] ring-[3px] ring-rose-500/30",
    },
  ];

  type HubCategory = Category | "speed_sprint";

  const categories: {
    value: HubCategory;
    label: string;
    desc: string;
    icon: string;
    accentColor: string;
    selectedAccent: string;
  }[] = [
    {
      value: "code_arena",
      label: "Code Arena",
      desc: "Master programming concepts and language history through typing",
      icon: "💻",
      accentColor: "border-emerald-500/10 hover:border-emerald-500/30 text-emerald-400",
      selectedAccent: "border-emerald-500 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20",
    },
    {
      value: "knowledge_quest",
      label: "Knowledge Quest",
      desc: "Discover science, history, and fascinating trivia",
      icon: "🧠",
      accentColor: "border-sky-500/10 hover:border-sky-500/30 text-sky-400",
      selectedAccent: "border-sky-500 bg-sky-500/5 shadow-[0_0_15px_rgba(14,165,233,0.15)] ring-1 ring-sky-500/20",
    },
    {
      value: "ai_lab",
      label: "AI Lab",
      desc: "Explore neural networks and future technology landscapes",
      icon: "🤖",
      accentColor: "border-teal-500/10 hover:border-teal-500/30 text-teal-400",
      selectedAccent: "border-teal-500 bg-teal-500/5 shadow-[0_0_15px_rgba(20,184,166,0.15)] ring-1 ring-teal-500/20",
    },
    {
      value: "world_explorer",
      label: "World Explorer",
      desc: "Travel the globe through scenic stories and facts",
      icon: "🌍",
      accentColor: "border-amber-500/10 hover:border-amber-500/30 text-amber-500",
      selectedAccent: "border-amber-500 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20",
    },
    {
      value: "speed_sprint",
      label: "Speed Sprint",
      desc: "Fast 20-second countdown mode. High pressure sifting.",
      icon: "⚡",
      accentColor: "border-rose-500/10 hover:border-rose-500/30 text-rose-500",
      selectedAccent: "border-rose-500 bg-rose-500/5 shadow-[0_0_15px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/20",
    },
    {
      value: "weak_key_drill",
      label: "Weak-Key Drill",
      desc: "Targeted practice on your historical weakest keystroke errors",
      icon: "🎯",
      accentColor: "border-slate-500/10 hover:border-slate-500/30 text-slate-400",
      selectedAccent: "border-[#3B82F6] bg-[#3B82F6]/5 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-[#3B82F6]/20",
    },
  ];

  if (!isIdentityInitialized) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[70vh] px-4 w-full max-w-md mx-auto animate-fade-in">
        <div className="w-full bg-[#121316] border border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Subtle top indicator bar */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-electric-500/50" />

          <div className="space-y-2 font-mono">
            <div className="text-slate-500 text-xs tracking-widest uppercase">
              &gt;_ SYSTEM_BOOT_SEQUENCE
            </div>
            <h1 className="text-sm font-bold text-rose-500 tracking-wider">
              &gt; IDENTITY PROTOCOL UNINITIALIZED // ENTER CALLSIGN
            </h1>
          </div>

          <form onSubmit={handleConfirmCallsign} className="space-y-4">
            <div>
              <label htmlFor="boot-callsign" className="sr-only">Callsign</label>
              <input
                id="boot-callsign"
                type="text"
                maxLength={20}
                required
                value={callsignInput}
                onChange={(e) => setCallsignInput(e.target.value)}
                placeholder="ENTER CALLSIGN..."
                className="w-full bg-[#0E0F11] border border-charcoal-700 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500/20 transition-all uppercase"
                autoComplete="off"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-electric-500 text-white font-semibold rounded-xl shadow-lg shadow-electric-500/15 hover:bg-electric-400 active:bg-electric-600 transition-all duration-200 hover-glow-electric font-mono text-xs uppercase tracking-wider cursor-pointer"
            >
              CONFIRM IDENTITY ✓
            </button>
          </form>

          <p className="text-[10px] font-mono text-slate-500 text-center uppercase tracking-widest pt-2">
            NOKY TERMINAL GATEWAY V2.1
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col w-full max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 animate-fade-in space-y-12">

      {/* Edit Callsign Modal Overlay */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E0F11]/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#121316] border-2 border-charcoal-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-electric-500" />

            <div className="flex justify-between items-start">
              <div className="space-y-1 font-mono">
                <span className="text-slate-500 text-[10px] tracking-widest uppercase">
                  &gt;_ CALLSIGN_CONFIGURATION
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Update Player Identity
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors font-mono text-xs cursor-pointer"
              >
                [ESC]
              </button>
            </div>

            <form onSubmit={handleUpdateCallsign} className="space-y-4">
              <div>
                <label htmlFor="edit-callsign" className="sr-only">New Callsign</label>
                <input
                  id="edit-callsign"
                  type="text"
                  maxLength={20}
                  required
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  placeholder="NEW CALLSIGN..."
                  className="w-full bg-[#0E0F11] border border-charcoal-700 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500/20 transition-all uppercase"
                  autoComplete="off"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700 text-slate-300 font-bold rounded-xl transition-all font-mono text-xs uppercase tracking-wider cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-electric-500 hover:bg-electric-400 text-white font-bold rounded-xl shadow-lg shadow-electric-500/15 transition-all font-mono text-xs uppercase tracking-wider cursor-pointer"
                >
                  UPDATE ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. PLAYER STATUS HEADER (HUD SAVE-FILE SUMMARY) */}
      <div className="w-full bg-[#121316] border border-[#1E293B] rounded-2xl p-6 shadow-2xl relative overflow-hidden select-none">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#3B82F6]/30 to-transparent" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-xs text-slate-400 tracking-wider uppercase">
                &gt; NOKY PROTOCOL SECURE LOADED
              </span>
            </div>

            {historyLength === 0 ? (
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-none">
                STATUS: <span className="text-rose-500">NEW RECRUIT INITIALIZED</span>
              </h1>
            ) : (
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-none">
                WELCOME BACK, <span className="text-electric-500">{playerName || "PILOT"}</span>
              </h1>
            )}

            <p className="text-xs text-slate-400 font-sans max-w-xl">
              Benchmarking typing response and spatial accuracy over raw, unfocused speed. Choose a mission portal below.
            </p>
          </div>

          {/* Quick HUD Metrics Block */}
          {gamification && (
            <div className="flex flex-wrap gap-4 font-mono text-xs">
              <div className="bg-[#0E0F11] border border-[#1E293B] rounded-xl px-4 py-3 min-w-[100px]">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">XP Level</div>
                <div className="text-white font-black text-sm">Lvl {gamification.level}</div>
                <div className="text-[9px] text-slate-400 truncate max-w-[90px]">{gamification.title}</div>
              </div>
              <div className="bg-[#0E0F11] border border-[#1E293B] rounded-xl px-4 py-3 min-w-[100px]">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Daily Streak</div>
                <div className="text-amber-500 font-black text-sm flex items-center gap-1">
                  <span>🔥</span> {gamification.streak} {gamification.streak === 1 ? "Day" : "Days"}
                </div>
                <div className="text-[9px] text-slate-400">Timezone Safe</div>
              </div>
              {pbWPM !== null && (
                <div className="bg-[#0E0F11] border border-[#1E293B] rounded-xl px-4 py-3 min-w-[100px]">
                  <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Personal Best</div>
                  <div className="text-sky-400 font-black text-sm">{pbWPM} WPM</div>
                  <div className="text-[9px] text-slate-400">All-Time Peak</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Locked message overlay for Weak-Key Drill */}
      {isLockedMessageVisible && (
        <div className="w-full bg-rose-500/10 border-2 border-rose-500/40 rounded-xl p-5 font-mono text-xs text-rose-300 flex items-center justify-between animate-fade-in shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <div className="flex items-center gap-2.5">
            <span>🔒</span>
            <div className="space-y-0.5">
              <div className="font-bold uppercase tracking-wider">Weak-Key Drill Mode Locked</div>
              <p className="text-slate-400 text-[11px]">
                Complete at least <span className="font-bold text-white">{3 - historyLength} more</span> standard typing tests to establish key error diagnostics.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLockedMessageVisible(false)}
            className="text-slate-400 hover:text-white font-bold px-2 py-1 border border-charcoal-700 rounded bg-charcoal-800 transition-all cursor-pointer uppercase text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* 2. SIX PRACTICE MODE PORTALS (DOMINANT VISUAL FOCUS) */}
      <div className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xs text-electric-500 bg-electric-500/10 px-2.5 py-0.5 rounded border border-electric-500/20 font-bold">01</span>
          <h2 className="text-sm font-mono text-slate-400 uppercase tracking-wider">SELECT PRACTICE MISSION</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((item) => {
            const isSelected = selectedCategory === item.value;
            const isLocked = item.value === "weak_key_drill" && historyLength < 3;

            return (
              <button
                key={item.value}
                onClick={() => handleSelectMode(item.value)}
                className={`relative flex flex-col text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer focus:outline-none focus:ring-1 group overflow-hidden ${
                  isLocked
                    ? "opacity-60 border-slate-700/40 bg-charcoal-900/10 select-none cursor-not-allowed hover:border-slate-700/60"
                    : isSelected
                      ? item.selectedAccent
                      : `border-charcoal-700 bg-charcoal-900/40 hover:bg-[#121316] ${item.accentColor}`
                }`}
              >
                {/* Subtle top indicator on selected cards */}
                {isSelected && (
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-current to-transparent" />
                )}

                <div className="flex items-center justify-between mb-3 w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl leading-none">{isLocked ? "🔒" : item.icon}</span>
                    <span className="font-mono text-sm uppercase tracking-wider font-bold text-white group-hover:text-white">
                      {item.label}
                    </span>
                  </div>

                  {item.value === "speed_sprint" && (
                    <span className="px-2 py-0.5 text-[8px] font-mono font-black bg-rose-500/20 text-rose-400 rounded border border-rose-500/30 uppercase tracking-wider animate-pulse">
                      HOT
                    </span>
                  )}
                  {isLocked && (
                    <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                      {historyLength}/3 Standard
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-sans">{item.desc}</p>

                {/* Visual hover border decoration */}
                <div className="absolute bottom-2 right-3 font-mono text-[9px] text-slate-600 uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                  {isLocked ? "Locked" : isSelected ? "Selected ✓" : "Activate Portal →"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MODE SELECTION FLOW (MISSION CONFIGURATION CONSOLE) */}
      {selectedCategory && (
        <div
          ref={configSectionRef}
          className="w-full bg-[#121316] border-2 border-charcoal-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-slide-up-fade"
        >
          <div className="flex items-center justify-between border-b border-charcoal-700 pb-4">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-electric-400 font-bold bg-electric-500/10 px-2.5 py-0.5 rounded border border-electric-500/20">02</span>
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-sans">
                Mission Configuration: <span className="text-electric-500 font-mono font-black">{selectedCategory.replace("_", " ")}</span>
              </h2>
            </div>

            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs font-mono text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              [CLOSE CONSOLE]
            </button>
          </div>

          {/* Difficulty Selection Column (Skip for Speed Sprint and Weak-Key Drill) */}
          {selectedCategory !== "speed_sprint" && selectedCategory !== "weak_key_drill" && (
            <div className="space-y-4">
              <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">Select Difficulty Tier</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {difficulties.map((item) => {
                  const isSelected = difficulty === item.value;
                  const borderWeight = item.value === "easy" ? "border" : item.value === "medium" ? "border-2" : "border-4";

                  return (
                    <button
                      key={item.value}
                      onClick={() => setDifficulty(item.value)}
                      className={`flex flex-col text-left p-5 rounded-xl transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 ${borderWeight} ${
                        isSelected
                          ? item.activeStyles
                          : `${item.styles} border-charcoal-700 hover:border-charcoal-500/60`
                      }`}
                    >
                      <span className={`font-mono text-[10px] uppercase tracking-widest font-extrabold mb-1 ${
                        item.value === "easy" ? "text-emerald-400" : item.value === "medium" ? "text-electric-400" : "text-rose-400"
                      }`}>
                        {item.label}
                      </span>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ghost Race Mode toggle - Only show when eligible and PB exists */}
          {selectedCategory !== "speed_sprint" && selectedCategory !== "weak_key_drill" && hasPB && (
            <div className="bg-[#0E0F11] border border-charcoal-700 rounded-xl p-4 flex items-center justify-between transition-all">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <span>👻</span> Ghost Race Mode
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                    ghostEnabled
                      ? "bg-electric-500/20 text-electric-400 border border-electric-500/30"
                      : "bg-charcoal-700 text-slate-400 border border-charcoal-600"
                  }`}>
                    {ghostEnabled ? "Active" : "Disabled"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-normal font-sans">
                  Race against your previous best run of <span className="text-electric-400 font-mono font-semibold">{pbWPM} WPM</span> on the {difficulty} tier.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGhostEnabled(!ghostEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-electric-500 ${
                  ghostEnabled ? "bg-electric-500" : "bg-charcoal-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    ghostEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}

          {/* Bottom Console Launch Controls */}
          <div className="pt-4 border-t border-charcoal-750/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-electric-500">⚡</span> Focus trigger maps dynamically on initialization.
            </div>

            <button
              onClick={handleStartTest}
              className="w-full sm:w-auto text-center px-12 py-4 bg-electric-500 text-white font-semibold rounded-xl shadow-lg shadow-electric-500/15 hover:bg-electric-400 active:bg-electric-600 focus:outline-none focus:ring-2 focus:ring-electric-500 transition-all duration-200 hover-glow-electric cursor-pointer text-sm uppercase tracking-wider font-mono font-extrabold"
            >
              LAUNCH PORTAL TEST 🚀
            </button>
          </div>
        </div>
      )}

      {/* 4. SESSION STATS STRIP (SECONDARY ELEMENT BELOW GRID) */}
      <div className="w-full bg-[#121316] border border-[#1E293B] rounded-2xl p-6 shadow-xl relative overflow-hidden select-none">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

          <div className="md:col-span-4 grid grid-cols-2 gap-4">
            <div className="bg-[#0E0F11] border border-[#1E293B] rounded-xl p-4 text-center font-mono">
              <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Today&apos;s Tests</div>
              <div className="text-white text-2xl font-black">{testsToday}</div>
            </div>
            <div className="bg-[#0E0F11] border border-[#1E293B] rounded-xl p-4 text-center font-mono">
              <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Current Streak</div>
              <div className="text-amber-500 text-2xl font-black">{gamification?.streak || 0}d</div>
            </div>
          </div>

          {/* Closest Locked Achievement Progress Bar */}
          {closestAchievement && (
            <div className="md:col-span-8 bg-[#0E0F11] border border-[#1E293B] rounded-xl p-4 sm:p-5 space-y-3 font-mono">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-electric-400 uppercase tracking-widest font-extrabold block">
                    {"// CLOSEST LOCKED ACHIEVEMENT"}
                  </span>
                  <h4 className="text-xs font-black text-white uppercase">{closestAchievement.title}</h4>
                  <p className="text-[10px] text-slate-500 leading-none">{closestAchievement.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-white font-bold">{closestAchievement.progressText}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="w-full h-2 bg-[#121316] rounded-full border border-charcoal-700/60 overflow-hidden">
                  <div
                    style={{ width: `${closestAchievement.progressPct}%` }}
                    className="h-full bg-electric-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                  />
                </div>
                <div className="flex justify-between text-[8px] text-slate-500 uppercase tracking-widest">
                  <span>Progress</span>
                  <span>{Math.round(closestAchievement.progressPct)}%</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
