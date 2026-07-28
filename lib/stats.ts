export type TestResult = {
  id: string;
  wpm: number;
  accuracy: number;
  difficulty: "easy" | "medium" | "hard" | "custom";
  category?: "code_arena" | "knowledge_quest" | "ai_lab" | "world_explorer" | "programming" | "general_knowledge" | "custom" | "speed_sprint" | "weak_key_drill";
  consistency?: number;
  timeTaken: number; // in seconds
  timestamp: number; // millisecond timestamp
  passageText: string;
  modeType?: "time" | "words" | "passage";
  modeDuration?: number;
  modeWordCount?: number;
};

// Key used in local storage
const STORAGE_KEY = "tst_history_v1";
const KEY_ERRORS_STORAGE_KEY = "tst_keyerrors_v1";
const KEY_TYPED_COUNTS_STORAGE_KEY = "tst_key_typed_counts_v1";

/**
 * Resolves a player name against the registry to preserve the first-entered casing,
 * updating the registry if it's a new name.
 */
export function resolvePlayerName(name: string): string {
  if (typeof window === "undefined" || !name) return name;
  try {
    const registryRaw = localStorage.getItem("tst_players_registry_v1");
    const registry: Record<string, string> = registryRaw ? JSON.parse(registryRaw) : {};
    const sanitized = name.trim().replace(/<\/?[^>]+(>|$)/g, "").slice(0, 20);
    const key = sanitized.toLowerCase();
    if (registry[key]) {
      return registry[key]; // Return first-entered casing
    } else if (sanitized) {
      registry[key] = sanitized;
      localStorage.setItem("tst_players_registry_v1", JSON.stringify(registry));
      return sanitized;
    }
  } catch (e) {
    console.error("Error resolving player name:", e);
  }
  return name;
}

/**
 * Retrieves the current player's name (and ensures casing is resolved).
 */
export function getPlayerName(): string {
  if (typeof window === "undefined") return "";
  const raw = localStorage.getItem("tst_player_name") || "";
  if (!raw) return "";
  const resolved = resolvePlayerName(raw);
  if (resolved !== raw) {
    localStorage.setItem("tst_player_name", resolved);
  }
  return resolved;
}

/**
 * Helper to get namespaced key for a specific player.
 */
export function getNamespacedKey(baseKey: string): string {
  const name = getPlayerName();
  if (!name) return baseKey; // fallback if no name yet
  return `${baseKey}:${name.toLowerCase()}`;
}

/**
 * Sets a new active player, resolving casing and running the legacy migration.
 */
export function setPlayerName(name: string): string {
  if (typeof window === "undefined") return name;
  const resolved = resolvePlayerName(name);
  localStorage.setItem("tst_player_name", resolved);

  // Dispatch custom events to keep other components in sync
  window.dispatchEvent(new CustomEvent("tst-name-updated", { detail: resolved }));

  // Migrate if there was any legacy flat data
  migrateLegacyData();

  // Also dispatch gamification update event so that header/hub refresh with the correct player's data
  window.dispatchEvent(new CustomEvent("tst-gamification-updated"));
  return resolved;
}

/**
 * Migrates flat legacy keys to namespaced keys under the current player's name.
 */
export function migrateLegacyData() {
  if (typeof window === "undefined") return;

  // Only migrate if there is a current player name
  const currentName = localStorage.getItem("tst_player_name");
  if (!currentName) return;

  const resolvedName = resolvePlayerName(currentName);
  const lowerName = resolvedName.toLowerCase();

  const keysToMigrate = [
    "tst_history_v1",
    "tst_xp_v1",
    "tst_achievements_v1",
    "tst_streak_days_v1",
    "tst_last_streak_timestamp_v1",
    "tst_streak_reset_notified_v1",
    "tst_keyerrors_v1",
    "tst_key_typed_counts_v1",
    "tst_personal_wpm_goal_v1"
  ];

  let migratedAny = false;
  for (const key of keysToMigrate) {
    const legacyValue = localStorage.getItem(key);
    if (legacyValue !== null) {
      const newKey = `${key}:${lowerName}`;
      // Check if namespaced key doesn't already have data to prevent overwriting
      if (localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, legacyValue);
      }
      localStorage.removeItem(key);
      migratedAny = true;
    }
  }

  if (migratedAny) {
    console.log(`Successfully migrated legacy data to namespaced keys for player: ${resolvedName}`);
  }
}

// Automatically trigger migration if imported in client environment and there is a player name
if (typeof window !== "undefined") {
  migrateLegacyData();
}

/**
 * Retrieve all local test history.
 */
export function getHistory(): TestResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getNamespacedKey(STORAGE_KEY));
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
      localStorage.setItem(getNamespacedKey(STORAGE_KEY), JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save result to local history:", e);
    }
  }

  return newResult;
}

/**
 * Get personal best (PB) WPM for a specific difficulty or overall.
 */
export function getPersonalBest(difficulty?: "easy" | "medium" | "hard" | "custom", preloadedHistory?: TestResult[]): TestResult | null {
  const history = preloadedHistory || getHistory();
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
export function getHistorySummary(preloadedHistory?: TestResult[]) {
  const history = preloadedHistory || getHistory();
  if (history.length === 0) {
    return {
      totalTests: 0,
      avgWpm: 0,
      avgAccuracy: 0,
      avgConsistency: 0,
    };
  }

  const totalTests = history.length;
  const sumWpm = history.reduce((sum, r) => sum + r.wpm, 0);
  const sumAccuracy = history.reduce((sum, r) => sum + r.accuracy, 0);

  const testsWithConsistency = history.filter((r) => typeof r.consistency === "number");
  const avgConsistency = testsWithConsistency.length > 0
    ? Math.round(testsWithConsistency.reduce((sum, r) => sum + (r.consistency || 0), 0) / testsWithConsistency.length)
    : 0;

  return {
    totalTests,
    avgWpm: Math.round(sumWpm / totalTests),
    avgAccuracy: Math.round((sumAccuracy / totalTests) * 10) / 10,
    avgConsistency,
  };
}

/**
 * Get aggregated key errors from local storage.
 */
export function getKeyErrors(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(getNamespacedKey(KEY_ERRORS_STORAGE_KEY));
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Failed to load key errors:", e);
    return {};
  }
}

/**
 * Save / increment aggregated key errors.
 */
export function saveKeyErrors(errors: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    const current = getKeyErrors();
    const updated = { ...current };
    for (const [key, count] of Object.entries(errors)) {
      const normalizedKey = key.toUpperCase();
      updated[normalizedKey] = (updated[normalizedKey] || 0) + count;
    }
    localStorage.setItem(getNamespacedKey(KEY_ERRORS_STORAGE_KEY), JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save key errors:", e);
  }
}

/**
 * Get aggregated key typed counts from local storage.
 */
export function getKeyTypedCounts(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(getNamespacedKey(KEY_TYPED_COUNTS_STORAGE_KEY));
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Failed to load key typed counts:", e);
    return {};
  }
}

/**
 * Save / increment aggregated key typed counts.
 */
export function saveKeyTypedCounts(counts: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    const current = getKeyTypedCounts();
    const updated = { ...current };
    for (const [key, count] of Object.entries(counts)) {
      const normalizedKey = key.toUpperCase();
      updated[normalizedKey] = (updated[normalizedKey] || 0) + count;
    }
    localStorage.setItem(getNamespacedKey(KEY_TYPED_COUNTS_STORAGE_KEY), JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save key typed counts:", e);
  }
}

/**
 * Get user's weakest keys (A-Z, SPACE) sorted by highest error rate.
 * Only returns keys that actually have some errors.
 */
export function getWeakestKeys(limit = 8): string[] {
  const errors = getKeyErrors();
  const typed = getKeyTypedCounts();

  const validKeys = [
    "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P",
    "A", "S", "D", "F", "G", "H", "J", "K", "L",
    "Z", "X", "C", "V", "B", "N", "M", "SPACE"
  ];

  const candidates = validKeys.filter((key) => (errors[key] || 0) > 0);

  // Sort candidates by error rate (errors / typed_count) descending.
  // If a key has errors but no typed count recorded, rate is 1.0 (100% error rate).
  candidates.sort((a, b) => {
    const errA = errors[a] || 0;
    const typA = typed[a] || errA || 1;
    const rateA = errA / typA;

    const errB = errors[b] || 0;
    const typB = typed[b] || errB || 1;
    const rateB = errB / typB;

    if (rateB !== rateA) {
      return rateB - rateA; // Highest error rate first
    }
    return errB - errA; // Tie breaker: higher error count first
  });

  return candidates.slice(0, limit);
}

export interface TrendComparison {
  thisWeekWpm: number | null;
  thisWeekAcc: number | null;
  lastWeekWpm: number | null;
  lastWeekAcc: number | null;
  wpmDiff: number | null;
  accDiff: number | null;
}

/**
 * Calculates average WPM and Accuracy comparison between:
 * - This Week: rolling last 7 days (now back to now - 7 days)
 * - Last Week: rolling 7 days prior (now - 7 days back to now - 14 days)
 */
export function getTrendComparison(preloadedHistory?: TestResult[]): TrendComparison {
  const history = preloadedHistory || getHistory();
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

  const thisWeekTests = history.filter(
    (r) => r.timestamp >= now - SEVEN_DAYS_MS && r.timestamp <= now
  );
  const lastWeekTests = history.filter(
    (r) => r.timestamp >= now - 2 * SEVEN_DAYS_MS && r.timestamp < now - SEVEN_DAYS_MS
  );

  const thisWeekWpm = thisWeekTests.length > 0
    ? Math.round(thisWeekTests.reduce((sum, r) => sum + r.wpm, 0) / thisWeekTests.length)
    : null;
  const thisWeekAcc = thisWeekTests.length > 0
    ? Math.round((thisWeekTests.reduce((sum, r) => sum + r.accuracy, 0) / thisWeekTests.length) * 10) / 10
    : null;

  const lastWeekWpm = lastWeekTests.length > 0
    ? Math.round(lastWeekTests.reduce((sum, r) => sum + r.wpm, 0) / lastWeekTests.length)
    : null;
  const lastWeekAcc = lastWeekTests.length > 0
    ? Math.round((lastWeekTests.reduce((sum, r) => sum + r.accuracy, 0) / lastWeekTests.length) * 10) / 10
    : null;

  const wpmDiff = (thisWeekWpm !== null && lastWeekWpm !== null)
    ? thisWeekWpm - lastWeekWpm
    : null;
  const accDiff = (thisWeekAcc !== null && lastWeekAcc !== null)
    ? Math.round((thisWeekAcc - lastWeekAcc) * 10) / 10
    : null;

  return {
    thisWeekWpm,
    thisWeekAcc,
    lastWeekWpm,
    lastWeekAcc,
    wpmDiff,
    accDiff,
  };
}
