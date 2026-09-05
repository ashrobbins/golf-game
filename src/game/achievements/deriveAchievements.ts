import type { ArchetypeTag, CountriesContent, Course } from '../../content/types'
import { MAJOR_COURSE_IDS, TOTAL_ROUNDS } from '../season/storage'
import { buildGolferIndex } from '../share/topPerformer'
import { TIER_POINTS } from '../stats/deriveStats'
import type { RoundRecord } from '../stats/types'

// A gross-stroke threshold, not relative-to-par like everything else in the
// app — "breaking 60" is real golf terminology for shooting fewer than 60
// strokes for 18 holes, regardless of that course's own par. Since par
// varies per course (70/71/72 across the current roster), the actual
// relative-to-par bar this implies differs by course even though the rule
// itself doesn't.
const BREAK_60_STROKES = 60

const BIRDIE_RUN_LENGTH = 5
const BOGEY_FREE_ROUNDS_TIER_1 = 5
const BOGEY_FREE_ROUNDS_TIER_2 = 10

// A gross-stroke threshold, same convention as BREAK_60_STROKES above —
// "shoot 65 or under" is a real total, not a relative-to-par count.
const THREE_PEAT_MAX_GROSS_SCORE = 65
const THREE_PEAT_ROUND_COUNT = 3

// Iconic Moments — tied to specific real holes on specific real courses,
// not derived generically from the course list the way the per-course
// achievements above are. Hardcoded course/hole numbers rather than looked
// up by name, matching how the rest of the game already treats course
// content as static data. If either course is ever removed from
// courses.json, these simply stay permanently locked rather than erroring
// — a round can still reference an old courseId even if it's no longer in
// the active list.
const ISLAND_GREEN_COURSE_ID = 'tpc-sawgrass'
const ISLAND_GREEN_HOLE_NUMBER = 17 // TPC Sawgrass's famous par-3 17th.

const AMEN_CORNER_COURSE_ID = 'augusta-national'
const AMEN_CORNER_HOLE_NUMBERS = [11, 12, 13] // Augusta National's real Amen Corner.

// Tiger Woods's chip-in birdie on Augusta National's 16th in the final round
// of the 2005 Masters. Tied to his golfer id from countries.json rather than
// his name, matching how the rest of the sim identifies golfers.
const IMPOSSIBLE_CHIP_COURSE_ID = 'augusta-national'
const IMPOSSIBLE_CHIP_HOLE_NUMBER = 16
const IMPOSSIBLE_CHIP_GOLFER_ID = 'usa-woods'

// Jack Nicklaus went bogey-free at Augusta National — the "Golden Bear"
// nickname is his, not the achievement's own invention.
const GOLDEN_BEAR_COURSE_ID = 'augusta-national'
const GOLDEN_BEAR_GOLFER_ID = 'usa-nicklaus'

const POSTCARD_PERFECT_COURSE_ID = 'pebble-beach'
const POSTCARD_PERFECT_HOLE_NUMBER = 7 // Pebble Beach's famous, tiny, endlessly-photographed par-3 7th.

// Miguel Angel Jimenez's 2010 Open: his tee shot on the Road Hole finished
// against the boundary wall, and he still escaped with a par.
const JIMENEZ_ESCAPE_COURSE_ID = 'st-andrews'
const JIMENEZ_ESCAPE_HOLE_NUMBER = 17
const JIMENEZ_ESCAPE_GOLFER_ID = 'esp-jimenez'

// Ian Poulter birdied his final five holes (14–18) in the Saturday
// four-ball match at the 2012 Ryder Cup, sparking Europe's Miracle at
// Medinah comeback from 10–6 down.
const MIRACLE_AT_MEDINAH_COURSE_ID = 'medinah'
const MIRACLE_AT_MEDINAH_HOLE_NUMBERS = [14, 15, 16, 17, 18]
const MIRACLE_AT_MEDINAH_GOLFER_ID = 'eng-poulter'

const KIWI_CLOSER_COURSE_ID = 'royal-birkdale'
const KIWI_CLOSER_HOLE_NUMBER = 18
const KIWI_CLOSER_GOLFER_ID = 'nzl-fox' // Ryan Fox, New Zealand.

// The Belfry's short, daring par-4 10th — a green players can reach off
// the tee — is part of Ryder Cup folklore for Seve Ballesteros's flair
// there. Any Spanish golfer counts, not just Seve himself — the
// achievement is about channeling that same flair, not literally him.
const SPIRIT_OF_SEVE_COURSE_ID = 'brabazon'
const SPIRIT_OF_SEVE_HOLE_NUMBER = 10
const SPIRIT_OF_SEVE_COUNTRY_ID = 'spain'

// Rory McIlroy beat Sam Burns 3&1 in the final Sunday singles match of the
// 2023 Ryder Cup — a match decided on the 17th green, sealing Europe's
// Cup-winning point at Marco Simone.
const CUP_CLINCHER_COURSE_ID = 'marco-simone'
const CUP_CLINCHER_HOLE_NUMBER = 17
const CUP_CLINCHER_GOLFER_ID = 'nir-mcilroy'

// Tiger Woods won the 2000 US Open at Pebble Beach by a record 15
// strokes, finishing 12 under par — the largest margin of victory in
// major championship history.
const PEBBLE_BEACH_RUNAWAY_COURSE_ID = 'pebble-beach'
const PEBBLE_BEACH_RUNAWAY_GOLFER_ID = 'usa-woods'
const PEBBLE_BEACH_RUNAWAY_MAX_TO_PAR = -12

// Nick Faldo closed with a 67 in the final round of the 1996 Masters,
// completing one of golf's greatest comebacks as Greg Norman's six-shot
// lead collapsed behind him.
const FALDOS_REDEMPTION_COURSE_ID = 'augusta-national'
const FALDOS_REDEMPTION_GOLFER_ID = 'eng-faldo'
const FALDOS_REDEMPTION_MAX_TO_PAR = -5

// Valderrama was designed by Seve Ballesteros, and he captained Europe to
// its first-ever Ryder Cup win on Spanish soil there in 1997.
const SEVES_HOME_COURSE_COURSE_ID = 'valderrama'
const SEVES_HOME_COURSE_GOLFER_ID = 'esp-ballesteros'

// Padraig Harrington won the 2008 Open Championship at Royal Birkdale in
// brutal wind and rain, closing at 3-over-par — the highest winning score
// at The Open in almost two decades. Deliberately the inverse of every
// other score-threshold achievement here: it unlocks on a bad round
// (+3 or worse), not a good one, so it plays as a bit of an easter egg.
const HARRINGTONS_SURVIVAL_COURSE_ID = 'royal-birkdale'
const HARRINGTONS_SURVIVAL_GOLFER_ID = 'irl-harrington'
const HARRINGTONS_SURVIVAL_MIN_TO_PAR = 3

// Paul Lawrie closed with a 4-under 67 in the final round to win the 1999
// Open Championship at Carnoustie, coming from 10 shots back after Jean
// van de Velde's collapse at the 18th forced a playoff.
const LAWRIE_COMEBACK_COURSE_ID = 'carnoustie'
const LAWRIE_COMEBACK_GOLFER_ID = 'sco-lawrie'
const LAWRIE_COMEBACK_MAX_TO_PAR = -4

// Sergio Garcia's second-round 64 (-7) at Valderrama, on the way to winning
// the 2018 Andalucía Valderrama Masters on home soil in Spain.
const GARCIA_HOME_SOIL_COURSE_ID = 'valderrama'
const GARCIA_HOME_SOIL_GOLFER_ID = 'esp-garcia'
const GARCIA_HOME_SOIL_MAX_TO_PAR = -7

// Scottie Scheffler's final-round 62 (-9) at Le Golf National won him the
// gold medal at the 2024 Paris Olympics.
const SCHEFFLER_GOLD_COURSE_ID = 'le-golf-national'
const SCHEFFLER_GOLD_GOLFER_ID = 'usa-scheffler'
const SCHEFFLER_GOLD_MAX_TO_PAR = -9

// A gross-stroke threshold, same convention as BREAK_60_STROKES/
// THREE_PEAT_MAX_GROSS_SCORE above. Henrik Stenson closed with a 64 to win
// the 2013 DP World Tour Championship — and the Race to Dubai title with
// it — at Jumeirah Golf Estates' Earth Course.
const STENSON_ICEMAN_COURSE_ID = 'earth-course'
const STENSON_ICEMAN_GOLFER_ID = 'swe-stenson'
const STENSON_ICEMAN_MAX_GROSS_SCORE = 64

// Six legends, five birdies each, across the whole round history — not
// tied to any single round the way the other Iconic Moments are.
const GRAND_SLAM_GOLFER_IDS = ['usa-nicklaus', 'rsa-player', 'usa-woods', 'nir-mcilroy', 'usa-hogan', 'usa-sarazen']
const GRAND_SLAM_BIRDIES_PER_GOLFER = 5

// Total points a golfer earns across a round uses the same per-tier point
// values as the Top Players leaderboard (game/stats/deriveStats.ts) — this
// achievement counts only the slice of that scoring earned by golfers with
// the 'legend' skill tier, summed across every round ever played.
const LEGENDARY_STUFF_TARGET = 1000

// Relative to par — +5 means 5 strokes over, regardless of the course's own
// par value.
const OFF_DAY_MIN_STROKES_TO_PAR = 5

export type AchievementSection =  'career' | 'iconic' | 'course' | 'season'

export interface AchievementProgress {
  current: number
  target: number
}

export interface AchievementRosterEntry {
  name: string
  achieved: boolean
  // Optional per-entry progress (e.g. The Grand Slam's birdie count per
  // golfer) — when present, AchievementProgress renders its "X/Y" badge as
  // an expandable toggle showing this breakdown instead of a static badge.
  current?: number
  target?: number
}

export interface AchievementHoleProgressEntry {
  holeNumber: number
  achieved: boolean
}

export interface Achievement {
  id: string
  name: string
  description: string
  section: AchievementSection
  isUnlocked: boolean
  // Optional current/target pair for achievements that track toward a
  // numeric goal rather than unlocking on a single qualifying round (e.g.
  // Legendary Stuff's running legend-points total) — rendered as an
  // "X/Y" badge by the reusable AchievementProgress UI component.
  progress?: AchievementProgress
  // Optional named checklist for achievements that require the same thing
  // from several different people (e.g. The Grand Slam's six golfers) —
  // rendered as a highlighted name list by the reusable AchievementRoster
  // UI component, so it's obvious at a glance who's left.
  roster?: AchievementRosterEntry[]
  // Optional per-hole checklist for achievements that require the same
  // thing on every hole of a course (e.g. Birdie All Holes) — rendered as
  // a grey/green dot strip by the reusable AchievementHoleDots UI
  // component, one entry per hole in course order.
  holeProgress?: AchievementHoleProgressEntry[]
  // Optional short real-world context — almost exclusively used by Iconic
  // Moments, since those are the achievements actually tied to a specific
  // real event. Rendered as small print under the description.
  trivia?: string
  // When true, AchievementsPage skips the plain comma-separated
  // AchievementRoster list and shows only AchievementProgress's
  // toggle+panel — for a roster too long to read as one inline sentence
  // (Full House's 125 golfers, a country's 5-14), unlike Grand Slam/Major
  // Slam's small 4-6 entry rosters, which read fine inline.
  compactRoster?: boolean
}

function isBogeyFreeAt(rounds: RoundRecord[], courseId: string): boolean {
  return rounds.some((r) => r.courseId === courseId && r.isBogeyFreeRound)
}

function hasBroken60At(rounds: RoundRecord[], course: Course): boolean {
  return rounds.some((r) => r.courseId === course.id && course.par + r.totalStrokesToPar < BREAK_60_STROKES)
}

// "Birdie or better" — birdie, eagle, or hole-in-one all count. Cumulative
// across every round ever played at this course, not a single round, same
// spirit as bogeyFreeRoundCount's own cross-round accumulation below.
const BIRDIE_OR_BETTER_TIERS = new Set<RoundRecord['holeResults'][number]['outcomeTier']>([
  'birdie',
  'eagle',
  'hole_in_one',
])

function birdieOrBetterHoleNumbersAt(rounds: RoundRecord[], courseId: string): Set<number> {
  const holeNumbers = new Set<number>()
  for (const r of rounds) {
    if (r.courseId !== courseId) continue
    for (const h of r.holeResults) {
      if (BIRDIE_OR_BETTER_TIERS.has(h.outcomeTier)) holeNumbers.add(h.holeNumber)
    }
  }
  return holeNumbers
}

// Empty holes list (e.g. course content not yet loaded) must not read as
// "every hole birdied" — Array.every is vacuously true on an empty array,
// so this is guarded explicitly rather than unlocking for free.
function hasBirdiedAllHolesAt(achievedHoleNumbers: Set<number>, course: Course): boolean {
  return course.holes.length > 0 && course.holes.every((h) => achievedHoleNumbers.has(h.number))
}

function hasAnyHoleInOne(rounds: RoundRecord[]): boolean {
  return rounds.some((r) => r.holeResults.some((h) => h.outcomeTier === 'hole_in_one'))
}

function hasHoleInOneAt(rounds: RoundRecord[], courseId: string, holeNumber: number): boolean {
  return rounds.some(
    (r) =>
      r.courseId === courseId && r.holeResults.some((h) => h.holeNumber === holeNumber && h.outcomeTier === 'hole_in_one'),
  )
}

function hasPlayedAmenCornerUnderPar(rounds: RoundRecord[]): boolean {
  return rounds.some((r) => {
    if (r.courseId !== AMEN_CORNER_COURSE_ID) return false
    const amenCornerScore = r.holeResults
      .filter((h) => AMEN_CORNER_HOLE_NUMBERS.includes(h.holeNumber))
      .reduce((sum, h) => sum + h.relativeScore, 0)
    return amenCornerScore < 0
  })
}

function hasBirdieAt(rounds: RoundRecord[], courseId: string, holeNumber: number, golferId: string): boolean {
  return rounds.some(
    (r) =>
      r.courseId === courseId &&
      r.holeResults.some((h) => h.holeNumber === holeNumber && h.golferId === golferId && h.outcomeTier === 'birdie'),
  )
}

// Same shape as hasBirdieAt above, but any golfer from the given country
// counts — used by Spirit of Seve, which only cares about nationality, not
// which specific Spanish golfer made the birdie.
function hasBirdieAtByCountry(
  rounds: RoundRecord[],
  courseId: string,
  holeNumber: number,
  countryId: string,
): boolean {
  return rounds.some(
    (r) =>
      r.courseId === courseId &&
      r.holeResults.some(
        (h) => h.holeNumber === holeNumber && h.countryId === countryId && h.outcomeTier === 'birdie',
      ),
  )
}

// Same shape as hasBirdieAt above, but any one of a set of holes counts —
// used by Miracle at Medinah, where the real feat (Poulter's five straight
// birdies in the 2012 Ryder Cup) is a run, not a single fixed hole.
function hasBirdieAtAnyOf(rounds: RoundRecord[], courseId: string, holeNumbers: number[], golferId: string): boolean {
  return rounds.some(
    (r) =>
      r.courseId === courseId &&
      r.holeResults.some(
        (h) => holeNumbers.includes(h.holeNumber) && h.golferId === golferId && h.outcomeTier === 'birdie',
      ),
  )
}

function hasPerfectMatchRound(rounds: RoundRecord[]): boolean {
  return rounds.some((r) => r.holeResults.length === 18 && r.holeResults.every((h) => h.archetypeMatched))
}

// holeResults is already sorted by holeNumber (see engine.ts), so a run of
// consecutive birdies in the array is a run of consecutive holes.
function hasBirdieRun(rounds: RoundRecord[]): boolean {
  return rounds.some((r) => {
    let streak = 0
    for (const h of r.holeResults) {
      streak = h.outcomeTier === 'birdie' ? streak + 1 : 0
      if (streak >= BIRDIE_RUN_LENGTH) return true
    }
    return false
  })
}

function bogeyFreeRoundCount(rounds: RoundRecord[]): number {
  return rounds.filter((r) => r.isBogeyFreeRound).length
}

// Generalized so both Golden Bear (Nicklaus/Augusta) and Seve's Home
// Course (Ballesteros/Valderrama) share the same "bogey-free with golfer Y
// in the bag" shape.
function hasGoneBogeyFreeWithGolferAt(rounds: RoundRecord[], courseId: string, golferId: string): boolean {
  return rounds.some(
    (r) => r.courseId === courseId && r.isBogeyFreeRound && r.holeResults.some((h) => h.golferId === golferId),
  )
}

// Relative-to-par version of the same "score X with golfer Y in the bag, in
// the same round" shape as hasGoneGoldenBear above, generalized for the
// Carnoustie/Valderrama/Le Golf National real-round-recreation achievements.
function hasScoredWithGolferAt(
  rounds: RoundRecord[],
  courseId: string,
  golferId: string,
  maxStrokesToPar: number,
): boolean {
  return rounds.some(
    (r) =>
      r.courseId === courseId &&
      r.totalStrokesToPar <= maxStrokesToPar &&
      r.holeResults.some((h) => h.golferId === golferId),
  )
}

// Inverse of hasScoredWithGolferAt above — unlocks on a bad round (score
// at or worse than the threshold), not a good one. Used by Harrington's
// Survival, the one achievement in the set that honors a rough day rather
// than a great one.
function hasScoredWorseWithGolferAt(
  rounds: RoundRecord[],
  courseId: string,
  golferId: string,
  minStrokesToPar: number,
): boolean {
  return rounds.some(
    (r) =>
      r.courseId === courseId &&
      r.totalStrokesToPar >= minStrokesToPar &&
      r.holeResults.some((h) => h.golferId === golferId),
  )
}

// Gross-stroke version of the same shape, same BREAK_60_STROKES-style
// convention — needs the course's own par to convert, so it looks the
// course up from the passed-in list rather than taking it as a param
// (matching hasThreePeat's own per-round course lookup above).
function hasShotGrossWithGolferAt(
  rounds: RoundRecord[],
  courses: Course[],
  courseId: string,
  golferId: string,
  maxGrossScore: number,
): boolean {
  const course = courses.find((c) => c.id === courseId)
  if (!course) return false
  return rounds.some(
    (r) =>
      r.courseId === courseId &&
      course.par + r.totalStrokesToPar <= maxGrossScore &&
      r.holeResults.some((h) => h.golferId === golferId),
  )
}

// Consecutive by play order, not consecutive within a single course — a
// round on a course with no par data on record simply breaks the streak
// rather than crashing, same "stay locked" fallback as the other
// hardcoded-course achievements above.
function hasThreePeat(rounds: RoundRecord[], courses: Course[]): boolean {
  const sorted = [...rounds].sort((a, b) => a.playedAt.localeCompare(b.playedAt))
  let streak = 0
  for (const r of sorted) {
    const course = courses.find((c) => c.id === r.courseId)
    const grossScore = course ? course.par + r.totalStrokesToPar : null
    streak = grossScore !== null && grossScore <= THREE_PEAT_MAX_GROSS_SCORE ? streak + 1 : 0
    if (streak >= THREE_PEAT_ROUND_COUNT) return true
  }
  return false
}

function hasBogeyFreeRoundWithoutLegends(rounds: RoundRecord[], countries: CountriesContent): boolean {
  const golferIndex = buildGolferIndex(countries)
  return rounds.some(
    (r) => r.isBogeyFreeRound && r.holeResults.every((h) => golferIndex.get(h.golferId)?.skill !== 'legend'),
  )
}

// Raw total across every round ever played — can go negative (bogey_plus
// costs a point), but the achievement's progress display floors it at 0
// (see deriveAchievements below) so the badge never reads "-3/1000".
function legendPointsEarned(rounds: RoundRecord[], countries: CountriesContent): number {
  const golferIndex = buildGolferIndex(countries)
  let total = 0
  for (const r of rounds) {
    for (const h of r.holeResults) {
      if (golferIndex.get(h.golferId)?.skill === 'legend') total += TIER_POINTS[h.outcomeTier]
    }
  }
  return total
}

function hasOffDayRound(rounds: RoundRecord[]): boolean {
  return rounds.some((r) => r.totalStrokesToPar >= OFF_DAY_MIN_STROKES_TO_PAR)
}

function holeArchetypeAt(courses: Course[], courseId: string, holeNumber: number): ArchetypeTag | null {
  const course = courses.find((c) => c.id === courseId)
  const hole = course?.holes.find((h) => h.number === holeNumber)
  return hole?.archetype ?? null
}

function hasJimenezEscape(rounds: RoundRecord[]): boolean {
  return rounds.some(
    (r) =>
      r.courseId === JIMENEZ_ESCAPE_COURSE_ID &&
      r.holeResults.some(
        (h) =>
          h.holeNumber === JIMENEZ_ESCAPE_HOLE_NUMBER &&
          h.golferId === JIMENEZ_ESCAPE_GOLFER_ID &&
          h.relativeScore <= 0,
      ),
  )
}

function birdieCountFor(rounds: RoundRecord[], golferId: string): number {
  let count = 0
  for (const r of rounds) {
    for (const h of r.holeResults) {
      if (h.golferId === golferId && h.outcomeTier === 'birdie') count++
    }
  }
  return count
}

// One roster entry per Grand Slam golfer, each flagged once they've reached
// their own 5-birdie bar — the achievement itself only unlocks once every
// one of them has. Falls back to the raw id if a golfer is ever missing
// from countries.json, rather than dropping them from the list silently.
function grandSlamRoster(rounds: RoundRecord[], countries: CountriesContent): AchievementRosterEntry[] {
  const golferIndex = buildGolferIndex(countries)
  return GRAND_SLAM_GOLFER_IDS.map((golferId) => {
    const current = birdieCountFor(rounds, golferId)
    return {
      name: golferIndex.get(golferId)?.name ?? golferId,
      achieved: current >= GRAND_SLAM_BIRDIES_PER_GOLFER,
      current,
      target: GRAND_SLAM_BIRDIES_PER_GOLFER,
    }
  })
}

// Every distinct golfer ever drafted, career-wide (Free Play + Season
// combined — RoundRecord's holeResults don't distinguish, and this
// achievement isn't scoped to either) — powers Full House.
function draftedGolferIds(rounds: RoundRecord[]): Set<string> {
  const ids = new Set<string>()
  for (const r of rounds) {
    for (const h of r.holeResults) ids.add(h.golferId)
  }
  return ids
}

// Every distinct golfer from one country with a birdie-or-better outcome,
// career-wide — powers the per-country "Sweep" achievements. Same
// birdie-or-better definition as birdieOrBetterHoleNumbersAt above, via the
// shared BIRDIE_OR_BETTER_TIERS set.
function birdieOrBetterGolferIdsFor(rounds: RoundRecord[], countryId: string): Set<string> {
  const ids = new Set<string>()
  for (const r of rounds) {
    for (const h of r.holeResults) {
      if (h.countryId === countryId && BIRDIE_OR_BETTER_TIERS.has(h.outcomeTier)) ids.add(h.golferId)
    }
  }
  return ids
}

// Groups rounds by their season tag, dropping untagged Free Play rounds —
// the only place season-scoped achievements need to reconstruct "which
// rounds belong to the same season," derived purely from the seasonId tag
// RoundRecord already carries (see game/season/), no need for the season
// archive object itself.
function roundsBySeason(rounds: RoundRecord[]): Map<string, RoundRecord[]> {
  const groups = new Map<string, RoundRecord[]>()
  for (const r of rounds) {
    if (!r.seasonId) continue
    const existing = groups.get(r.seasonId)
    if (existing) existing.push(r)
    else groups.set(r.seasonId, [r])
  }
  return groups
}

// Every golfer flagged as a legend, computed live from countries.json
// rather than a curated/hardcoded list (unlike GRAND_SLAM_GOLFER_IDS) —
// powers All-Star Season.
function allLegendGolferIds(countries: CountriesContent): string[] {
  const ids: string[] = []
  for (const country of countries.countries) {
    for (const golfer of country.golfers) {
      if (golfer.skill === 'legend') ids.push(golfer.id)
    }
  }
  return ids
}

// A "mismatch" birdie: the golfer who made it has golferArchetype among
// their own archetype tags, but the hole they birdied is built for a
// different archetype entirely (holeArchetype) — success despite being the
// wrong tool for the job.
function hasMismatchBirdie(
  rounds: RoundRecord[],
  courses: Course[],
  countries: CountriesContent,
  golferArchetype: ArchetypeTag,
  holeArchetype: ArchetypeTag,
): boolean {
  const golferIndex = buildGolferIndex(countries)
  return rounds.some((r) =>
    r.holeResults.some((h) => {
      if (h.outcomeTier !== 'birdie') return false
      const golfer = golferIndex.get(h.golferId)
      if (!golfer?.archetypes.includes(golferArchetype)) return false
      return holeArchetypeAt(courses, r.courseId, h.holeNumber) === holeArchetype
    }),
  )
}

// Returns the full achievement list in display order: each course's
// bogey-free/break-60 pair (in courses.json's own order — the same order
// the home page's course grid uses), then career-wide milestones, then
// Iconic Moments. Pure function of the round history + course/country
// content, same pattern as game/stats/deriveStats.ts.
export function deriveAchievements(
  rounds: RoundRecord[],
  courses: Course[],
  countries: CountriesContent,
): Achievement[] {
  const achievements: Achievement[] = []

  for (const course of courses) {
    achievements.push({
      id: `bogey-free-${course.id}`,
      name: `Bogey-free at ${course.name}`,
      description: `Go bogey-free through all 18 holes at ${course.name}.`,
      section: 'course',
      isUnlocked: isBogeyFreeAt(rounds, course.id),
    })
    achievements.push({
      id: `break-60-${course.id}`,
      name: `Break 60 at ${course.name}`,
      description: `Shoot under 60 strokes at ${course.name}.`,
      section: 'course',
      isUnlocked: hasBroken60At(rounds, course),
    })
    const birdiedHoleNumbers = birdieOrBetterHoleNumbersAt(rounds, course.id)
    achievements.push({
      id: `birdie-all-${course.id}`,
      name: `Birdie All Holes at ${course.name}`,
      description: `Birdie or better on every hole at ${course.name}.`,
      section: 'course',
      isUnlocked: hasBirdiedAllHolesAt(birdiedHoleNumbers, course),
      holeProgress: course.holes.map((h) => ({
        holeNumber: h.number,
        achieved: birdiedHoleNumbers.has(h.number),
      })),
    })
  }

  achievements.push({
    id: 'bogey-free-everywhere',
    name: 'Bogey-free everywhere',
    description: 'Go bogey-free at every course in the game.',
    section: 'career',
    isUnlocked: courses.length > 0 && courses.every((course) => isBogeyFreeAt(rounds, course.id)),
  })
  achievements.push({
    id: 'bogey-free-5-rounds',
    name: '5 Rounds Bogey-Free',
    description: 'Go bogey-free in 5 rounds total, on any course.',
    section: 'career',
    isUnlocked: bogeyFreeRoundCount(rounds) >= BOGEY_FREE_ROUNDS_TIER_1,
  })
  achievements.push({
    id: 'bogey-free-10-rounds',
    name: '10 Rounds Bogey-Free',
    description: 'Go bogey-free in 10 rounds total, on any course.',
    section: 'career',
    isUnlocked: bogeyFreeRoundCount(rounds) >= BOGEY_FREE_ROUNDS_TIER_2,
  })
  achievements.push({
    id: 'break-60-everywhere',
    name: 'Break 60 everywhere',
    description: 'Break 60 at every course in the game.',
    section: 'career',
    isUnlocked: courses.length > 0 && courses.every((course) => hasBroken60At(rounds, course)),
  })
  achievements.push({
    id: 'three-peat',
    name: '3-Peat',
    description: 'Shoot 65 or under in 3 consecutive rounds.',
    section: 'career',
    isUnlocked: hasThreePeat(rounds, courses),
  })
  achievements.push({
    id: 'first-hole-in-one',
    name: 'First Hole-in-One',
    description: 'Card a hole-in-one for the first time, on any course.',
    section: 'career',
    isUnlocked: hasAnyHoleInOne(rounds),
  })
  achievements.push({
    id: 'birdie-run',
    name: 'Birdie Run',
    description: 'Card 5 birdies in a row, on any course.',
    section: 'career',
    isUnlocked: hasBirdieRun(rounds),
  })
  achievements.push({
    id: 'perfect-match',
    name: 'Perfect Match',
    description: "Match every golfer's archetype to their hole on all 18 holes in a single round.",
    section: 'career',
    isUnlocked: hasPerfectMatchRound(rounds),
  })
  achievements.push({
    id: 'peoples-champion',
    name: "The People's Champion",
    description: 'Go bogey-free in a round without a single legend in the bag.',
    section: 'career',
    isUnlocked: hasBogeyFreeRoundWithoutLegends(rounds, countries),
  })
  const legendPoints = legendPointsEarned(rounds, countries)
  achievements.push({
    id: 'legendary-stuff',
    name: 'Legendary Stuff',
    description: 'Earn 1,000 career points from legends alone.',
    section: 'career',
    isUnlocked: legendPoints >= LEGENDARY_STUFF_TARGET,
    progress: { current: Math.max(0, legendPoints), target: LEGENDARY_STUFF_TARGET },
  })
  achievements.push({
    id: 'an-off-day',
    name: 'An Off Day',
    description: 'Score +5 or worse in a round.',
    section: 'career',
    isUnlocked: hasOffDayRound(rounds),
  })
  achievements.push({
    id: 'take-mine-scrambled',
    name: 'I Take Mine Scrambled',
    description: 'Birdie a LONG HITTER hole with a SCRAMBLER golfer.',
    section: 'career',
    isUnlocked: hasMismatchBirdie(rounds, courses, countries, 'scrambler', 'long_hitter'),
  })
  achievements.push({
    id: 'bombs-away',
    name: 'Bombs Away',
    description: 'Birdie a SCRAMBLER hole with a LONG HITTER golfer.',
    section: 'career',
    isUnlocked: hasMismatchBirdie(rounds, courses, countries, 'long_hitter', 'scrambler'),
  })
  const grandSlamRosterEntries = grandSlamRoster(rounds, countries)
  const grandSlamComplete = grandSlamRosterEntries.filter((entry) => entry.achieved).length
  achievements.push({
    id: 'grand-slam',
    name: 'The Grand Slam',
    description: 'Card 5 birdies apiece with each of these six legends.',
    section: 'career',
    isUnlocked: grandSlamComplete >= GRAND_SLAM_GOLFER_IDS.length,
    progress: { current: grandSlamComplete, target: GRAND_SLAM_GOLFER_IDS.length },
    roster: grandSlamRosterEntries,
  })

  const draftedIds = draftedGolferIds(rounds)
  const allGolfers = countries.countries.flatMap((country) => country.golfers)
  const fullHouseRoster: AchievementRosterEntry[] = allGolfers.map((golfer) => ({
    name: golfer.name,
    achieved: draftedIds.has(golfer.id),
  }))
  achievements.push({
    id: 'full-house',
    name: 'Full House',
    description: 'Draft every golfer in the game at least once.',
    section: 'career',
    isUnlocked: fullHouseRoster.every((entry) => entry.achieved),
    progress: {
      current: fullHouseRoster.filter((entry) => entry.achieved).length,
      target: fullHouseRoster.length,
    },
    roster: fullHouseRoster,
    compactRoster: true,
  })

  // One "Sweep" achievement per country in the game — birdie or better with
  // every one of that country's golfers, career-wide. Id deliberately
  // prefixed birdie-country- (not birdie-all-, which the per-course
  // achievements above already use) so the two families never collide when
  // grepped for.
  for (const country of countries.countries) {
    const birdiedIds = birdieOrBetterGolferIdsFor(rounds, country.id)
    const countryRoster: AchievementRosterEntry[] = country.golfers.map((golfer) => ({
      name: golfer.name,
      achieved: birdiedIds.has(golfer.id),
    }))
    achievements.push({
      id: `birdie-country-${country.id}`,
      name: `${country.name} Sweep`,
      description: `Get a birdie or better with every player from ${country.name}.`,
      section: 'career',
      isUnlocked: countryRoster.every((entry) => entry.achieved),
      progress: {
        current: countryRoster.filter((entry) => entry.achieved).length,
        target: countryRoster.length,
      },
      roster: countryRoster,
      compactRoster: true,
    })
  }

  // ---- Seasons tab ----
  const seasonGroups = roundsBySeason(rounds)
  const completedSeasons = [...seasonGroups.values()].filter((rs) => rs.length >= TOTAL_ROUNDS)

  achievements.push({
    id: 'first-season',
    name: 'First Season',
    description: 'Complete all 16 rounds of a season.',
    section: 'season',
    isUnlocked: completedSeasons.length >= 1,
  })

  achievements.push({
    id: 'first-major',
    name: 'First Major',
    description: 'Go bogey-free in a major round.',
    section: 'season',
    isUnlocked: rounds.some((r) => r.isMajor && r.isBogeyFreeRound),
  })

  const majorSlamRoster: AchievementRosterEntry[] = MAJOR_COURSE_IDS.map((courseId) => {
    const course = courses.find((c) => c.id === courseId)
    return {
      name: course?.name ?? courseId,
      achieved: isBogeyFreeAt(rounds, courseId),
    }
  })
  achievements.push({
    id: 'major-slam',
    name: 'Major Slam',
    description: 'Go bogey-free in all 4 majors across your career.',
    section: 'season',
    isUnlocked: majorSlamRoster.every((entry) => entry.achieved),
    progress: {
      current: majorSlamRoster.filter((entry) => entry.achieved).length,
      target: majorSlamRoster.length,
    },
    roster: majorSlamRoster,
  })

  const BACK_TO_BACK_SEASONS_REQUIRED = 2
  const seasonsUnderPar = completedSeasons.filter(
    (seasonRounds) => seasonRounds.reduce((sum, r) => sum + r.totalStrokesToPar, 0) < 0,
  ).length
  achievements.push({
    id: 'back-to-back',
    name: 'Back-to-Back',
    description: 'Finish two separate seasons under par.',
    section: 'season',
    isUnlocked: seasonsUnderPar >= BACK_TO_BACK_SEASONS_REQUIRED,
    progress: {
      current: Math.min(seasonsUnderPar, BACK_TO_BACK_SEASONS_REQUIRED),
      target: BACK_TO_BACK_SEASONS_REQUIRED,
    },
  })

  // Takes the single best season's legend coverage, not a sum across
  // seasons — drafting a legend in season 1 and a different one in season 2
  // doesn't inch toward this the way it would for a career-wide achievement
  // like Full House; it has to happen within one season's 16 rounds.
  const legendIds = allLegendGolferIds(countries)
  const golferIndexForLegends = buildGolferIndex(countries)
  let bestSeasonLegends = new Set<string>()
  for (const seasonRounds of seasonGroups.values()) {
    const draftedInSeason = draftedGolferIds(seasonRounds)
    const legendsInSeason = legendIds.filter((id) => draftedInSeason.has(id))
    if (legendsInSeason.length > bestSeasonLegends.size) {
      bestSeasonLegends = new Set(legendsInSeason)
    }
  }
  const allStarRoster: AchievementRosterEntry[] = legendIds.map((id) => ({
    name: golferIndexForLegends.get(id)?.name ?? id,
    achieved: bestSeasonLegends.has(id),
  }))
  achievements.push({
    id: 'all-star-season',
    name: 'All-Star Season',
    description: "Draft every legend at least once across a single season's 16 rounds.",
    section: 'season',
    isUnlocked: bestSeasonLegends.size >= legendIds.length,
    progress: { current: bestSeasonLegends.size, target: legendIds.length },
    roster: allStarRoster,
    compactRoster: true,
  })

  // Ordered by real-world reputation — how well-known each moment is in
  // the golfing world — not by build order or in-game difficulty. Tier 1
  // (globally iconic) first, down through Tier 4 (niche/trivia-level).
  achievements.push({
    id: 'the-impossible-chip',
    name: 'The Impossible Chip',
    description: 'Score a birdie with Tiger Woods on Augusta National’s 16th.',
    section: 'iconic',
    isUnlocked: hasBirdieAt(rounds, IMPOSSIBLE_CHIP_COURSE_ID, IMPOSSIBLE_CHIP_HOLE_NUMBER, IMPOSSIBLE_CHIP_GOLFER_ID),
    trivia:
      "Tiger Woods holed a chip on Augusta's 16th during the final round of the 2005 Masters — the ball paused on the lip just long enough for the Nike swoosh to face the camera before dropping.",
  })
  achievements.push({
    id: 'amen-corner-answered',
    name: 'Amen Corner, Prayers Answered',
    description: 'Play holes 11–13 at Augusta National — Amen Corner — under par, combined.',
    section: 'iconic',
    isUnlocked: hasPlayedAmenCornerUnderPar(rounds),
    trivia:
      "Sportswriter Herbert Warren Wind coined \"Amen Corner\" in 1958, naming Augusta's 11th, 12th, and 13th after the jazz record \"Shoutin' in that Amen Corner.\"",
  })
  achievements.push({
    id: 'golden-bear',
    name: 'Golden Bear',
    description: 'Go bogey-free at Augusta National with Jack Nicklaus in the bag.',
    section: 'iconic',
    isUnlocked: hasGoneBogeyFreeWithGolferAt(rounds, GOLDEN_BEAR_COURSE_ID, GOLDEN_BEAR_GOLFER_ID),
    trivia: 'Jack Nicklaus — golf\'s "Golden Bear" — won a record six Masters titles at Augusta National, from 1963 to 1986.',
  })
  achievements.push({
    id: 'pebble-beach-runaway',
    name: "Tiger's Pebble Beach Runaway",
    description: `Score ${PEBBLE_BEACH_RUNAWAY_MAX_TO_PAR} or better at Pebble Beach with Tiger Woods in the bag.`,
    section: 'iconic',
    isUnlocked: hasScoredWithGolferAt(
      rounds,
      PEBBLE_BEACH_RUNAWAY_COURSE_ID,
      PEBBLE_BEACH_RUNAWAY_GOLFER_ID,
      PEBBLE_BEACH_RUNAWAY_MAX_TO_PAR,
    ),
    trivia:
      'Tiger Woods won the 2000 US Open at Pebble Beach by a record 15 strokes, finishing 12 under par — the largest margin of victory in major championship history.',
  })
  achievements.push({
    id: 'ace-island-green',
    name: 'Ace on the Island Green',
    description: "Make a hole-in-one on TPC Sawgrass's par-3 17th — the Island Green.",
    section: 'iconic',
    isUnlocked: hasHoleInOneAt(rounds, ISLAND_GREEN_COURSE_ID, ISLAND_GREEN_HOLE_NUMBER),
    trivia:
      "TPC Sawgrass's par-3 17th is almost entirely surrounded by water, making it one of the most recognizable — and feared — holes in golf.",
  })
  achievements.push({
    id: 'postcard-perfect',
    name: 'Postcard Perfect',
    description: "Make a hole-in-one on Pebble Beach's tiny par-3 7th.",
    section: 'iconic',
    isUnlocked: hasHoleInOneAt(rounds, POSTCARD_PERFECT_COURSE_ID, POSTCARD_PERFECT_HOLE_NUMBER),
    trivia:
      "Pebble Beach's par-3 7th plays as short as 100 yards but sits perched above the Pacific, making it one of the most photographed holes in golf.",
  })
  achievements.push({
    id: 'miracle-at-medinah',
    name: 'Miracle at Medinah',
    description: 'Birdie any of the final 5 holes at Medinah with Ian Poulter.',
    section: 'iconic',
    isUnlocked: hasBirdieAtAnyOf(
      rounds,
      MIRACLE_AT_MEDINAH_COURSE_ID,
      MIRACLE_AT_MEDINAH_HOLE_NUMBERS,
      MIRACLE_AT_MEDINAH_GOLFER_ID,
    ),
    trivia:
      "Ian Poulter birdied his final five holes during the 2012 Ryder Cup's Saturday four-balls, part of a run that fired up Europe's historic comeback from 10-6 down.",
  })
  achievements.push({
    id: 'cup-clincher',
    name: 'The Cup Clincher',
    description: "Birdie Marco Simone's 17th with Rory McIlroy.",
    section: 'iconic',
    isUnlocked: hasBirdieAt(rounds, CUP_CLINCHER_COURSE_ID, CUP_CLINCHER_HOLE_NUMBER, CUP_CLINCHER_GOLFER_ID),
    trivia:
      "Rory McIlroy beat Sam Burns 3&1 in the final Sunday singles match of the 2023 Ryder Cup — decided on the 17th green — sealing Europe's Cup-winning point at Marco Simone.",
  })
  achievements.push({
    id: 'scheffler-gold',
    name: 'Olympic Gold',
    description: `Score ${SCHEFFLER_GOLD_MAX_TO_PAR} or better at Le Golf National with Scottie Scheffler in the bag.`,
    section: 'iconic',
    isUnlocked: hasScoredWithGolferAt(
      rounds,
      SCHEFFLER_GOLD_COURSE_ID,
      SCHEFFLER_GOLD_GOLFER_ID,
      SCHEFFLER_GOLD_MAX_TO_PAR,
    ),
    trivia:
      'Scottie Scheffler closed with a final-round 62 at Le Golf National to win the gold medal at the 2024 Paris Olympics.',
  })
  achievements.push({
    id: 'faldos-redemption',
    name: "Faldo's Redemption",
    description: `Score ${FALDOS_REDEMPTION_MAX_TO_PAR} or better at Augusta National with Nick Faldo in the bag.`,
    section: 'iconic',
    isUnlocked: hasScoredWithGolferAt(
      rounds,
      FALDOS_REDEMPTION_COURSE_ID,
      FALDOS_REDEMPTION_GOLFER_ID,
      FALDOS_REDEMPTION_MAX_TO_PAR,
    ),
    trivia:
      "Nick Faldo closed with a 67 in the final round of the 1996 Masters, completing one of golf's greatest comebacks as Greg Norman's six-shot lead collapsed behind him.",
  })
  achievements.push({
    id: 'lawrie-comeback',
    name: 'The Carnoustie Comeback',
    description: `Score ${LAWRIE_COMEBACK_MAX_TO_PAR} or better at Carnoustie with Paul Lawrie in the bag.`,
    section: 'iconic',
    isUnlocked: hasScoredWithGolferAt(
      rounds,
      LAWRIE_COMEBACK_COURSE_ID,
      LAWRIE_COMEBACK_GOLFER_ID,
      LAWRIE_COMEBACK_MAX_TO_PAR,
    ),
    trivia:
      "Paul Lawrie came from 10 shots back in the final round to win the 1999 Open Championship at Carnoustie, closing with a 4-under 67 after Jean van de Velde's collapse at the 18th forced a playoff.",
  })
  achievements.push({
    id: 'stenson-finale',
    name: "The Iceman's Finale",
    description: `Shoot ${STENSON_ICEMAN_MAX_GROSS_SCORE} or better at the Earth Course with Henrik Stenson in the bag.`,
    section: 'iconic',
    isUnlocked: hasShotGrossWithGolferAt(
      rounds,
      courses,
      STENSON_ICEMAN_COURSE_ID,
      STENSON_ICEMAN_GOLFER_ID,
      STENSON_ICEMAN_MAX_GROSS_SCORE,
    ),
    trivia:
      'Henrik Stenson — nicknamed "The Iceman" for his cool composure under pressure — closed with a 64 to win the 2013 DP World Tour Championship, and the Race to Dubai title with it, at Jumeirah Golf Estates\' Earth Course.',
  })
  achievements.push({
    id: 'seves-home-course',
    name: "Seve's Home Course",
    description: 'Go bogey-free at Valderrama with Seve Ballesteros in the bag.',
    section: 'iconic',
    isUnlocked: hasGoneBogeyFreeWithGolferAt(rounds, SEVES_HOME_COURSE_COURSE_ID, SEVES_HOME_COURSE_GOLFER_ID),
    trivia:
      'Seve Ballesteros designed Valderrama himself, then captained Europe to its first-ever Ryder Cup win on Spanish soil there in 1997.',
  })
  achievements.push({
    id: 'kiwi-closer',
    name: 'Kiwi Closer',
    description: "Birdie Royal Birkdale's 18th with Ryan Fox.",
    section: 'iconic',
    isUnlocked: hasBirdieAt(rounds, KIWI_CLOSER_COURSE_ID, KIWI_CLOSER_HOLE_NUMBER, KIWI_CLOSER_GOLFER_ID),
    trivia: 'Ryan Fox is one of New Zealand\'s most successful modern golfers, a multiple-time DP World Tour winner known for his power off the tee.',
  })
  achievements.push({
    id: 'jimenez-escape',
    name: "Jimenez's Escape",
    description: 'Make par or better on the Road Hole at St Andrews with Miguel Angel Jimenez.',
    section: 'iconic',
    isUnlocked: hasJimenezEscape(rounds),
    trivia:
      "In the 2010 Open Championship, Miguel Ángel Jiménez's tee shot on the Road Hole came to rest against the stone boundary wall — and he still escaped with a par.",
  })
  achievements.push({
    id: 'garcia-home-soil',
    name: 'Home Soil Hero',
    description: `Score ${GARCIA_HOME_SOIL_MAX_TO_PAR} or better at Valderrama with Sergio García in the bag.`,
    section: 'iconic',
    isUnlocked: hasScoredWithGolferAt(
      rounds,
      GARCIA_HOME_SOIL_COURSE_ID,
      GARCIA_HOME_SOIL_GOLFER_ID,
      GARCIA_HOME_SOIL_MAX_TO_PAR,
    ),
    trivia:
      'Sergio García fired a second-round 64 at Valderrama on his way to winning the 2018 Andalucía Valderrama Masters on home soil in Spain.',
  })
  achievements.push({
    id: 'spirit-of-seve',
    name: 'Spirit of Seve',
    description: "Birdie Brabazon's 10th with any Spanish golfer.",
    section: 'iconic',
    isUnlocked: hasBirdieAtByCountry(
      rounds,
      SPIRIT_OF_SEVE_COURSE_ID,
      SPIRIT_OF_SEVE_HOLE_NUMBER,
      SPIRIT_OF_SEVE_COUNTRY_ID,
    ),
    trivia:
      "As golf lore has it, Seve Ballesteros drove the green on The Belfry's short, daring par-4 10th during a practice round — the kind of audacious play that made him a Ryder Cup legend across five appearances for Europe.",
  })
  achievements.push({
    id: 'harringtons-survival',
    name: "Harrington's Survival",
    description: `Score +${HARRINGTONS_SURVIVAL_MIN_TO_PAR} or worse at Royal Birkdale with Padraig Harrington in the bag.`,
    section: 'iconic',
    isUnlocked: hasScoredWorseWithGolferAt(
      rounds,
      HARRINGTONS_SURVIVAL_COURSE_ID,
      HARRINGTONS_SURVIVAL_GOLFER_ID,
      HARRINGTONS_SURVIVAL_MIN_TO_PAR,
    ),
    trivia:
      'Padraig Harrington won the 2008 Open Championship at Royal Birkdale in brutal wind and rain, closing at 3-over-par — the highest winning score at The Open in almost two decades.',
  })

  return achievements
}
