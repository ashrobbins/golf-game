import type { HoleResult, SimulationResult } from '../game/simulation/types'

// Debug-only fixture for the `?simResults` URL param (see GameProvider.tsx)
// — a quick way to land straight on the results page without playing
// through a full draft. Hand-crafted, not simulated: real golfers and a
// real course, but the outcome tiers are deliberately chosen (not rolled)
// to cover all five at least once — including a hole-in-one, which real
// random play essentially never produces — so every ScoreMark shape/color
// gets exercised. Never touches real game state or history.
export const MOCK_COURSE_ID = 'augusta-national'

const HOLE_RESULTS: HoleResult[] = [
  { holeNumber: 1, golferId: 'usa-nicklaus', countryId: 'usa', outcomeTier: 'birdie', archetypeMatched: false, relativeScore: -1 },
  { holeNumber: 2, golferId: 'sco-macintyre', countryId: 'scotland', outcomeTier: 'eagle', archetypeMatched: false, relativeScore: -2 },
  { holeNumber: 3, golferId: 'rsa-player', countryId: 'south-africa', outcomeTier: 'par', archetypeMatched: false, relativeScore: 0 },
  { holeNumber: 4, golferId: 'eng-fitzpatrick', countryId: 'england', outcomeTier: 'hole_in_one', archetypeMatched: false, relativeScore: -2 },
  { holeNumber: 5, golferId: 'esp-rahm', countryId: 'spain', outcomeTier: 'bogey_plus', archetypeMatched: true, relativeScore: 1 },
  { holeNumber: 6, golferId: 'nir-mcilroy', countryId: 'northern-ireland', outcomeTier: 'birdie', archetypeMatched: false, relativeScore: -1 },
  { holeNumber: 7, golferId: 'aus-lee', countryId: 'australia', outcomeTier: 'par', archetypeMatched: false, relativeScore: 0 },
  { holeNumber: 8, golferId: 'jpn-matsuyama', countryId: 'japan', outcomeTier: 'bogey_plus', archetypeMatched: false, relativeScore: 1 },
  { holeNumber: 9, golferId: 'swe-stenson', countryId: 'sweden', outcomeTier: 'eagle', archetypeMatched: false, relativeScore: -2 },
  { holeNumber: 10, golferId: 'ger-kaymer', countryId: 'germany', outcomeTier: 'par', archetypeMatched: false, relativeScore: 0 },
  { holeNumber: 11, golferId: 'irl-lowry', countryId: 'ireland', outcomeTier: 'birdie', archetypeMatched: false, relativeScore: -1 },
  { holeNumber: 12, golferId: 'wal-woosnam', countryId: 'wales', outcomeTier: 'par', archetypeMatched: false, relativeScore: 0 },
  { holeNumber: 13, golferId: 'nzl-fox', countryId: 'new-zealand', outcomeTier: 'bogey_plus', archetypeMatched: true, relativeScore: 1 },
  { holeNumber: 14, golferId: 'can-conners', countryId: 'canada', outcomeTier: 'birdie', archetypeMatched: false, relativeScore: -1 },
  { holeNumber: 15, golferId: 'kor-im', countryId: 'south-korea', outcomeTier: 'eagle', archetypeMatched: false, relativeScore: -2 },
  { holeNumber: 16, golferId: 'den-hojgaard-r', countryId: 'denmark', outcomeTier: 'par', archetypeMatched: false, relativeScore: 0 },
  { holeNumber: 17, golferId: 'ita-molinari-f', countryId: 'italy', outcomeTier: 'bogey_plus', archetypeMatched: true, relativeScore: 1 },
  { holeNumber: 18, golferId: 'oth-price', countryId: 'others', outcomeTier: 'birdie', archetypeMatched: true, relativeScore: -1 },
]

const firstBogeyIndex = HOLE_RESULTS.findIndex((r) => r.outcomeTier === 'bogey_plus')

export const MOCK_SIMULATION_RESULT: SimulationResult = {
  courseId: MOCK_COURSE_ID,
  holeResults: HOLE_RESULTS,
  totalStrokesToPar: HOLE_RESULTS.reduce((sum, r) => sum + r.relativeScore, 0),
  bogeyFreeThroughHole: firstBogeyIndex === -1 ? HOLE_RESULTS.length : firstBogeyIndex,
  isBogeyFreeRound: firstBogeyIndex === -1,
}
