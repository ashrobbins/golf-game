# Player Stats, Accounts, and Season Mode — Roadmap

## Context

Beating Bogey's MVP is client-side only, in-memory, no persistence between sessions — a deliberate early scope cut down from the original design doc (`golf-draft-game-plan.md`), which always planned for accounts and a "Tour Season" mode via Supabase. With the core loop (draft → simulate → reveal → results) shipped and polished, the next horizon is giving players a reason to keep coming back: personal stats now, and a full season later. This doc plans both, plus the account infrastructure the season needs, without building anything yet — it's a roadmap to review, not a build order.

Three phases, meant to be read and greenlit independently:
- **Phase A** — local stats tracking, buildable immediately, no accounts.
- **Phase B** — Supabase pricing/schema research, for when accounts become necessary.
- **Phase C** — the 16-round season feature (12 regular + 4 majors, confirmed), which is what actually requires Phase B.

---

## Phase A — Local stats tracking (buildable now)

**Data model.** Store one granular record per completed round, not pre-aggregated counters. Reasons: it's the only way to eventually show a round-history list on the new stats page, new stat types (the "etc" in the original ask) become computable retroactively with no schema change, and it's exactly the shape Phase B will want to upload later. At the volumes involved (tens to low hundreds of rounds per player), deriving aggregates on read is cheap — there's no performance case for storing rollups instead.

```
localStorage key: "beating-bogey:stats" (namespaced, distinct from useTheme.ts's "theme" key)
{ version: 1, rounds: RoundRecord[] }

RoundRecord = SimulationResult (courseId, holeResults, totalStrokesToPar,
  bogeyFreeThroughHole, isBogeyFreeRound) + { id: uuid, playedAt: ISO timestamp }
```

**Confirmed: store the full `holeResults` array**, not just derived tier counts — it's already in memory at the hook point and costs almost nothing to keep, and directly matches the original design doc's "store hole-by-hole outcomes, not just final score" guidance, which was written for server-side validation but happens to also be the right call locally, for the round-history and future-migration reasons above.

**Hook-in point.** `src/state/GameProvider.tsx`'s `finishDraft()` (line 71-79) is the single place a completed `SimulationResult` exists — add a `recordRound(result, course.id)` call right after `setSimulationResult(result)` (line 75). This should call into a new module, not do storage work inline in the provider.

**New module: `src/game/stats/`** (mirrors the existing `src/game/draft/` / `src/game/simulation/` split of types/engine):
- `types.ts` — `RoundRecord`, `StatsStore`, `CareerStats`, `CourseStats`.
- `storage.ts` — `loadStats()` / `recordRound()`, wrapping all `localStorage` access in try/catch. Private-browsing or storage-disabled falls back to an in-memory-only store for that session rather than throwing — stats just don't persist across a reload in that case, silently.
- `deriveStats.ts` — pure functions over `RoundRecord[]`, each run once career-wide and once filtered to a single `courseId`: bogey-free round count, lowest `bogey_plus` count in a round, highest `birdie`/`eagle`/`hole_in_one` count in a single round, and total career `hole_in_one` count. All derived by filtering `holeResults` by `outcomeTier` — no tier counts exist pre-computed anywhere today, this is genuinely new logic. Written as small composable reducers so a new stat later is a new function, not a data-model change.

**Versioning, from day one.** The `version: 1` field matters because both new local stat types and a future Supabase migration are already known to be coming — `loadStats()` checks `version` and passes through or resets-with-a-console-warning on mismatch for now; a real migration function gets added only when v2 actually happens. (Contrast with `useTheme.ts`'s existing `localStorage` use, which stores a raw unversioned string — fine for a two-value toggle, not a pattern to copy here.)

**UI: a dedicated page, not a drawer** (per your steer — a round-history table needs more room than the How to Play drawer's 400px panel). Add `'stats'` to `GameContext.ts`'s `View` union alongside `'home' | 'course-info' | 'draft' | 'results'`, a new `StatsPage.tsx` under `src/pages/`, and a nav entry point in `NavBar.tsx` (a new icon in the `.right` cluster, next to `HowToPlayTrigger`/`ThemeToggle`) that calls a `viewStats()`-style action on `GameContext` — following the same shape as `beginDraft`/`playAgain` rather than introducing a second context for this one, since (unlike the rules drawer, which is genuinely global chrome) stats are a real page in the app's main navigation flow.

**Verification, once built:** play a full round via the existing `?simResults` shortcut or a real draft, confirm the round appears on the new stats page; reload the browser and confirm it's still there; play a second round on the other course and confirm per-course figures split correctly while career figures include both; a `deriveStats.test.ts` under `src/game/stats/` (Vitest, matching the project's existing pure-logic-only test convention) covering the reducer functions against hand-built `RoundRecord[]` fixtures, no component tests needed (matches how the rest of the app is tested).

---

## Phase B — Supabase pricing and schema (research now, build when Phase C starts)

**Pricing** (verified directly against supabase.com/pricing):

| | Free | Pro | Team |
|---|---|---|---|
| Cost | $0/mo | $25/mo | $599/mo |
| Database | 500MB | 8GB | 8GB |
| File storage | 1GB | 100GB | 100GB |
| Egress | 5GB (+5GB cached) | 250GB | 250GB |
| Auth MAU | 50,000 | 100,000 | 100,000 |
| Realtime connections | 200 | 500 | 500 |
| Backups | none | 7-day | 14-day |
| Other | 2 project max, **pauses after 1 week idle** | email support | SOC2/ISO27001, priority support |

Overage on Pro: $0.00325/extra MAU, $0.125/GB extra DB, $0.09/GB extra egress.

**Cost estimate for this app.** Free tier is very likely sufficient through all of Phase B's foreseeable lifetime — each `hole_results` row is a handful of small columns, so even 10,000 players each playing 100 rounds is on the order of tens of millions of small rows, worth re-checking at the time but the 50,000-MAU ceiling is the more realistic constraint for a game this size, not the 500MB database cap. **The one real risk**: seasons are explicitly meant to be "played round-by-round over days/weeks" (per the original design doc) — a player who starts a season and comes back after a week could hit an auto-paused free-tier project. Worth a decision when Phase B actually starts (accept it for v1, or move to Pro's $25/mo specifically to remove the pause), not now.

**Minimal schema**, designed as a near-1:1 upload target for Phase A's `RoundRecord` (this is why Phase A stores full `holeResults` — a `RoundRecord` maps to one `rounds` row + N `hole_results` rows with only `user_id` and DB-generated ids added):
- `profiles` — `id` (references `auth.users`), `display_name`, `created_at`
- `rounds` — `id`, `user_id` fk, `course_id` text, `played_at`, `total_strokes_to_par`, `bogey_free_through_hole`, `is_bogey_free_round`, `season_id` fk (nullable — a round can exist outside a season)
- `hole_results` — `round_id` fk, `hole_number`, `golfer_id`, `country_id`, `outcome_tier`, `archetype_matched`, `relative_score` — field-for-field match to `HoleResult`
- `seasons` — `id`, `user_id` fk, `started_at`, `status`

Row-level security policies (a user can only read/write their own rows) are required before any of this is usable — tables are locked down by default. RLS controls *who* writes, not *what* they write, so once any competitive/leaderboard angle exists, round submissions need server-side validation (a Postgres function or Edge Function) rather than trusting the client — not needed for personal-stats-only use.

**Auth method — confirmed: OAuth (social login).** Matches the stated reasoning (higher signup conversion than email/password for a casual game) and Supabase Auth supports it natively as a first-class provider type, no extra infrastructure. Recommend **Google + Apple** specifically, not just Google alone: the original design doc's own distribution plan (`golf-draft-game-plan.md`) wraps this app with Capacitor for iOS App Store distribution, and Apple's App Store Review Guidelines (4.8) require offering **Sign in with Apple** as an equivalent option in any app that offers a third-party/social login — building it in from the start avoids a rework forced by App Store review later, rather than adding it reactively after a rejection. Google alone is fine for the web-only case; Apple should be added no later than whenever the Capacitor/iOS wrapper work actually starts, if not before.

---

## Phase C — Season mode (16 rounds: 12 regular + 4 majors, confirmed)

Requires Phase B (accounts) — a season is inherently a chain of results tied to a player across multiple sittings, per the original design doc: "each round stays a single sitting... the season is just a chain of completed round results tracked in the database — no mid-round resumable state needed."

**Code work** (small, once accounts exist):
- `Course` (`src/content/types.ts`) gains an `isMajor: boolean` field — immediately wires up the `.major` CSS variant already built (and currently dead) in `src/components/home/CourseCard.module.css`.
- A new pure module, `src/game/season/` (mirroring `draft`/`simulation`), handling the fixed 3-regular-then-1-major ordering repeated 4×, tracking which of the 16 rounds is next for a given `season_id`, and score accumulation.
- **Season scoring — confirmed: majors weight higher.** Proposed concrete mechanism: each round contributes `totalStrokesToPar × weight` to the season total, where `weight = 2` for the 4 major rounds and `weight = 1` for the 12 regular rounds — so a major round counts double, for better or worse, without changing anything about how a single round itself is simulated or scored (this lives entirely in the new `src/game/season/` aggregation module, not in `simulateRound`). The bogey-free bonus should follow the same doubling for consistency, rather than introducing a second weighting rule: e.g. a bogey-free regular round is worth a flat −1-stroke-equivalent bonus to the season total, a bogey-free major round −2. This keeps the mental model simple and explainable to a player ("majors count double, in both directions") and the `×2` figure is a tunable constant, not load-bearing — easy to rebalance after the season format is actually played a few times.

**Content work** (the bulk of the effort — 14 new courses, real venues verified against real scorecards, matching Augusta/Carnoustie's existing quality bar): Augusta National and Carnoustie already fill 2 of the 4 major slots (they're the real Masters and Open Championship venues). Proposed shortlist for the rest, chosen for global spread per your steer (not USA-heavy) — **names only, not yet verified hole-by-hole, that's the actual content work**:

**Majors (2 more needed):**
- Pebble Beach Golf Links — California, USA (US Open venue)
- Pinehurst No. 2 — North Carolina, USA (US Open venue — hosted 1999, 2005, 2014, and 2024)

**Regular tour stops (12):**
- USA: TPC Sawgrass (Florida), Southern Hills Country Club (Oklahoma), Whistling Straits (Wisconsin)
- UK/Ireland: St Andrews (Old Course, Scotland), Royal Birkdale (England), Wentworth (West Course, England), Royal County Down (Northern Ireland)
- Continental Europe: Marco Simone (Italy), Valderrama (Spain), Le Golf National (France)
- Rest of world: Royal Melbourne (Composite Course, Australia), **Jumeirah Golf Estates (Earth Course, Dubai, UAE)** — swapped in for Sun City/Gary Player CC. Jumeirah Golf Estates' Earth Course hosts the DP World Tour Championship, the season-ending finale of the European/DP World Tour, so it's a genuinely major-caliber "big name" venue rather than an obscure pick, and adds Middle East representation the list didn't have before.

That's 6 USA (3 majors + 3 regular), 5 UK/Ireland (1 major + 4 regular), 3 continental Europe, 2 rest-of-world (Australia, UAE) — real global variety while keeping the 3 US-hosted majors historically accurate. Happy to swap any of these; treat this as a starting shortlist for a dedicated content pass, not a locked list.

---

## Decisions locked in for this doc

1. `RoundRecord` stores the full `holeResults` array per round.
2. Phase B auth is OAuth (Google + Apple — Apple specifically because of the App Store's Sign-in-with-Apple requirement once the Capacitor iOS wrapper ships).
3. Season scoring weights major rounds ×2 (score and bogey-free bonus alike), regular rounds ×1.
4. Course shortlist above, with Jumeirah Golf Estates (Dubai) in place of Sun City for broader geographic spread.

Only genuinely open item left: the exact course shortlist is still a proposal pending a dedicated content-verification pass (real hole-by-hole data checked against real scorecards, same bar as Augusta/Carnoustie) — not a decision, just not-yet-done work.
