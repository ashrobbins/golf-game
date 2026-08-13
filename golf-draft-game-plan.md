# Golf Draft & Simulate Game — Design Plan

## Concept

Inspired by [38-0](https://38-0.app) (draft an all-time XI across eras, simulate
a 38-game season, chase an unbeaten record). This is the golf equivalent: draft
a bag of 18 real golfers from around the world, one per hole, then simulate a
full round and chase a bogey-free 18. Tap-to-play, short session, no real-time
skill required — the appeal is nostalgia, randomness, and a satisfying,
shareable result.

## Core loop

1. Player sees Hole 1: par, yardage, and its dominant "archetype" (see below).
2. Spin a wheel — it lands on a country.
3. Shown 3 golfers drawn at random from that country's curated bench.
4. Pick one to fill that hole's slot in the bag.
5. Repeat for all 18 holes, in sequence (no assigning-after-the-fact step).
6. Hit simulate — reveal results hole-by-hole, building to a final scorecard.

### Draft rules

- **Countries:** a curated list of 25–30 golf nations (not computed from live
  rankings), each with a hand-picked bench of 6–8 golfers spanning multiple
  eras (e.g. USA: Nicklaus, Hogan, Woods, Spieth, Thomas, Koepka, DeChambeau,
  Wyndham Clark).
- **Repeat cap:** a country can be drafted from a maximum of **3 times** per
  round. Once its remaining bench drops below 3 (or it hits the cap), it's
  removed from the wheel for the rest of that draft.
- **No duplicates:** once a golfer is drafted, they're removed from the
  available pool everywhere, so they can't be offered again.

## Hole outcome system

Each hole has a dominant archetype tag; each golfer has one or two archetype
tags shown at draft time. Matching a golfer's tag to the hole's tag **shifts
the odds**, it never guarantees an outcome — there should always be a chance
of an upset (a great fit bogeys) or a scramble (a mismatch pars), or the whole
thing feels like a foregone conclusion the moment you draft.

Archetype tags (starting set of five):

- **Long hitter** — par 5s, longer par 4s
- **Precision iron player** — mid-length par 4s
- **Short-game specialist** — par 3s, anything under ~160 yards
- **Scrambler** — bunker-heavy / tough greens
- **Closer** — the run-in holes (16–18)

Outcome tiers per hole: hole-in-one (very rare, par 3s only), eagle (rare,
mostly long-hitter fits on par 5s), birdie, par, bogey (or worse — breaks the
streak).

## Win condition & scoring

- **Headline goal:** a bogey-free round (the "38-0" equivalent).
- **Secondary score:** total strokes to par, tracked and shown even on a
  failed run, so every round has a shareable result, not just a pass/fail.
- **Share card:** hole-by-hole colour strip (gold hole-in-one/eagle, green
  birdie, grey par, red bogey+) plus final score, mirroring 38-0's
  gameweek-by-gameweek result strip.

## Session structure

One round = one sitting, start to finish, no mid-round pause/resume. Keeps the
core loop fast and tap-friendly.

## Courses

Real courses, not a fictional composite — bigger hook for golf fans, and gives
an obvious content pipeline later (more courses over time, same trick 38-0
uses with new derby/club challenges).

**MVP: 2 launch courses**, chosen specifically for a good spread across the
five archetypes (checked against real scorecards, not assumed):

- **Augusta National** — 4 par-3s, 10 par-4s, 4 par-5s (par 72)
- **Carnoustie** — 4 par-3s, 11 par-4s, 3 par-5s (par 71)

(St Andrews' Old Course was considered but dropped for MVP — only 2 par-3s
and 2 par-5s, too heavily skewed toward one archetype to properly test the
system, even though it's a huge name.)

Both Augusta and Carnoustie are also real Major venues (the Masters and The
Open), which matters for the Tour Season idea below — no extra work needed to
reuse them there.

Long-term ambition: a library of up to ~30 world-top courses, scaled up only
after the core loop is validated with these two.

## Content & config architecture

- **Odds config** (archetype-fit → outcome-probability mapping): a JSON file
  hosted on S3/a CDN, fetched by the app on each load. Lets you retune game
  balance live, with no app-store resubmission — just edit and re-upload the
  file.
- **Static content** (country rosters, course/hole data): same pattern —
  versioned JSON, not a database. Rarely changes, doesn't need querying.
- **Dynamic per-user data** (accounts, round history, future leaderboards):
  a real lightweight database — **Supabase** (Postgres, built-in auth,
  auto-generated REST + GraphQL API via PostgREST, row-level security,
  built-in admin table-editor UI for free).

### Notes on Supabase

- Data is queryable via normal REST calls (PostgREST auto-generates them from
  your schema) or the official client SDKs, which just wrap those same REST
  calls — no proprietary protocol.
- Tables are locked down by default; you'll need row-level security policies
  (e.g. "a user can only read/write their own rows") before the app can use
  them.
- RLS controls *who* can write, not *what* they write — it won't stop a user
  from submitting a fake score via a direct API call. Not an issue for
  personal-progress-only use, but before any competitive leaderboard ships,
  round results should be validated server-side (a Postgres function/RPC or
  Edge Function), not trusted as submitted. **Store the hole-by-hole draft
  picks and outcomes, not just the final score**, so that validation is
  possible later without a data model change.

## Platform & distribution

Plan: build as a web app, then wrap with **Capacitor** (Ionic) for iOS and
Android app store distribution, while remaining playable directly via a
browser URL — likely how 38-0 itself is set up (it has both a working URL and
an App Store listing).

- **Android:** Google explicitly supports wrapping a web app this way
  (Trusted Web Activity) — low friction.
- **iOS:** real review risk under Apple's "minimum functionality" guideline
  if the wrapped app feels like a bare website. Mitigate with genuine native
  touches: push notifications for new content, haptic feedback on the wheel
  spin, native share sheet for the scorecard, proper splash/offline handling
  rather than a visible loading spinner.

## MVP scope (build this first)

- Single round only, no season, no multiplayer/leaderboard.
- 2 courses: Augusta National, Carnoustie.
- Core loop: spin → pick from 3 → fill 18 holes → simulate → reveal → share.
- Odds/config as a JSON file on S3, fetched at runtime.
- Supabase for accounts + round history (even though there's no leaderboard
  yet — store hole-by-hole data now to avoid a rework later).

## Future ideas (explicitly deferred)

- **Tour Season:** 16 rounds (12 standard tour venues + 4 majors), played
  round-by-round over days/weeks. Each *round* stays a single sitting as
  above; the *season* is just a chain of completed round results tracked in
  the database — no mid-round resumable state needed.
- **Competitive/social layer:** comparing season totals against friends or a
  wider leaderboard. Bigger picture, deliberately out of scope until the
  single-round experience is proven.
