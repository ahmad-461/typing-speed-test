# Typing Speed Test (NOKY) — Full Codebase Audit

**Date of Audit:** February 2026
**Auditor:** Jules, Elite Software Engineer
**Repository:** `ahmad-461/typing-speed-test`

This document presents a comprehensive, read-only technical audit of the Typing Speed Test (NOKY) application codebase. The audit covers functional completeness, bugs, data and state management, performance, accessibility, security, and codebase organization.

---

## Executive Summary
NOKY is an exceptionally well-engineered, feature-rich speed typing application styled with a gorgeous, high-impact dark developer terminal theme. The application successfully compiles with zero errors and zero warnings, and ESLint checks are pristine. No critical code-breaking bugs or hardcoded API keys are present.

However, several minor and moderate issues have been identified during this audit—primarily relating to visual color leaks in unlockable skins, state leakages between user scopes, low color contrast on untyped prompt text, and potential animation performance jank in mouse-tracking effects.

### Key Finding Severities
- **CRITICAL**: 0
- **MODERATE**: 5
- **MINOR**: 4
- **SUGGESTION**: 4

---

## 1. Functional Completeness
An audit of all 12 major feature components discussed in NOKY's history confirms they are **fully present** and **successfully integrated**. There is no dead or unreachable code for these major systems.

| Feature Area | File & Component Path | Implementation & Wiring Status | Findings / Status |
| :--- | :--- | :--- | :--- |
| **Identity Gate** | `app/page.tsx` (Lines 191–249)<br>`components/EditNameModal.tsx`<br>`components/ExitConfirmModal.tsx` | **Fully Functional**. On the first visit, if `tst_player_name` is absent in `localStorage`, a beautiful command-line identity intercept is rendered. The global Header HUD synchronizes perfectly with updates or session resets. | **SUGGESTION**: Alphanumeric and space character checks on name submission are validated on the client side, but they do not enforce length limits or block empty entries on enter-keypress inside the Edit modal if bypass is attempted. |
| **6 Practice Modes** | `app/page.tsx` (Lines 280–456) | **Fully Functional**. All 6 modes (Code Arena, Knowledge Quest, AI Lab, World Explorer, Speed Sprint, and Weak-Key Drill) are laid out in a 2x3 responsive selection grid. Selection console details update dynamically without shifts. | **Verified**. |
| **Test Types** | `app/test/page.tsx` | **Fully Functional**. Correctly supports **Time Mode** (15s/30s/60s/120s with continuous pre-buffered text streaming), **Word Count Mode** (10/25/50/100 words with stopwatch elapsed timer and truncation), and **Passage Mode** (classic easy/medium/hard). **Ghost Race Mode** is perfectly integrated and restricted to Passage Mode. | **Verified**. |
| **Gamification** | `lib/gamification.ts`<br>`components/ToastContext.tsx` | **Fully Functional**. XP, Levels, and Achievement badges are computed retroactively from the unified single-source of truth `tst_history_v1:[name]`. Level promotions and badge unlocks invoke consecutive toast notifications sequentially through a React Context-based slide-in queue. | **Verified**. |
| **AI Coach** | `app/api/coach-feedback/route.ts`<br>`app/results/page.tsx` (Lines 135–179, 663–685) | **Fully Functional**. POSTs live metrics and errors to Gemini (`gemini-flash-lite-latest`) to generate a punchy 1-2 sentence tip. Implements a 3s timeout with local fallback to rotating tips. | **Verified**. |
| **Weak-Key Drill** | `lib/stats.ts`<br>`app/page.tsx` (Lines 405–444)<br>`app/test/page.tsx` (Lines 173–190)<br>`app/results/page.tsx` (Lines 507–554) | **Fully Functional**. Locks drill if under 3 tests completed. Extracts poorest accuracy keys from historical pressed logs and queries Gemini or falls back to targeted punctuation-free characters. Results page compares performance to the player's historical averages. | **Verified**. |
| **Leaderboard** | `app/leaderboard/page.tsx` | **Fully Functional**. Displays tab filters (All/Easy/Medium/Hard) and a clean loading indicator on switch to prevent flicker. Displays Top 3 ranks in a center-weighted horizontal podium, remaining ranks in a dense monospace log, and highlights the user with a "YOU" badge. | **Verified**. |
| **History Dashboard** | `app/history/page.tsx` | **Fully Functional**. Implements unified player HUD, progress trends, personal goal slider, active skill profile, practice mode breakdown, weak-key heatmap, chronological milestones timeline, unlocked badges, and chronological log table. Includes custom interactive SVG progression charts. | **Verified**. |
| **Unlockable Skins** | `app/history/page.tsx` (Lines 142–171, 712–763)<br>`components/Header.tsx` (Lines 79–95) | **Fully Functional**. CRT-themed skins (Electric Blue, Emerald Terminal, Amber CRT, Crimson Protocol) are bound to level and achievement requirements, persistent in localStorage (`tst_active_skin`), and sync across routes using the root `document.documentElement` class list. | **MODERATE FINDING**: Unnamespaced key causes profile bleeding (see Section 3). |
| **Sound System** | `lib/sounds.ts` | **Fully Functional**. Programmatically synthesizes correct/incorrect mechanical clicks and level-up/completion/achievement chimes using the native Web Audio API (zero static asset loading). Persistent on/off state inside global Header. | **Verified**. |
| **Footer** | `components/Footer.tsx` | **Fully Functional**. Responsive 4-column Mission Control terminal dashboard (System Status, Quick Commands, Operator Metrics, Telemetry Feed). Features typewriter entrance triggers, live uptime clock, and scanlines. | **MODERATE FINDING**: Radial mouse glow causes React-driven render bloat (see Section 4). |
| **Content Logs** | `app/data-protocol/page.tsx`<br>`app/rules-of-engagement/page.tsx`<br>`app/changelog/page.tsx` | **Fully Functional**. Three specialized diagnostic markdown-style log pages. Linked in Footer under QUICK COMMANDS and rendered in beautiful monospace terminal block views. | **Verified**. |

---

## 2. Bugs & Inconsistencies

### [MODERATE] Mismatch Between Frontend Practice Modes and Supabase Table Constraints
* **File Reference:** `app/results/page.tsx` (Lines 329–351) vs. `schema.sql` (Lines 11–13)
* **What is Wrong:** To prevent score submission errors on Supabase due to check constraints, the results screen hardcodes the category to `"custom"` for all inserts:
  ```typescript
  const supabaseCategory = "custom";
  ```
  However, the database schema defined in `schema.sql` restricts the category column to only three choices:
  ```sql
  category text not null default 'programming' check (category in ('programming', 'general_knowledge', 'custom'))
  ```
* **Why It Matters:** Because of this constraint limitation, real-time metrics submitted to the remote database lose their granular categorization. Even if a user completed a "Code Arena" (`code_arena`) or "AI Lab" (`ai_lab`) practice test, the record is stored remotely as `"custom"`. This causes an inconsistency with the user's localized chronological log, which records the true category.
* **Fix Action:** Update `schema.sql` to expand the check constraint to support all 6 practice modes (`code_arena`, `knowledge_quest`, `ai_lab`, `world_explorer`, `speed_sprint`, `weak_key_drill`), and dynamically transmit the category in the Supabase insert payload instead of coercing it to `"custom"`.

---

### [MINOR] Duplicate `fallbackTips` Arrays
* **File Reference:** `app/api/coach-feedback/route.ts` (Lines 5–11) and `app/results/page.tsx` (Lines 164–170)
* **What is Wrong:** Both the serverless API endpoint and the results page define the exact same array of fallback coaching tips:
  ```typescript
  const fallbackTips = [
    "Maintain a steady cadence. Focus on flowing smoothly between letters rather than rushing individual words.",
    "When encountering tricky letters, reduce your speed slightly to reinforce correct muscle memory.",
    ...
  ];
  ```
* **Why It Matters:** This causes code duplication and bloats maintenance effort. If a developer wishes to update or add a fallback tip, they must modify it in both files, leading to sync errors.
* **Fix Action:** Consolidate these fallback tips into a central constants utility inside `lib/passages.ts` or a new `lib/constants.ts` file, and import it in both files.

---

### [MINOR] Inconsistent default Next.js Link naming
* **File Reference:** `app/test/page.tsx` (Line 5)
* **What is Wrong:** The Next.js standard `Link` default export is imported with the alias `LinkIcon` but is used purely as a standard anchor Link wrapper:
  ```typescript
  import LinkIcon from "next/link";
  ```
* **Why It Matters:** This name alias clashes with standard visual icons, introducing syntactic confusion for other developers who might assume `LinkIcon` is a React SVG component rather than the standard routing wrapper. It deviates from other files (`app/results/page.tsx`, `app/history/page.tsx`, `app/leaderboard/page.tsx`) which import it correctly as `Link`.
* **Fix Action:** Standardize the import statement to `import Link from "next/link";` and rename `<LinkIcon>` elements to `<Link>`.

---

### [MINOR] Incomplete Validation inside Name Modals
* **File Reference:** `components/EditNameModal.tsx` (Line 27) and `app/page.tsx` (Line 104)
* **What is Wrong:** While the homepage initial setup correctly blocks spaces-only entries or non-alphanumeric identities, the edit name modal in `components/EditNameModal.tsx` only checks for empty trims:
  ```typescript
  if (!sanitized) {
    setError("Callsign cannot be empty");
    return;
  }
  ```
  It does not restrict special characters or enforce the strict alphanumeric check `^[a-zA-Z0-9 ]+$` that the landing intercept does.
* **Why It Matters:** An operator can easily bypass security constraints and submit special script tags or unwanted symbols via the header edit modal, leaking inconsistent characters onto the leaderboard or history dashboard.
* **Fix Action:** Standardize the alphanumeric verification regex across both the initial setup gate and the edit modal.

---

## 3. Data & State Management

### [MODERATE] Unnamespaced active skin theme key
* **File Reference:** `app/history/page.tsx` (Line 34), `app/results/page.tsx` (Line 80), and `components/Header.tsx` (Line 82)
* **What is Wrong:** The application usesnamespaced keys (e.g. `${baseKey}:${name.toLowerCase()}`) across all operator history statistics, levels, streaks, and target goals to ensure multi-player isolation. However, the custom unlockable skin theme key `"tst_active_skin"` is fetched and saved as a flat unnamespaced key:
  ```typescript
  localStorage.getItem("tst_active_skin");
  ```
* **Why It Matters:** Since `"tst_active_skin"` is global, the active skin configuration leaks between player profiles. If Player A unlocks and equips "Crimson Protocol" (Level 6 threshold), and then exits, Player B (Level 1 recruit) will immediately inherit the Crimson Protocol skin despite not meeting the gamification unlock threshold. This breaks the multi-operator profile isolation and unlocks premium rewards prematurely.
* **Fix Action:** Update the active skin operations to use the centralized namespacing helper: `getNamespacedKey("tst_active_skin")`.

---

### [MODERATE] Multiple Hardcoded Color Leaks Overriding Skin Theming
* **File Reference:** `components/Footer.tsx` (Lines 269–488) and `app/page.tsx` (Lines 172–493)
* **What is Wrong:** NOKY's skin theme works by modifying CSS variables like `--color-accent` and `--color-accent-rgb` on the root document element. However, several pages and components contain hardcoded Tailwind hex class definitions like `border-[#3B82F6]/20`, `text-[#3B82F6]`, or `bg-[#3B82F6]`.
  - In `components/Footer.tsx`: Lines 269, 283, 284, 291, 309, 323, 341, 356, 378, 427, 434, 452, 477, 486, 488.
  - In `app/page.tsx`: Lines 172, 174, 349, 352, 363, 365, 380, 493.
* **Why It Matters:** These hardcoded classes bypass the dynamic CSS-variable system. When a player equips the "Emerald Terminal" (Green), "Amber CRT" (Yellow), or "Crimson Protocol" (Red) skins, all these footer elements, grid borders, telemetries, and page dividers **remain Electric Blue**. This creates a visually jarring theme clash and ruins the terminal immersion.
* **Fix Action:** Replace all hardcoded `#3B82F6` and `[#3B82F6]` references with Tailwind-integrated semantic classes like `electric-500`, `border-electric-500/20`, or `text-electric-500` which are properly mapped to `--color-accent` variables.

---

## 4. Performance & Build Health

### [MODERATE] Render Bloat caused by mouse-movement listener in Footer
* **File Reference:** `components/Footer.tsx` (Lines 178–190, 302–312)
* **What is Wrong:** To paint a glowing background circle tracking the cursor, the Footer implements a mouse-move listener that triggers React state updates on every movement:
  ```typescript
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    ...
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setShowMouseGlow(true);
  };
  ```
* **Why It Matters:** Updating React state on *every single pixel* of mouse movement triggers rapid, continuous re-renders of the entire Footer component. This forces React to reconcile the DOM tree (including the 4 columns, status clocks, and lists of quick commands) hundreds of times per second. This causes CPU spike overhead and visual jank, particularly on lower-end devices or high-refresh rate displays.
* **Fix Action:** Refactor the mouse tracking effect to use **native CSS variables** on the footer element container instead of React state. Update variables `--mouse-x` and `--mouse-y` directly via raw DOM manipulation on mouse-move (using a React `useRef`), and read those coordinates inside a CSS-bound `radial-gradient` in stylesheet rules. This keeps the rendering fully inside the GPU composite thread and achieves zero React re-renders.

---

### [MINOR] Heavy JSX Re-rendering During Active Typing Test
* **File Reference:** `app/test/page.tsx` (Lines 559–601)
* **What is Wrong:** The visual prompt terminal renders characters key-by-key by splitting and mapping over the selected passage:
  ```typescript
  {selectedPassage.split("").map((char, index) => { ... })}
  ```
* **Why It Matters:** Since `typedInput` triggers a state change on every keystroke, the entire array is mapped, constructed, and reconciled on every single character pressed. For "hard" passages containing ~600 characters, React must process ~600 span DOM elements per keystroke, which can cause micro-stutters and input latency on mobile or low-end browser platforms.
* **Fix Action:** While acceptable for average runs, this can be optimized by grouping typed text segments into chunks (e.g., rendering completed words in a single block wrapper, and only individual characters around the active caret index).

---

## 5. Accessibility (a11y)

### [MODERATE] Color Contrast Violation on Untyped Prompt Characters
* **File Reference:** `app/test/page.tsx` (Line 566) vs. `globals.css` (Line 39)
* **What is Wrong:** Untyped prompt characters in the typing terminal are styled with the `text-slate-500` class:
  ```typescript
  colorClass = "text-slate-500"; // Slate 500 is hex #64748B
  ```
* **Why It Matters:** Against the dark card background `#16181C` (`charcoal-800`), the contrast ratio of `#64748B` is approximately **3.6:1**. This falls significantly below the WCAG AA minimum contrast ratio threshold of **4.5:1** for body text. This low visibility makes it difficult for operators to read upcoming words in the prompt clearly, resulting in high cognitive load and eye strain.
* **Fix Action:** Shift untyped prompt text to `text-slate-400` (#94A3B8) or increase background contrast locally in the terminal element. Against `#16181C`, `#94A3B8` yields a contrast ratio of **7.2:1**, comfortably exceeding WCAG AA standards.

---

### [MINOR] Low-Contrast uppercase subtext labels
* **File Reference:** `app/history/page.tsx` (Lines 371, 381, 401, etc.)
* **What is Wrong:** Small uppercase diagnostics labels (e.g. `"tests completed today"` or `"active daily streak"`) are colored with `text-slate-500` (#64748B) over the charcoal-800 card background.
* **Why It Matters:** At small monospace sizes (9px or 10px), a low contrast ratio makes auxiliary stats and labels illegible, harming accessibility compliance.
* **Fix Action:** Transition labels from `slate-500` to `slate-400` (#94A3B8) to improve readability without affecting layout aesthetics.

---

## 6. Security & Config

### [SUGGESTION] Lack of Cheat Protection or Validation on Leaderboard Submissions
* **File Reference:** `app/results/page.tsx` (Lines 317–400)
* **What is Wrong:** Submitting scores to the remote Supabase PostgreSQL database table is executed entirely client-side. The scores table accepts any insert with `check (true)` RLS security, and does not perform verification of the submitted WPM or accuracy against a secure server-side check.
* **Why It Matters:** While standard for portfolio projects, malicious users can easily monitor network requests and construct arbitrary POST requests directly to the Supabase database REST endpoint to submit impossible stats (e.g., 9999 WPM with 100% accuracy) under any name, easily spamming the leaderboard.
* **Fix Action:** For a production rollout, move score submission behind a secure server-side route that verifies typing statistics against the raw passage text length, start/end timestamps, and telemetry signatures transmitted as part of the session payload.

---

## 7. Code Organization

### [SUGGESTION] Code Splitting of Large Dashboard page
* **File Reference:** `app/history/page.tsx` (830 Lines)
* **What is Wrong:** This file acts as a master player dashboard but has grown extremely large and maintains multiple independent responsibilities. It handles active skill profiles, practice mode grids, hand-crafted Custom SVG progression line charts, keyboard error heatmaps, skin unlocks, timelines, and chronological lists.
* **Why It Matters:** Large monolithic files reduce maintainability, increase code duplication risks, and make isolated testing difficult.
* **Fix Action:** Modularize sub-widgets into standalone components inside `components/`:
  - Abstract the QWERTY keyboard heatmap into `components/WeakKeyHeatmap.tsx`.
  - Abstract the custom SVG progression chart into `components/SVGProgressChart.tsx`.
  - Abstract skin unlock toggles into `components/SkinsSelector.tsx`.
  - Abstract the journey milestone timelines into `components/MilestonesTimeline.tsx`.

---

### [SUGGESTION] Code Splitting of Large Results Page
* **File Reference:** `app/results/page.tsx` (700 Lines)
* **What is Wrong:** The results screen coordinates multiple self-contained sections: the visual Certificate Card styled for html2canvas exports, the leaderboard submission forms, the AI Coach feedbacks, and page routing actions.
* **Why It Matters:** Modifying any minor UI detail in the certificate layout forces exposure to the leaderboard database submissions or AI coaching queries.
* **Fix Action:** Split the monolithic file:
  - Abstract the Certificate Card layout into `components/BrandedCertificate.tsx`.
  - Abstract the database submission flows into `components/LeaderboardSubmit.tsx`.
  - Abstract the AI Coach note sections into `components/AICoachFeedback.tsx`.

---

### [SUGGESTION] Code Splitting of Large Landing Hub
* **File Reference:** `app/page.tsx` (560 Lines)
* **What is Wrong:** The main landing page handles the central identity gates setup prompts alongside the 6 mode tiles selection grid and parameter consoles.
* **Why It Matters:** The landing page serves as the entry-point to the application, making it prime for performance optimization. Splitting components improves Next.js lazy-loading and hydration speeds.
* **Fix Action:**
  - Abstract the landing identity-first gateway modal into `components/IdentityGate.tsx`.
  - Abstract the parameter sector console selections into `components/MissionConfigConsole.tsx`.

---

## Summary Table of Actionable Findings

| Category | File Reference | Finding Description | Severity | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **Data / State** | `Footer.tsx`<br>`page.tsx` | Multiple hardcoded `#3B82F6` (Electric Blue) color leaks that ignore theme configurations. | **MODERATE** | High |
| **Data / State** | `history/page.tsx`<br>`results/page.tsx`<br>`Header.tsx` | Unnamespaced active skin theme key allows profile bleedings and premature unlocks. | **MODERATE** | High |
| **Bugs / Schema** | `results/page.tsx`<br>`schema.sql` | Mismatch between frontend practice modes and database check constraints forces coercion to `"custom"`. | **MODERATE** | Medium |
| **Accessibility** | `test/page.tsx` | Untyped prompt characters (`text-slate-500`) have low color contrast (3.6:1), below WCAG AA (4.5:1). | **MODERATE** | Medium |
| **Performance** | `Footer.tsx` | React-driven cursor coordinate updates on mouse-move trigger rapid, expensive re-renders. | **MODERATE** | Medium |
| **Bugs / Quality** | `coach-feedback/route.ts`<br>`results/page.tsx` | Duplicated `fallbackTips` arrays bloat maintenance. | **MINOR** | Low |
| **Bugs / Validation** | `EditNameModal.tsx`<br>`page.tsx` | Inconsistent alphanumeric validations between landing setups and modal editing. | **MINOR** | Low |
| **Bugs / Formatting**| `test/page.tsx` | Inconsistent naming of default Next.js Link import (`LinkIcon` vs `Link`). | **MINOR** | Low |
| **Accessibility** | `history/page.tsx` | Low-contrast subtext labels (`slate-500`) are difficult to read at small sizes. | **MINOR** | Low |
| **Performance** | `test/page.tsx` | Continuous visual prompt splitting and mapping can cause lag during key-presses. | **SUGGESTION** | Low |
| **Security** | `results/page.tsx` | Leaderboard score submission accepts arbitrary values client-side without validation. | **SUGGESTION** | Low |
| **Organization** | `history/page.tsx`<br>`results/page.tsx`<br>`page.tsx` | High file sizing (500–830 lines) containing multiple responsibilities. Good candidate for code splitting. | **SUGGESTION** | Low |

---
*End of Audit Report.*
