import { formatRelativeScore } from '../simulation/formatTier'
import type { SimulationResult } from '../simulation/types'
import { encodeRoundCode } from './roundCode'

function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

export function buildShareUrl(result: SimulationResult, baseUrl: string): string {
  const code = encodeRoundCode(result.courseId, result.holeResults)
  return `${baseUrl.replace(/\/$/, '')}/round/${code}`
}

// Two templates, matching exactly: a fully bogey-free round gets the
// simpler "and went bogey-free" phrasing, a broken streak names the last
// hole it survived through.
export function buildShareText(courseName: string, result: SimulationResult, url: string): string {
  const score = formatRelativeScore(result.totalStrokesToPar)
  if (result.isBogeyFreeRound) {
    return `I shot ${score} at ${courseName} and went bogey-free. Can you go lower? ${url}`
  }
  return `I shot ${score} at ${courseName}, and went bogey-free through the ${ordinal(result.bogeyFreeThroughHole)} hole. Can you go lower? ${url}`
}
