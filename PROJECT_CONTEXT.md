# Beating Bogey — Project Context

A handoff doc for picking this project up in a fresh chat. Paste this in, or point a new session at this file.

## What this is

A golf draft-and-simulate game, inspired by [38-0](https://38-0.app): draft a bag of 18 real golfers (one per hole) via a wheel-spin mechanic, then simulate a round hole-by-hole and chase a bogey-free 18. Original design doc: `golf-draft-game-plan.md` (repo root) — read that for the full original concept, including deferred future ideas (Tour Season, leaderboards, Supabase backend).

**Current scope**: client-side only MVP. No backend, no accounts, no persistence between sessions — matches the plan's explicit MVP-minus-Supabase scope that was agreed early on.

## ⚠️ Active work: results/reveal screens are being redesigned — read this first

This is the single most important thing for a new session to know. We ran a design exploration (two directions, mocked as standalone HTML artifacts, not real code) for the results + reveal experience, and **the user has chosen a direction and we have an agreed implementation plan that hasn't been executed yet.**

- **Chosen direction: "Direction B — Evolved."** Not a visual overhaul — it reuses the app's real, already-shipped tokens (Sora, `--accent` indigo, `--tier-gold/green/red`) and the circle/square/gold-disc scorecard notation already built this session. What changes is confidence: a hero stat card, a proper card for the current-hole reveal instead of a text line, and (new) an 18-dot hole-outcome indicator.
- **Rejected (for now): "Direction A — The Manual Board."** A from-scratch reimagining themed as Augusta's real manual leaderboard (green board, ivory placard lettering, Anton + Space Mono, brass reserved for a hole-in-one), with a neutral graphite theme worked out for non-branded courses. The user liked it but called it too large a bet for now (new fonts, a second full visual system, a whole-site redesign). **Don't resurrect this without the user raising it** — it's parked, not dead.
- **Design artifacts** (private Artifacts, tied to the user's account — accessible from any session, not this specific chat; use `Artifact` tool with `action: "list"` if a link 404s or goes stale):
  - `https://claude.ai/code/artifact/b7b92036-674d-452f-b841-3191ab3fb1a5` — the original two-direction pitch (results/reveal screens only). Superseded by the two full-site mockups below for anything beyond the initial concept.
  - `https://claude.ai/code/artifact/2bda102d-c92f-4cad-b11f-9fbdc36c080f` — **Direction B, full site (the one to build from).** Home, course info, draft, live reveal, final results, all 5 screens, same mock round throughout.
  - `https://claude.ai/code/artifact/d5907ce3-ec06-4027-bab3-8ec433a11abf` — Direction A, full site, parked per above. Kept for reference only.

### The agreed plan

Implement in stages, not one giant change: **reveal/results screens first**, then draft, then home/course-info last (those two are closest to what's already live, lowest priority).

### Three fixes the user flagged on the Direction B mockup — bake these in from the start, don't build the naive version first

1. **Archetype branding on the draft screen's hole info needs to be more prominent.** The mockup showed it as plain muted text ("Par 4 · 495 yds · Precision iron"); needs the real `ArchetypeBadge` treatment (colour, weight) to actually stand out, not read as metadata.
2. **The 18-dot indicator overflowed the hero card in the first Direction B mockup.** Root cause (confirmed): 18 dots at 11px + 6px gap = ~300px, but the hero card's inner content width is ~272px. Fixed in the Direction A mockup by sizing dots at 9px + 4px gap (~247px, fits with margin) — use that sizing (or re-derive it from the *real* component's actual padding, don't just copy the number blind).
3. **Need breathing room between the legend-tier gold left edge and the hole number** on a roster/results row — currently the inset `box-shadow` sits flush against the row's own padding with nothing between it and the content. Fix attempted in the Direction A mockup by giving legend rows extra `padding-left` (not just the inset bar itself) — validate that reads right at real size before calling it done.

### Dot indicator spec (Direction B)

18 small dots, one per hole, replacing what would otherwise be a plain progress bar:
- Not yet played: faint grey (`--border`)
- Par: dark grey — **use `--tier-gold`'s sibling token `--tier-grey`**, which has existed in `index.css` since early in the project but was never actually consumed anywhere until this dot design. Finally give it a job.
- Birdie or eagle: `--tier-green`
- Bogey or worse: `--tier-red`
- Hole-in-one: `--tier-gold` (confirmed with the user: gold is ace-only, eagle does *not* get its own colour, it's grouped with birdie)

On the draft screen, the same dot strip is reused with different semantics: filled (`--accent`) = drafted, grey = not yet — two states, not the five-colour outcome palette, since there's no outcome yet at draft time.

### Row-by-row live table spec (Direction B) — this is the other big functional add, not just styling

Underneath the current-hole reveal card, the same per-hole commentary list that's currently only shown on the *final* results screen should build up live, one row per hole, as the round plays out — not just appear all at once at the end. Confirmed with the user:
- The table holds **only completed holes**. The hole currently being revealed stays solely in the spotlight/current-hole card above; once it settles, a new row animates into the table below. No duplication between the two.
- This requires **real plumbing, not just a component reuse** — today `RevealSequence.tsx` only renders the single current hole's commentary (via `useHoleRevealSequencer`'s `revealedCount`), it doesn't accumulate a list. Will need something like slicing `holeResults`/`commentaryByHole` up to `revealedCount - 1` and mapping that to rows styled like `Scorecard.tsx`'s existing `.row`/`ScoreMark` markup (reuse, don't reinvent).

## Repo & environment

- Path: `/Users/ash.robbins/repos/golf-game`
- GitHub: `https://github.com/ashrobbins/golf-game.git`, branch `main`.
- **Uncommitted right now**: course name added to the live reveal screen; a real off-by-one bug fix in `useHoleRevealSequencer` (`isComplete` used to flip true the instant the last hole's `revealedCount` landed, in the *same* render — so hole 18 never got its own commentary beat, the reveal jumped straight from hole 17 to the final scorecard; fixed by delaying `isComplete` one full interval past the last count); and a new `?simReveal` debug query param (see below). Run `git status`/`git diff` for the live picture.
- Two commits already landed this session (`bce934f`, `3f503eb`) covering the results-table redesign, share removal, and the iOS reel-animation fix — see session history below for what's in them.
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

- `ScoreMark` (`src/components/scorecard/ScoreMark.tsx`) — shared golf-scorecard notation (circle=birdie, double-circle=eagle via `border` + offset `outline` rather than a second DOM element, square=bogey+, filled gold disc=hole-in-one, plain text=par). Used by both `ScorecardGrid` (the top hole-by-hole grid) and `Scorecard`'s per-hole list, so an outcome always renders identically in both places. **This is the component the reveal-screen row-by-row table work should reuse.**
- `CountryFlag` (`src/components/picker/CountryFlag.tsx`) — wraps `isoToFlagEmoji()` and special-cases Northern Ireland (`GB-NIR`, which has no real Unicode flag sequence) to render an actual image of the Ulster Banner instead of a black-flag fallback. Named `CountryFlag` not `Flag` specifically because `Flag.tsx` collided with the existing `flag.ts` on macOS's case-insensitive filesystem and broke `tsc -b`.
- `GolferCard` (`src/components/draft/GolferCard.tsx`) has exactly one call site (`GolferReels`). Takes an optional `onClick` — when set, the whole card is a keyboard-accessible selection control, not just the Select button below it.
- `DraftRoster` (`src/components/draft/DraftRoster.tsx`, "Your bag") is a real 3-column CSS grid (golfer / player archetype / hole archetype) with 3-letter abbreviations (`formatArchetypeAbbreviation`), specifically so a new pick never reflows the row — a long name wraps within its own column instead.
- `Scorecard` (`src/components/scorecard/Scorecard.tsx`, the per-hole list) is a 2-column CSS grid per row (text column + a mark column spanning both the name and commentary lines) — this was a real fix this session, commentary text used to be able to visually run under the score mark when it wrapped to two lines.

## Design system

- Colors/tokens in `src/index.css`: `--accent` (indigo `#5b4fe8`), `--surface`, `--shadow`, tier colors (`--tier-gold/green/grey/red`), per-archetype colors. **`--tier-grey` was unused until the dot-indicator design above finally gives it a job (par colour).**
- `Button`, `ArchetypeBadge` — shared components, see prior history below for how they got their current shape.
- **Legend-tier indicator**: an inset gold `box-shadow` on whichever container actually reads as "the card/row" to the user (`GolferReels`' `.column`, or a row's own box) — not a separate badge component. Needs more left padding on rows specifically (see the 3 fixes above).
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
15. Course name added to the live reveal screen; the hole-18-skipped-in-reveal bug found and fixed; `?simReveal` debug param added (see above) after the user asked for a faster way to verify reveal/results changes without redrafting 18 holes each time.
16. **Design exploration for the results/reveal experience** — see the pinned section at the top of this doc. Two directions pitched and mocked (as HTML artifacts, no real code), then both expanded to full-site mockups (home/course-info/draft/reveal/results) after the user asked to see them beyond just the results screen. User chose Direction B and gave 3 specific fixes to fold in. **Implementation has not started yet** — this is the next work.

## Things a future session should know / watch for

- **Country capacity invariant**: `assertWheelHasCapacity()` throws loudly at content-load time if total draft capacity (Σ `min(repeatCap ?? 3, bench size)`) can't fill 18 holes.
- **Per-country repeat cap**: `Country.repeatCap` threaded through as `DraftState.countryRepeatCaps`. The wheel-spin itself stays uniform-random regardless — raising a cap only changes how long a country stays eligible, not its odds of being spun.
- **Reduced motion**: respected by both the spinners and the reveal sequence (see #14 above — verify this is still true if the reveal screen gets substantially rewritten as part of the Direction B work, since the row-by-row table's entrance animation needs the same treatment the mockup already gave it).
- **No dead code policy has been followed carefully** — `share/` was fully deleted rather than left unused; extend the same discipline to whatever the reveal/results rewrite replaces.
- Northern Ireland's flag: see `CountryFlag` above — don't duplicate the special-case logic elsewhere.
- `GolferCard` has exactly one call site (`GolferReels`) — re-check that assumption before adding a second one.
- If asked to source real course photography: explicitly deferred due to licensing risk, not forgotten.
