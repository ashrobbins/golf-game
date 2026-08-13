import type { ArchetypeTag } from './types'

// Display labels for archetype tags. Kept separate from the tag id itself
// so the id can stay stable in content/tests while the label is free to
// change for UI reasons (e.g. fitting inside a golfer card chip).
const ARCHETYPE_LABELS: Record<ArchetypeTag, string> = {
  long_hitter: 'long hitter',
  precision_iron: 'precision iron',
  short_game_specialist: 'short game wizard',
  scrambler: 'scrambler',
  closer: 'closer',
}

export function formatArchetypeLabel(tag: ArchetypeTag): string {
  return ARCHETYPE_LABELS[tag]
}

// 'closer' deliberately reuses the gold tier color (clutch/premium moments,
// same association as an eagle/ace elsewhere in the app) rather than adding
// a fifth one-off color.
const ARCHETYPE_COLOR_VARS: Record<ArchetypeTag, string> = {
  long_hitter: 'var(--archetype-long-hitter)',
  precision_iron: 'var(--archetype-precision-iron)',
  short_game_specialist: 'var(--archetype-short-game)',
  scrambler: 'var(--archetype-scrambler)',
  closer: 'var(--tier-gold)',
}

export function archetypeColorVar(tag: ArchetypeTag): string {
  return ARCHETYPE_COLOR_VARS[tag]
}
