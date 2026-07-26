export type TestResult = {
  id: string;
  wpm: number;
  accuracy: number;
  difficulty: "easy" | "medium" | "hard";
  timeTaken: number; // in seconds
  timestamp: number; // millisecond timestamp
  passageText: string;
};

// Key used in local storage
const STORAGE_KEY = "tst_history_v1";

/**
 * Retrieve all local test history.
 */
export function getHistory(): TestResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent first
    }
  } catch (e) {
    console.error("Failed to parse local test history:", e);
  }
  return [];
}

/**
 * Save a new completed test result.
 */
export function saveResult(result: Omit<TestResult, "id" | "timestamp">): TestResult {
  const newResult: TestResult = {
    ...result,
    id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15),
    timestamp: Date.now(),
  };

  if (typeof window !== "undefined") {
    try {
      const current = getHistory();
      const updated = [newResult, ...current];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save result to local history:", e);
    }
  }

  return newResult;
}

/**
 * Get personal best (PB) WPM for a specific difficulty or overall.
 */
export function getPersonalBest(difficulty?: "easy" | "medium" | "hard"): TestResult | null {
  const history = getHistory();
  if (history.length === 0) return null;

  const filtered = difficulty
    ? history.filter((r) => r.difficulty === difficulty)
    : history;

  if (filtered.length === 0) return null;

  return filtered.reduce((best, curr) => {
    if (curr.wpm > best.wpm) return curr;
    if (curr.wpm === best.wpm && curr.accuracy > best.accuracy) return curr;
    return best;
  }, filtered[0]);
}

/**
 * Compute average metrics across all history.
 */
export function getHistorySummary() {
  const history = getHistory();
  if (history.length === 0) {
    return {
      totalTests: 0,
      avgWpm: 0,
      avgAccuracy: 0,
    };
  }

  const totalTests = history.length;
  const sumWpm = history.reduce((sum, r) => sum + r.wpm, 0);
  const sumAccuracy = history.reduce((sum, r) => sum + r.accuracy, 0);

  return {
    totalTests,
    avgWpm: Math.round(sumWpm / totalTests),
    avgAccuracy: Math.round((sumAccuracy / totalTests) * 10) / 10,
  };
}
