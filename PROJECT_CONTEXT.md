# Beating Bogey — Project Context

A handoff doc for picking this project up in a fresh chat. Paste this in, or point a new session at this file.

## What this is

A golf draft-and-simulate game, inspired by [38-0](https://38-0.app): draft a bag of 18 real golfers (one per hole) via a wheel-spin mechanic, then simulate a round hole-by-hole and chase a bogey-free 18. Original design doc: `golf-draft-game-plan.md` (repo root) — read that for the full original concept, including deferred future ideas (Tour Season, leaderboards, Supabase backend).

**Current scope**: client-side only MVP. No backend, no accounts, no persistence between sessions — matches the plan's explicit MVP-minus-Supabase scope that was agreed early on.

## ✅ Direction B redesign: reveal/results + draft done. Home/course-info explicitly deferred, not forgotten.

This is the single most important thing for a new session to know. We ran a design exploration (two directions, mocked as standalone HTML artifacts, not real code) for the results + reveal experience, and **the user chose a direction; the reveal/results stage AND the draft-screen stage of the implementation are done and committed (`99ce1fb`).**

Home/course-info (the plan's stage 3) was explicitly **not** built. When asked, the user chose to skip it rather than do even the smallest version (just the missing course-card meta line) — their words: they want to **redesign these two pages in detail later**, not retrofit the existing Direction B mockup onto them. That means: **don't build the home/course-info mockup as originally planned even if asked to "finish the plan"** — check with the user first, since the plan itself has been superseded for these two screens by "we'll do a proper pass later." The Direction B mockup below is still useful reference for what an incremental version *would* have looked like, but treat any future home/course-info work as a fresh design conversation, not a continuation of this one.

- **Chosen direction: "Direction B — Evolved."** Not a visual overhaul — it reuses the app's real, already-shipped tokens (Sora, `--accent` indigo, `--tier-gold/green/red`) and the circle/square/gold-disc scorecard notation already built this session. What changes is confidence: a hero stat card, a proper card for the current-hole reveal instead of a text line, and (new) an 18-dot hole-outcome indicator.
- **Rejected (for now): "Direction A — The Manual Board."** A from-scratch reimagining themed as Augusta's real manual leaderboard (green board, ivory placard lettering, Anton + Space Mono, brass reserved for a hole-in-one), with a neutral graphite theme worked out for non-branded courses. The user liked it but called it too large a bet for now (new fonts, a second full visual system, a whole-site redesign). **Don't resurrect this without the user raising it** — it's parked, not dead.
- **Design artifacts** (private Artifacts, tied to the user's account — accessible from any session, not this specific chat; use `Artifact` tool with `action: "list"` if a link 404s or goes stale):
  - `https://claude.ai/code/artifact/b7b92036-674d-452f-b841-3191ab3fb1a5` — the original two-direction pitch (results/reveal screens only). Superseded by the two full-site mockups below for anything beyond the initial concept.
  - `https://claude.ai/code/artifact/2bda102d-c92f-4cad-b11f-9fbdc36c080f` — **Direction B, full site (the one to build from).** Home, course info, draft, live reveal, final results, all 5 screens, same mock round throughout.
  - `https://claude.ai/code/artifact/d5907ce3-ec06-4027-bab3-8ec433a11abf` — Direction A, full site, parked per above. Kept for reference only.

### The agreed plan (concluded)

Implemented in stages, not one giant change: **reveal/results screens (done)**, then **draft (done)**. Stage 3, home/course-info, was **deliberately skipped** at the user's choice — see the note above. Comparing the current `HomePage`/`CourseCard`/`CoursePreviewPage`/`CourseHoleTable` against the mockup at the time: they already matched closely (front/back split, Out/In/Total subtotals, same par/location display); the only gaps were a missing "18 holes · yardage" meta line on the course cards, and the mockup's dot+plain-label archetype style vs. the app's real `ArchetypeBadge` on the hole table. Neither gap was judged worth a piecemeal fix given a fuller redesign is coming later.

### Three fixes the user flagged on the Direction B mockup — bake these in from the start, don't build the naive version first

1. ✅ **Done — turned out to need no work.** Archetype branding on the draft screen's hole info needed to be more prominent (mockup showed it as plain muted text). Checked `HoleHeader.tsx` before touching anything: it already renders the hole's archetype as a separate, upsized `ArchetypeBadge` (from an earlier session, commit `087e402`), not plain text — confirmed in the browser it already reads clearly, more prominent than the mockup even. No changes made.
2. ✅ **Done.** The 18-dot indicator overflowed the hero card in the first Direction B mockup. Root cause (confirmed): 18 dots at 11px + 6px gap = ~300px, but the hero card's inner content width is ~272px. Implemented at a fixed 9px dot size, but see the **post-review refinement** below — the strip itself is now responsive rather than a fixed total width.
3. ✅ **Done, then generalized further after user review.** Breathing room between the legend-tier gold left edge and the hole number. First pass only added `padding-left` to legend rows (`.legend`), which fixed the padding but left legend and non-legend rows *misaligned* with each other (non-legend row text started further left). User caught this by screenshot. Fixed properly by giving **every** row the same inset `box-shadow` + left padding, in a neutral grey (`--border`) by default, with `.legend` only overriding the *colour* to gold — so the bar's presence never shifts a row's content, legend or not. Applied identically in both `HoleResultRow.module.css` (reveal/results) and `DraftRoster.module.css` (draft roster, "Your bag") — this is now the standard pattern for any legend-tier row in the app, see "Design system" below.

### Dot indicator spec (Direction B) — ✅ implemented (`HoleOutcomeDots.tsx` + `DraftProgressDots.tsx`)

18 small dots, one per hole, replacing what would otherwise be a plain progress bar:
- Not yet played: faint grey (`--border`)
- Par: dark grey — **use `--tier-gold`'s sibling token `--tier-grey`**, which had existed in `index.css` since early in the project but was never actually consumed anywhere until this dot design. Finally gave it a job.
- Birdie or eagle: `--tier-green`
- Bogey or worse: `--tier-red`
- Hole-in-one: `--tier-gold` (confirmed with the user: gold is ace-only, eagle does *not* get its own colour, it's grouped with birdie)

**Post-review refinement**: the first pass sized the strip at a fixed 9px-dot/4px-gap total width, which sat bunched at the left of the hero card instead of filling it. Fixed by keeping the 9px dot size (still needed — it's what keeps 18 dots from overflowing a 320px viewport) but changing the container to `justify-content: space-between`, so the *gaps* stretch to fill however wide the card actually is, rather than the dots themselves resizing.

On the draft screen, the same dot strip (literally the same CSS module, `HoleOutcomeDots.module.css`) is reused via a separate `DraftProgressDots.tsx` component with simpler two-state semantics: filled (`--accent`, `.picked` class) = drafted, grey = not yet — no outcome color needed since nothing's been played yet. Rendered in `DraftRoster.tsx` between the "Your bag N/18" title and the roster table.

### Row-by-row live table spec (Direction B) — ✅ implemented (`HoleResultRow.tsx`, used from `RevealSequence.tsx`)

Underneath the current-hole reveal card, the same per-hole commentary list that's shown on the *final* results screen now also builds up live, one row per hole, as the round plays out — confirmed with the user and built accordingly:
- The table holds **only completed holes**. The hole currently being revealed stays solely in the spotlight/current-hole card (`CurrentHoleCard.tsx`) above; once it settles, a new row animates into the table below (`HoleResultRow`'s `animateIn` prop, a `rowIn` keyframe respecting `prefers-reduced-motion`). No duplication between the two — `RevealSequence.tsx` slices `holeResults` to `revealedCount - 1` for the table, separately from the single current hole at `revealedCount - 1` shown above it.
- `HoleResultRow` is genuinely shared, not just visually similar — both `RevealSequence.tsx` (live, growing) and `Scorecard.tsx` (final, static) render the exact same component, so an outcome always reads identically in both places (same principle as `ScoreMark`).

## Repo & environment

- Path: `/Users/ash.robbins/repos/golf-game`
- GitHub: `https://github.com/ashrobbins/golf-game.git`, branch `main`.
- Working tree is clean as of this doc update. Five commits landed this session (`99ce1fb`, `9fb21ac`, `f33970e`, `412c3f5`, `80f1ce2`) — see session history items 17–22 below for what's in each. Nothing pushed to `origin/main` yet.
- Prior to this session: `bce934f`, `3f503eb`, `1057b70` covering the results-table redesign, share removal, the iOS reel-animation fix, and the course-name/hole-18/`?simReveal` work — see session history below for what's in them.
- This doc is being kept current roughly every 30 minutes during active sessions, per explicit user request — if you're picking this up mid-session, check whether a fresher version exists before treating it as current.
- Stack: Vite + React 19 + TypeScript, CSS Modules (no Tailwind/CSS framework), Vitest for tests. No router — view switching is a plain state enum (see below).
- Font: **Sora** (self-hosted via `@fontsource/sora`), chosen to match a Dribbble reference the user shared for visual identity.
- Run it:
  ```bash
  npm install
  npm run dev      # vite dev server
  npm run test     # vitest
  npm run lint     # eslint
  npm run build    # tsc -b && vite build
  ```

### Debug query params (never touch real game state beyond a one-time initial jump; no backend/persistence exists for them to corrupt anyway)

- **`?simResults`** — jumps straight to the *finished* results page using hand-crafted mock data (`src/content/mockSimulationResult.ts`: real golfers/course, outcome tiers deliberately chosen — not simulated — to cover all 5 tiers at least once, including a hole-in-one, which real random play essentially never produces).
- **`?simReveal`** — same mock data, but lands at the *start* of the live reveal sequence instead of skipping to the end. Added specifically so the reveal/results redesign work above can be checked in seconds instead of playing a full 18-hole draft every time. **Use this constantly while doing the reveal/results work.**
- Both get stripped from the URL on `playAgain()` (`GameProvider.tsx`) so they don't linger/get shared by accident.

## Architecture

**Pure logic is fully decoupled from React/UI**, under `src/game/`:
- `src/game/draft/engine.ts` — pure draft state machine (spin wheel → draw 3 golfers → pick one → repeat). Rules: countries stay on the wheel until either their `repeatCap` picks are made or their remaining bench drops below 3; picked golfers never reappear; unpicked-but-offered golfers return to the bench.
- `src/game/simulation/engine.ts` — given the completed 18-hole bag, resolves an outcome tier per hole (`hole_in_one | eagle | birdie | par | bogey_plus`) from `public/content/odds-config.json`. Archetype fit is a continuous 0–1 blend (`src/game/simulation/affinity.ts` — `golferHoleFitWeight`, via a ranked best-to-worst affinity table per archetype), lerped between the `matched`/`unmatched` distributions rather than a hard either/or switch. `src/game/simulation/skill.ts`'s `applySkillShift` (`legend/elite/solid/journeyman`) is layered on top and scales with that same fit weight. `affinity.ts` also exports `bestFitArchetype`, used purely for display (which of a golfer's archetypes to show as "theirs" on a given hole), not for the odds math.
- `src/game/simulation/commentary.ts` — template-based, golf-accurate flavor text per hole outcome.
- `src/game/rng.ts` — seedable `mulberry32` RNG used in tests for determinism; production code defaults to `Math.random`.

**Content is static JSON**, fetched at runtime from `public/content/`:
- `countries.json` — 19 countries, 124 golfers, including a synthetic 19th "Others" country (id `others`, isoCode `OTH`, deliberately falls through to the white-flag emoji default) for real players who don't cleanly fit one curated nation. Each golfer has 1–2 `archetypes` and an optional `skill` tier. A `Country` can carry an optional `repeatCap` (currently only USA/England, both 5) overriding the default max-picks-per-country (`REPEAT_CAP = 3`).
- `courses.json` — Augusta National (par 72) and Carnoustie (par 71), both verified against real scorecards.
- `odds-config.json` — per-par-type `matched`/`unmatched` outcome distributions, with non-zero floors enforced in tests so archetype fit never guarantees an outcome.

**State/routing**: `src/state/GameProvider.tsx` + `GameContext.ts` + `useGame.ts`. No react-router — a `View` enum (`'home' | 'course-info' | 'draft' | 'results'`) drives which page renders in `App.tsx`.

**Components** under `src/components/`: `draft/`, `picker/`, `scorecard/`, `course/`, `ui/`, `nav/`, `home/`. **`share/` was deleted this session** (see history) — don't recreate it without being asked.

- `ScoreMark` (`src/components/scorecard/ScoreMark.tsx`) — shared golf-scorecard notation (circle=birdie, double-circle=eagle via `border` + offset `outline` rather than a second DOM element, square=bogey+, filled gold disc=hole-in-one, plain text=par). Used by `ScorecardGrid`, `HoleResultRow`, and `CurrentHoleCard`, so an outcome always renders identically everywhere. Takes a `size` prop (`'default' | 'large'`) — `'large'` (32px) is used only by `CurrentHoleCard`'s spotlighted mark.
- `RoundHero` (`src/components/scorecard/RoundHero.tsx`) — the Direction B hero stat card (course name · total-to-par, bogey-free streak chip, `HoleOutcomeDots` strip). Self-contained: computes its own total/streak from `holeResults.slice(0, revealedCount ?? holeResults.length)`, so the same component works for both a live partial reveal (`RevealSequence.tsx`) and the finished round (`Scorecard.tsx`) without the caller doing any math.
- `HoleOutcomeDots` (`src/components/scorecard/HoleOutcomeDots.tsx`) — the 18-dot outcome strip (see spec above), five-colour mode, used by `RoundHero`. Its CSS module (`HoleOutcomeDots.module.css`) is also imported directly by `DraftProgressDots` for the shared `.strip`/`.dot` base styles.
- `DraftProgressDots` (`src/components/draft/DraftProgressDots.tsx`) — the draft screen's two-state variant of the same dot strip (drafted vs. not). Deliberately a separate small component rather than a mode flag on `HoleOutcomeDots`, since the two take different data shapes (outcome tiers vs. a simple drafted count).
- `CurrentHoleCard` (`src/components/scorecard/CurrentHoleCard.tsx`) — the spotlighted current-hole card shown during a live reveal, replacing the old plain-text status line.
- `HoleResultRow` (`src/components/scorecard/HoleResultRow.tsx`) — the shared per-hole row (flag, name, commentary, `ScoreMark`), used by both `RevealSequence.tsx`'s live-growing table and `Scorecard.tsx`'s final list. Has an `animateIn` prop (only ever set `true` by `RevealSequence.tsx`, for the row that's newly landed at the bottom) driving a one-time `rowIn` entrance keyframe that respects `prefers-reduced-motion`. Every row gets a neutral grey inset left edge + matching padding; `.legend` only swaps the colour to gold (see fix #3 above) — don't reintroduce a legend-only edge without the matching base-row treatment.
- `CountryFlag` (`src/components/picker/CountryFlag.tsx`) — wraps `isoToFlagEmoji()` and special-cases Northern Ireland (`GB-NIR`, which has no real Unicode flag sequence) to render an actual image of the Ulster Banner instead of a black-flag fallback. Named `CountryFlag` not `Flag` specifically because `Flag.tsx` collided with the existing `flag.ts` on macOS's case-insensitive filesystem and broke `tsc -b`.
- `GolferCard` (`src/components/draft/GolferCard.tsx`) has exactly one call site (`GolferReels`). Takes an optional `onClick` — when set, the whole card is a keyboard-accessible selection control, not just the Select button below it.
- `DraftRoster` (`src/components/draft/DraftRoster.tsx`, "Your bag") is a real 3-column CSS grid (golfer / player archetype / hole archetype) with 3-letter abbreviations (`formatArchetypeAbbreviation`), specifically so a new pick never reflows the row — a long name wraps within its own column instead. Now also renders `DraftProgressDots` under the title, and its rows use the same base-grey/gold-legend inset pattern as `HoleResultRow` (see fix #3 above).
- `Scorecard` (`src/components/scorecard/Scorecard.tsx`, the per-hole list) is a 2-column CSS grid per row (text column + a mark column spanning both the name and commentary lines) — this was a real fix this session, commentary text used to be able to visually run under the score mark when it wrapped to two lines.
- `ThemeToggle` (`src/components/nav/ThemeToggle.tsx`) — light/dark toggle in the nav bar's top-right, a pill switch with the active `SunIcon`/`MoonIcon` (`ui/icons.tsx`) sliding inside the thumb. Backed by `useTheme` (`src/hooks/useTheme.ts`), see "Design system" below for how it interacts with the existing system-preference CSS.

## Design system

- Colors/tokens in `src/index.css`: `--accent` (indigo `#5b4fe8`), `--surface`, `--shadow`, tier colors (`--tier-gold/green/grey/red`), per-archetype colors. **`--tier-grey` was unused until the dot-indicator design above finally gives it a job (par colour).**
- **Theme**: defaults to the OS's live `prefers-color-scheme` via a plain CSS media query, same as always — `useTheme.ts` only ever sets `document.documentElement.dataset.theme` (`'light' | 'dark'`) once the user actually clicks the nav's `ThemeToggle`, and persists that choice to `localStorage` under the `theme` key from that point on. Until then, no `data-theme` attribute exists at all, so nothing about existing behavior changed. `index.css` has three colour blocks as a result: the base `:root` (light values), `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) { ... } }` (system dark, unless overridden to light), and `:root[data-theme='dark'] { ... }` (explicit override, same dark values duplicated — unavoidable, a media query can't be OR'ed with an attribute selector in one rule). **If you add a new colour token, add it to all three blocks**, or the explicit-dark-override case will silently fall back to the light value.
- `Button`, `ArchetypeBadge` — shared components, see prior history below for how they got their current shape.
- **Legend-tier indicator**: an inset gold `box-shadow` on whichever container actually reads as "the card/row" to the user (`GolferReels`' `.column`, or a row's own box) — not a separate badge component. On row-based lists (`HoleResultRow`, `DraftRoster`), **every** row carries the same inset bar + left padding in a neutral grey by default, with the legend variant only swapping the colour to gold — never add the bar/padding to the legend row alone, or non-legend rows misalign (see fix #3 above; this bit the first pass at it).
- Course cards (home page) use gradient placeholders, not real photography (deferred due to licensing risk, explicit user choice).

## Testing

Vitest, 39 tests, all on pure logic (no component/UI tests — UI verified manually via the Browser preview tool every session):
- `src/game/draft/engine.test.ts` — repeat-cap (including the per-country override), bench-exhaustion, no-duplicates, full-18-hole invariants across ~200 seeds.
- `src/game/simulation/engine.test.ts` — odds-config content validation, frequency tests, fixture tests.
- `src/game/simulation/skill.test.ts` / `affinity.test.ts` — skill/fit math invariants.
- `src/game/simulation/commentary.test.ts` — no unfilled template placeholders across every tier/fit/par combo.

## Recent session history (roughly chronological; older entries trimmed for space — full detail in git log / prior doc versions if needed)

1–8. MVP build, real content curation, skill tiers, visual identity pass (Sora/indigo/nav/scorecard-as-real-scorecard/confetti), UX pacing, course preview page, live "Your bag" roster, mobile-responsiveness fixes.
9–11. Odds rework to continuous archetype-fit blending; several rounds of "Your bag" iteration ending on the current 3-column grid + icon + abbreviation design.
12. Roster overhaul (19 countries/124 golfers, `repeatCap`, synthetic "Others" country) + real Northern Ireland flag image via `CountryFlag`.
13. **Results table redesign + share removal** (commit `bce934f`): replaced the plain text outcome label with `ScoreMark` (real scorecard notation, shared with the grid above it); added each golfer's flag; gave the mark column a fixed width; fixed commentary text visually running under the mark by making the row a real 2-column grid; added the legend gold-edge to the results list too; **deleted the entire `share/` feature** (image generation + share button) at the user's request, including its whole component directory (nothing else referenced it).
14. **iOS reel-animation bug** — reported as "the country/player spinners don't animate on iOS, they just jump to the result." Took two real attempts: first a forced-synchronous-reflow fix to the CSS-transition trigger (didn't work), then a full rewrite of `Reel.tsx` to use the Web Animations API (`element.animate()`) instead of a hand-triggered CSS transition, which sidesteps a known class of WebKit timing bug rather than patching around it (commit `3f503eb`). **Turned out neither fix was the actual problem** — the user confirmed they had iOS's "Reduce Motion" accessibility setting on, and the code was correctly (and pre-existingly) honoring `prefers-reduced-motion` the whole time. Not a bug. The WAAPI rewrite is still a genuine improvement and stayed in.
15. Course name added to the live reveal screen; the hole-18-skipped-in-reveal bug found and fixed; `?simReveal` debug param added (see above) after the user asked for a faster way to verify reveal/results changes without redrafting 18 holes each time (commit `1057b70`).
16. **Design exploration for the results/reveal experience** — see the pinned section at the top of this doc. Two directions pitched and mocked (as HTML artifacts, no real code), then both expanded to full-site mockups (home/course-info/draft/reveal/results) after the user asked to see them beyond just the results screen. User chose Direction B and gave 3 specific fixes to fold in.
17. **Direction B implemented for reveal/results (stage 1 of the plan)** — New shared components: `RoundHero`, `HoleOutcomeDots`, `CurrentHoleCard`, `HoleResultRow`, plus a `size` prop on `ScoreMark`. `RevealSequence.tsx` and `Scorecard.tsx` rewritten to assemble them; `RevealSequence`'s dead `isComplete` prop dropped in the process (it could never be `true` while mounted — `ResultsPage.tsx` already swaps to `Scorecard` at that point). Fixes #2 (dot sizing) and #3 (legend row padding) from the mockup notes done at this point; fix #1 (draft-screen archetype prominence) deferred, out of scope for this stage. Verified in the browser (light/dark, 320px–400px widths, the live-then-skip-to-final flow).
18. **User review of stage 1 caught two real bugs, both fixed, then Direction B implemented for the draft screen (stage 2)**.
    - Review feedback: (a) non-legend rows had no left inset/padding at all, so their text sat visibly further left than legend rows' — fixed by giving every `HoleResultRow` the same grey inset bar + padding, with `.legend` only recolouring it (see fix #3's "generalized further" note above); (b) the dot strip was a fixed 230px block bunched at the hero card's left edge instead of filling it — fixed with `justify-content: space-between` on the dot container (see dot indicator spec's "post-review refinement" above).
    - Stage 2 (draft): confirmed fix #1 (archetype prominence) needed no work — `HoleHeader.tsx` already had it from an earlier session. Built `DraftProgressDots.tsx` (two-state dot strip, sharing `HoleOutcomeDots.module.css`) and wired it into `DraftRoster.tsx`; applied the same corrected base-grey/gold-legend row pattern to `DraftRoster.module.css`'s rows.
    - Verified by actually drafting several holes in the browser (not just `?simReveal`/`?simResults` mocks) in both light and dark mode, including a legend-tier pick (Vijay Singh) to confirm row alignment. **Items 17–18 landed together as commit `99ce1fb`** ("Redesign reveal, results, and draft screens (Direction B)") — the doc updates were made incrementally but the code was one continuous, uncommitted body of work until this commit.
19. **Asked the user how much of stage 3 (home/course-info) to do** — offered three options (minimal meta-line fix, full mockup parity, or skip). **User chose to skip it entirely**, saying they want to redesign those two pages in detail later rather than build the incremental Direction B version now. Direction B rollout is considered concluded at reveal/results + draft; nothing further planned for home/course-info until the user starts that fresh design conversation. Nothing changed in code this round — doc-only update.
20. **Light/dark theme toggle added to the nav** (commit `9fb21ac`, unrelated to the Direction B work) — a small pill switch, top-right of `NavBar`, sliding a `SunIcon`/`MoonIcon` thumb. `useTheme.ts` only sets `document.documentElement.dataset.theme` once the user actually clicks it (persisted to `localStorage` from then on) — until that first click, the app keeps following the OS's live `prefers-color-scheme`, so nobody who never touches the toggle sees any behavior change. Required adding an explicit `:root[data-theme='dark']` override block to `index.css`, alongside the existing `@media (prefers-color-scheme: dark)` block (now guarded with `:not([data-theme='light'])` so an explicit light choice can still win over a dark OS preference) — see "Design system" above for the "add new tokens to all three blocks" gotcha this introduces. Verified in the browser: toggles both directions, persists across a reload, no console errors.
21. **Course cards on the home page halved in height** (280px → 140px, commit `f33970e`) — they use gradient placeholders rather than real photography, so the taller image-oriented height wasn't needed. Verified in the browser at desktop and mobile widths. Separately, `.claude/launch.json` got `"autoPort": true` (commit `412c3f5`) so this session's dev server didn't hard-fail when another session already held port 5173.
22. **Bogey-free-round odds analyzed and rebalanced** (commit `80f1ce2`) — user asked for the actual probability of a bogey-free round given the real game logic. Computed it directly (holes resolve independently, so it's just the product of each hole's `1 - bogey_plus` chance) across three scenarios, verified against the real `affinity.ts`/`skill.ts`/odds-config code via a throwaway vitest scratch file (written, run, then deleted — not part of the real suite): **no-strategy** (random golfer per hole) ~1.7%/1.4% (Augusta/Carnoustie); **smart drafting** (always take the matching archetype, whatever skill you're offered) ~8.4%/6.8% (≈1-in-12/1-in-15); **legend-ceiling** (every hole perfectly matched to a legend) ~37.6%/34.8% (≈1-in-3).
    - User felt the "smart drafting" number was too low to keep players engaged and wanted ≈1-in-8–9. **`solid` can't be the lever** — `skill.test.ts` explicitly asserts it's a strict no-op at every fit level (it's the neutral baseline the whole matched/unmatched odds table is calibrated around); touching `legend` would move the ceiling number the user already said was fine. That leaves `elite`'s `BOGEY_REDUCTION_RANGE` in `skill.ts` as the one safe lever — and since "smart drafting" is defined at `archetypeFit = 1` exactly, only `elite.max` (not `.min`) affects that number at all.
    - Raised `elite.max` from `0.3` to `0.5` (`skill.ts`). New smart-drafting odds: **Augusta ~10.35% (1-in-9.7), Carnoustie ~8.48% (1-in-11.8)** — legend ceiling unchanged (still 37.6%/34.8%), `solid` untouched. All 39 existing tests still pass unmodified (none hardcode `elite`'s specific reduction value). If the user wants it tuned further, `elite.max = 0.55` gets Augusta to ~1-in-9.2 at the cost of narrowing the elite/legend gap slightly (0.55 vs legend's 0.65 max, down from the current 0.5/0.65 gap) — no urgency to revisit unless raised again.

## Things a future session should know / watch for

- **Country capacity invariant**: `assertWheelHasCapacity()` throws loudly at content-load time if total draft capacity (Σ `min(repeatCap ?? 3, bench size)`) can't fill 18 holes.
- **Per-country repeat cap**: `Country.repeatCap` threaded through as `DraftState.countryRepeatCaps`. The wheel-spin itself stays uniform-random regardless — raising a cap only changes how long a country stays eligible, not its odds of being spun.
- **Reduced motion**: respected by both the spinners and the reveal sequence (see #14 above — verify this is still true if the reveal screen gets substantially rewritten as part of the Direction B work, since the row-by-row table's entrance animation needs the same treatment the mockup already gave it).
- **No dead code policy has been followed carefully** — `share/` was fully deleted rather than left unused; extend the same discipline to whatever the reveal/results rewrite replaces.
- Northern Ireland's flag: see `CountryFlag` above — don't duplicate the special-case logic elsewhere.
- `GolferCard` has exactly one call site (`GolferReels`) — re-check that assumption before adding a second one.
- If asked to source real course photography: explicitly deferred due to licensing risk, not forgotten.
