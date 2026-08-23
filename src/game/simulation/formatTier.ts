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
