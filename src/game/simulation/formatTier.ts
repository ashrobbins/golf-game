import type { OutcomeTier } from '../../content/types'

export function formatTierLabel(tier: OutcomeTier): string {
  switch (tier) {
    case 'hole_in_one':
      return 'Hole-in-one!'
    case 'eagle':
      return 'Eagle'
    case 'birdie':
      return 'Birdie'
    case 'par':
      return 'Par'
    case 'bogey_plus':
      return 'Bogey+'
  }
}

// Hole-in-one keeps the gold treatment it already has elsewhere (e.g. the
// ScorecardGrid mark, the bogey-free headline); eagle/birdie read as an
// ordinary win (green); bogey+ reads as a miss (red); par is left
// uncolored, matching the blank/neutral treatment it already gets in
// ScorecardGrid.
export function tierColorVar(tier: OutcomeTier): string | undefined {
  switch (tier) {
    case 'hole_in_one':
      return 'var(--tier-gold)'
    case 'eagle':
    case 'birdie':
      return 'var(--tier-green)'
    case 'bogey_plus':
      return 'var(--tier-red)'
    case 'par':
      return undefined
  }
}

export function formatRelativeScore(score: number): string {
  if (score === 0) return 'E'
  return score > 0 ? `+${score}` : `${score}`
}

export function formatBogeyFreeHeadline(
  bogeyFreeThroughHole: number,
  isBogeyFreeRound: boolean,
  totalHoles: number,
): string {
  if (isBogeyFreeRound) return `Bogey-free ${totalHoles}!`
  if (bogeyFreeThroughHole === 0) return 'Bogey-free until the first tee'
  return `Bogey-free through hole ${bogeyFreeThroughHole}`
}
