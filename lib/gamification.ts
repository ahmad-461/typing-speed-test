import { TestResult, getHistory } from "./stats";

export interface GamificationState {
  totalXp: number;
  currentLevel: number;
  levelTitle: string;
  nextLevelXp: number | null; // null if max level reached
  prevLevelXp: number;       // base XP for current level
  streakDays: number;
  unlockedAchievements: string[];
  streakResetOccurred: boolean; // Flag to indicate a reset happened
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  condition: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "speed_demon",
    title: "Speed Demon",
    description: "Reach 80+ WPM in any test",
    condition: "Reach 80+ WPM in any completed test",
  },
  {
    id: "perfect_accuracy",
    title: "Perfect Accuracy",
    description: "Achieve 100% accuracy in any test",
    condition: "Achieve exactly 100% accuracy",
  },
  {
    id: "seven_day_streak",
    title: "7-Day Streak",
    description: "Practice 7 consecutive days",
    condition: "Maintain a daily typing streak for 7 consecutive days",
  },
  {
    id: "code_warrior",
    title: "Code Warrior",
    description: "Complete 10 Code Arena tests",
    condition: "Complete 10 or more tests in the Code Arena category",
  },
  {
    id: "knowledge_master",
    title: "Knowledge Quest Master",
    description: "Complete 10 Knowledge Quest tests",
    condition: "Complete 10 or more tests in the Knowledge Quest category",
  },
  {
    id: "typing_legend_badge",
    title: "Typing Legend",
    description: "Complete 100 typing tests total",
    condition: "Complete 100 typing tests total across your history",
  },
];

export interface LevelInfo {
  level: number;
  title: string;
  minXp: number;
}

export const LEVELS: LevelInfo[] = [
  { level: 1, title: "Beginner", minXp: 0 },
  { level: 2, title: "Typist", minXp: 500 },
  { level: 3, title: "Speed Runner", minXp: 1500 },
  { level: 4, title: "Code Warrior", minXp: 3000 },
  { level: 5, title: "Typing Master", minXp: 6000 },
  { level: 6, title: "Typing Legend", minXp: 10000 },
];

const XP_STORAGE_KEY = "tst_xp_v1";
const ACHIEVEMENTS_STORAGE_KEY = "tst_achievements_v1";
const STREAK_DAYS_STORAGE_KEY = "tst_streak_days_v1";
const LAST_STREAK_TIMESTAMP_KEY = "tst_last_streak_timestamp_v1";
const STREAK_RESET_NOTIFIED_KEY = "tst_streak_reset_notified_v1";

/**
 * Checks if two millisecond timestamps represent the same calendar day in the local timezone.
 */
export function isSameDay(t1: number, t2: number): boolean {
  const d1 = new Date(t1);
  const d2 = new Date(t2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Checks if two millisecond timestamps represent consecutive calendar days in the local timezone.
 * t2 is expected to be after t1.
 */
export function isConsecutiveDay(t1: number, t2: number): boolean {
  const d1 = new Date(t1);
  const d2 = new Date(t2);

  // Strip hours/minutes/seconds
  const d1Start = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
  const d2Start = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();

  const diffMs = d2Start - d1Start;
  const oneDayMs = 24 * 60 * 60 * 1000;
  return diffMs === oneDayMs;
}

/**
 * Calculates XP earned for a single test.
 */
export function calculateXpForTest(
  wpm: number,
  accuracy: number,
  difficulty: "easy" | "medium" | "hard" | "custom",
  streakDays: number
): { base: number; bonus: number; total: number } {
  const difficultyMultiplier =
    difficulty === "easy" ? 5 : difficulty === "medium" ? 10 : difficulty === "hard" ? 20 : 5;

  const base = Math.round(wpm * 0.5 + accuracy * 0.3 + difficultyMultiplier);

  // Streak bonus:
  // Streak < 3: No bonus
  // Streak 3-4 days: +10% bonus
  // Streak 5-6 days: +15% bonus
  // Streak 7+ days: +20% bonus
  let multiplier = 0;
  if (streakDays >= 7) {
    multiplier = 0.20;
  } else if (streakDays >= 5) {
    multiplier = 0.15;
  } else if (streakDays >= 3) {
    multiplier = 0.10;
  }

  const bonus = Math.round(base * multiplier);
  const total = base + bonus;

  return { base, bonus, total };
}

/**
 * Helper to get the level details based on current XP.
 */
export function getLevelForXp(xp: number): LevelInfo {
  // Sort descending by minXp to find the highest unlocked level
  const sortedLevels = [...LEVELS].sort((a, b) => b.minXp - a.minXp);
  const current = sortedLevels.find((lvl) => xp >= lvl.minXp);
  return current || LEVELS[0];
}

/**
 * Helper to get the next level details.
 */
export function getNextLevelInfo(currentLevelNum: number): LevelInfo | null {
  return LEVELS.find((lvl) => lvl.level === currentLevelNum + 1) || null;
}

/**
 * Retroactively calculates the gamification state by replaying history.
 * This is timezone-stable, reproducible, and updates all local states.
 */
export function computeRetroactiveState(history: TestResult[]): GamificationState {
  // We need to replay the history in chronological order (oldest first)
  const chronologicalHistory = [...history].sort((a, b) => a.timestamp - b.timestamp);

  let totalXp = 0;
  let streakDays = 0;
  let lastTimestamp: number | null = null;
  const unlockedAchievements: Set<string> = new Set();

  let codeArenaCount = 0;
  let knowledgeQuestCount = 0;

  for (let i = 0; i < chronologicalHistory.length; i++) {
    const run = chronologicalHistory[i];

    // 1. Calculate streak at the time of this run
    if (lastTimestamp === null) {
      streakDays = 1;
    } else {
      if (isSameDay(lastTimestamp, run.timestamp)) {
        // Same day: streak stays same
      } else if (isConsecutiveDay(lastTimestamp, run.timestamp)) {
        // Consecutive day: streak increases
        streakDays += 1;
      } else {
        // Gap: streak resets to 1
        streakDays = 1;
      }
    }
    lastTimestamp = run.timestamp;

    // 2. Award XP
    const { total } = calculateXpForTest(run.wpm, run.accuracy, run.difficulty, streakDays);
    totalXp += total;

    // 3. Category completions
    if (run.category === "code_arena" || run.category === "programming") {
      codeArenaCount++;
    } else if (run.category === "knowledge_quest" || run.category === "general_knowledge") {
      knowledgeQuestCount++;
    }

    // 4. Evaluate achievements
    if (run.wpm >= 80) {
      unlockedAchievements.add("speed_demon");
    }
    if (run.accuracy === 100) {
      unlockedAchievements.add("perfect_accuracy");
    }
    if (streakDays >= 7) {
      unlockedAchievements.add("seven_day_streak");
    }
    if (codeArenaCount >= 10) {
      unlockedAchievements.add("code_warrior");
    }
    if (knowledgeQuestCount >= 10) {
      unlockedAchievements.add("knowledge_master");
    }
    if (i + 1 >= 100) {
      unlockedAchievements.add("typing_legend_badge");
    }
  }

  // Evaluate current real-time streak decay (has the user missed today AND yesterday?)
  // If last run is older than yesterday, the streak should reset to 0 in active display.
  let activeStreak = streakDays;
  let streakResetOccurred = false;

  if (lastTimestamp !== null) {
    const now = Date.now();
    const isToday = isSameDay(lastTimestamp, now);
    const isYesterday = isConsecutiveDay(lastTimestamp, now);

    if (!isToday && !isYesterday) {
      // Missed active window
      activeStreak = 0;
      streakResetOccurred = true;
    }
  } else {
    activeStreak = 0;
  }

  const currentLvlInfo = getLevelForXp(totalXp);
  const nextLvlInfo = getNextLevelInfo(currentLvlInfo.level);

  return {
    totalXp,
    currentLevel: currentLvlInfo.level,
    levelTitle: currentLvlInfo.title,
    nextLevelXp: nextLvlInfo ? nextLvlInfo.minXp : null,
    prevLevelXp: currentLvlInfo.minXp,
    streakDays: activeStreak,
    unlockedAchievements: Array.from(unlockedAchievements),
    streakResetOccurred,
  };
}

/**
 * Initializes and reads Gamification state. Handles first-time setup or retroactive updates.
 */
export function getGamificationState(): GamificationState {
  if (typeof window === "undefined") {
    return {
      totalXp: 0,
      currentLevel: 1,
      levelTitle: "Beginner",
      nextLevelXp: 500,
      prevLevelXp: 0,
      streakDays: 0,
      unlockedAchievements: [],
      streakResetOccurred: false,
    };
  }

  const history = getHistory();

  // We should compute everything retroactively to stay robust, keeping tst_history_v1 as our single source of truth.
  const state = computeRetroactiveState(history);

  // Sync state to local storage to be sure other pages read correct/consistent parameters
  localStorage.setItem(XP_STORAGE_KEY, state.totalXp.toString());
  localStorage.setItem(STREAK_DAYS_STORAGE_KEY, state.streakDays.toString());
  localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(state.unlockedAchievements));
  if (history.length > 0) {
    const latestRun = [...history].sort((a, b) => b.timestamp - a.timestamp)[0];
    localStorage.setItem(LAST_STREAK_TIMESTAMP_KEY, latestRun.timestamp.toString());
  }

  // Handle streak reset notification status
  const wasResetNotified = localStorage.getItem(STREAK_RESET_NOTIFIED_KEY) === "true";
  if (state.streakResetOccurred && !wasResetNotified) {
    // A reset happened but wasn't notified yet. We'll leave it to Header to read streakResetOccurred as true.
  } else if (!state.streakResetOccurred) {
    // If no reset, clear notification flag
    localStorage.removeItem(STREAK_RESET_NOTIFIED_KEY);
  }

  return state;
}

/**
 * Marks streak reset as acknowledged by the user.
 */
export function acknowledgeStreakReset() {
  if (typeof window !== "undefined") {
    localStorage.setItem(STREAK_RESET_NOTIFIED_KEY, "true");
  }
}

/**
 * Check if the streak reset is acknowledged.
 */
export function isStreakResetNotified(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STREAK_RESET_NOTIFIED_KEY) === "true";
}
