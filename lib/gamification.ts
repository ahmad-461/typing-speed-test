import { TestResult, getHistory, getNamespacedKey } from "./stats";

export interface GamificationState {
  totalXp: number;
  currentLevel: number;
  levelTitle: string;
  nextLevelXp: number | null; // null if max level reached
  prevLevelXp: number;       // base XP for current level
  streakDays: number;
  unlockedAchievements: string[];
  achievementUnlockDates: Record<string, number>;
  streakResetOccurred: boolean; // Flag to indicate a reset happened
  stats: {
    bestWpm: number;
    bestAccuracy: number;
    maxStreak: number;
    codeArenaCount: number;
    knowledgeQuestCount: number;
    totalTests: number;
  };
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
    description: "Reach 80+ WPM in any test. Reflects superior motor control and rapid finger reflexes.",
    condition: "Reach 80+ WPM in any completed test",
  },
  {
    id: "perfect_accuracy",
    title: "Perfect Accuracy",
    description: "Achieve exactly 100% precision. Reflects absolute muscle discipline and mental poise under speed pressure.",
    condition: "Achieve exactly 100% accuracy",
  },
  {
    id: "seven_day_streak",
    title: "7-Day Streak",
    description: "Practice 7 consecutive days. Reflects habits compounding and neural pathways forming.",
    condition: "Maintain a daily typing streak for 7 consecutive days",
  },
  {
    id: "code_warrior",
    title: "Code Warrior",
    description: "Complete 10 Code Arena tests. Reflects deep familiarity with technical vocabulary and software concepts.",
    condition: "Complete 10 or more tests in the Code Arena category",
  },
  {
    id: "knowledge_master",
    title: "Knowledge Quest Master",
    description: "Complete 10 Knowledge Quest tests. Reflects vocabulary breadth and curiosity in general science and history.",
    condition: "Complete 10 or more tests in the Knowledge Quest category",
  },
  {
    id: "typing_legend_badge",
    title: "Typing Legend",
    description: "Complete 100 typing tests total. Reflects outstanding mastery, endurance, and dedication to the craft.",
    condition: "Complete 100 typing tests total across your history",
  },
  {
    id: "goal_crusher",
    title: "Goal Crusher",
    description: "Reach your personal WPM goal. Reflects dedication, grit, and deliberate practice.",
    condition: "Reach or exceed your user-defined WPM goal in a test",
  },
  {
    id: "trend_setter",
    title: "Trend Setter",
    description: "Improve average WPM week-over-week 3 times in a row. Reflects consistent, upward skill compounding over time.",
    condition: "Improve average WPM across three consecutive active weeks of testing",
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
const PERSONAL_WPM_GOAL_KEY = "tst_personal_wpm_goal_v1";

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
 * Helper to get year and week key from timestamp.
 */
function getYearWeek(timestamp: number): string {
  const date = new Date(timestamp);
  const day = date.getDay();
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - day);
  const y = sunday.getFullYear();
  const m = sunday.getMonth() + 1;
  const d = sunday.getDate();
  return `${y}-W${m}-${d}`;
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
  let maxStreak = 0;
  let lastTimestamp: number | null = null;
  const unlockedAchievements: Set<string> = new Set();
  const achievementUnlockDates: Record<string, number> = {};

  let codeArenaCount = 0;
  let knowledgeQuestCount = 0;
  let bestWpm = 0;
  let bestAccuracy = 0;

  for (let i = 0; i < chronologicalHistory.length; i++) {
    const run = chronologicalHistory[i];

    if (run.wpm > bestWpm) bestWpm = run.wpm;
    if (run.accuracy > bestAccuracy) bestAccuracy = run.accuracy;

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

    if (streakDays > maxStreak) {
      maxStreak = streakDays;
    }

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
    const checkUnlock = (id: string, conditionMet: boolean) => {
      if (conditionMet && !unlockedAchievements.has(id)) {
        unlockedAchievements.add(id);
        achievementUnlockDates[id] = run.timestamp;
      }
    };

    checkUnlock("speed_demon", run.wpm >= 80);
    checkUnlock("perfect_accuracy", run.accuracy === 100);
    checkUnlock("seven_day_streak", streakDays >= 7);
    checkUnlock("code_warrior", codeArenaCount >= 10);
    checkUnlock("knowledge_master", knowledgeQuestCount >= 10);
    checkUnlock("typing_legend_badge", i + 1 >= 100);
  }

  // 5. Evaluate custom goal and trend setter achievements (can check post chronological loop)
  if (typeof window !== "undefined") {
    // Check Goal Crusher
    const rawGoal = localStorage.getItem(getNamespacedKey(PERSONAL_WPM_GOAL_KEY));
    if (rawGoal) {
      const goal = parseInt(rawGoal, 10);
      if (!isNaN(goal) && goal > 0) {
        const matchingRun = chronologicalHistory.find((run) => run.wpm >= goal);
        if (matchingRun) {
          unlockedAchievements.add("goal_crusher");
          achievementUnlockDates["goal_crusher"] = matchingRun.timestamp;
        }
      }
    }

    // Check Trend Setter (Improve WPM week-over-week 3 times in a row)
    if (chronologicalHistory.length >= 4) {
      const weekGroups: Record<string, { totalWpm: number; count: number; timestamp: number }> = {};
      for (const run of chronologicalHistory) {
        const wk = getYearWeek(run.timestamp);
        if (!weekGroups[wk]) {
          weekGroups[wk] = { totalWpm: 0, count: 0, timestamp: run.timestamp };
        }
        weekGroups[wk].totalWpm += run.wpm;
        weekGroups[wk].count += 1;
        if (run.timestamp > weekGroups[wk].timestamp) {
          weekGroups[wk].timestamp = run.timestamp;
        }
      }

      const sortedWeeks = Object.keys(weekGroups)
        .map((wk) => ({
          weekKey: wk,
          avgWpm: weekGroups[wk].totalWpm / weekGroups[wk].count,
          timestamp: weekGroups[wk].timestamp,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

      // We need 3 consecutive increases in the active week array: sortedWeeks[i] > sortedWeeks[i-1] > sortedWeeks[i-2] > sortedWeeks[i-3]
      for (let i = 3; i < sortedWeeks.length; i++) {
        if (
          sortedWeeks[i].avgWpm > sortedWeeks[i - 1].avgWpm &&
          sortedWeeks[i - 1].avgWpm > sortedWeeks[i - 2].avgWpm &&
          sortedWeeks[i - 2].avgWpm > sortedWeeks[i - 3].avgWpm
        ) {
          unlockedAchievements.add("trend_setter");
          achievementUnlockDates["trend_setter"] = sortedWeeks[i].timestamp;
          break; // Stop at first occurrence
        }
      }
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
    achievementUnlockDates,
    streakResetOccurred,
    stats: {
      bestWpm,
      bestAccuracy,
      maxStreak,
      codeArenaCount,
      knowledgeQuestCount,
      totalTests: chronologicalHistory.length,
    },
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
      achievementUnlockDates: {},
      streakResetOccurred: false,
      stats: {
        bestWpm: 0,
        bestAccuracy: 0,
        maxStreak: 0,
        codeArenaCount: 0,
        knowledgeQuestCount: 0,
        totalTests: 0,
      },
    };
  }

  const history = getHistory();

  // We should compute everything retroactively to stay robust, keeping tst_history_v1 as our single source of truth.
  const state = computeRetroactiveState(history);

  // Sync state to local storage to be sure other pages read correct/consistent parameters
  localStorage.setItem(getNamespacedKey(XP_STORAGE_KEY), state.totalXp.toString());
  localStorage.setItem(getNamespacedKey(STREAK_DAYS_STORAGE_KEY), state.streakDays.toString());
  localStorage.setItem(getNamespacedKey(ACHIEVEMENTS_STORAGE_KEY), JSON.stringify(state.unlockedAchievements));
  if (history.length > 0) {
    const latestRun = [...history].sort((a, b) => b.timestamp - a.timestamp)[0];
    localStorage.setItem(getNamespacedKey(LAST_STREAK_TIMESTAMP_KEY), latestRun.timestamp.toString());
  }

  // Handle streak reset notification status
  const wasResetNotified = localStorage.getItem(getNamespacedKey(STREAK_RESET_NOTIFIED_KEY)) === "true";
  if (state.streakResetOccurred && !wasResetNotified) {
    // A reset happened but wasn't notified yet. We'll leave it to Header to read streakResetOccurred as true.
  } else if (!state.streakResetOccurred) {
    // If no reset, clear notification flag
    localStorage.removeItem(getNamespacedKey(STREAK_RESET_NOTIFIED_KEY));
  }

  return state;
}

/**
 * Marks streak reset as acknowledged by the user.
 */
export function acknowledgeStreakReset() {
  if (typeof window !== "undefined") {
    localStorage.setItem(getNamespacedKey(STREAK_RESET_NOTIFIED_KEY), "true");
  }
}

/**
 * Check if the streak reset is acknowledged.
 */
export function isStreakResetNotified(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(getNamespacedKey(STREAK_RESET_NOTIFIED_KEY)) === "true";
}

export interface MilestoneEvent {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  icon: string;
}

/**
 * Retroactively calculates key milestones achieved based on player history.
 */
export function computeMilestones(history: TestResult[]): MilestoneEvent[] {
  const chronologicalHistory = [...history].sort((a, b) => a.timestamp - b.timestamp);
  const milestones: MilestoneEvent[] = [];

  let accumulatedXp = 0;
  let streakDays = 0;
  let lastTimestamp: number | null = null;

  let triggered50Wpm = false;
  let triggered80Wpm = false;
  let triggered100Acc = false;
  let triggeredLvl2 = false;
  let triggeredLvl3 = false;
  let triggered10Tests = false;
  let triggered50Tests = false;
  let triggered100Tests = false;

  for (let i = 0; i < chronologicalHistory.length; i++) {
    const run = chronologicalHistory[i];
    const testNum = i + 1;

    // Calculate streak and XP for this run
    if (lastTimestamp === null) {
      streakDays = 1;
    } else {
      if (isSameDay(lastTimestamp, run.timestamp)) {
        // Same day
      } else if (isConsecutiveDay(lastTimestamp, run.timestamp)) {
        streakDays += 1;
      } else {
        streakDays = 1;
      }
    }
    lastTimestamp = run.timestamp;

    const { total } = calculateXpForTest(run.wpm, run.accuracy, run.difficulty, streakDays);
    accumulatedXp += total;
    const lvlInfo = getLevelForXp(accumulatedXp);

    // Check milestones
    if (run.wpm >= 50 && !triggered50Wpm) {
      triggered50Wpm = true;
      milestones.push({
        id: "first_50_wpm",
        title: "First 50+ WPM Test",
        description: `Broke the 50 WPM barrier with a ${run.wpm} WPM run!`,
        timestamp: run.timestamp,
        icon: "⚡",
      });
    }

    if (run.wpm >= 80 && !triggered80Wpm) {
      triggered80Wpm = true;
      milestones.push({
        id: "first_80_wpm",
        title: "First 80+ WPM Test",
        description: `Achieved elite speed of ${run.wpm} WPM on ${run.difficulty} difficulty!`,
        timestamp: run.timestamp,
        icon: "🚀",
      });
    }

    if (run.accuracy === 100 && !triggered100Acc) {
      triggered100Acc = true;
      milestones.push({
        id: "first_100_acc",
        title: "Perfect 100% Accuracy",
        description: "Typed with absolute perfection — not a single mistake!",
        timestamp: run.timestamp,
        icon: "🎯",
      });
    }

    if (lvlInfo.level >= 2 && !triggeredLvl2) {
      triggeredLvl2 = true;
      milestones.push({
        id: "reach_lvl_2",
        title: "Reached Level 2",
        description: "Promoted to Typist status. Practice is compounding!",
        timestamp: run.timestamp,
        icon: "⭐",
      });
    }

    if (lvlInfo.level >= 3 && !triggeredLvl3) {
      triggeredLvl3 = true;
      milestones.push({
        id: "reach_lvl_3",
        title: "Reached Level 3",
        description: "Unlocked Speed Runner rank. Fast fingers, sharp focus!",
        timestamp: run.timestamp,
        icon: "👑",
      });
    }

    if (testNum >= 10 && !triggered10Tests) {
      triggered10Tests = true;
      milestones.push({
        id: "completed_10_tests",
        title: "10 Tests Completed",
        description: "Established a solid baseline with 10 completed benchmarks.",
        timestamp: run.timestamp,
        icon: "📦",
      });
    }

    if (testNum >= 50 && !triggered50Tests) {
      triggered50Tests = true;
      milestones.push({
        id: "completed_50_tests",
        title: "50 Tests Completed",
        description: "Halfway to legendary! Muscle memory is deeply forming.",
        timestamp: run.timestamp,
        icon: "🔥",
      });
    }

    if (testNum >= 100 && !triggered100Tests) {
      triggered100Tests = true;
      milestones.push({
        id: "completed_100_tests",
        title: "100 Tests Completed",
        description: "Typing Legend! Your dedication to keyboard response is unmatched.",
        timestamp: run.timestamp,
        icon: "🏆",
      });
    }
  }

  // Sort milestones newest first for intuitive timeline reading
  return milestones.sort((a, b) => b.timestamp - a.timestamp);
}
