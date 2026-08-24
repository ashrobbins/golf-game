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

// Canonical list of every archetype tag, in the order they should read in
// any UI enumerating all of them (e.g. the How to Play drawer's legend).
export const ALL_ARCHETYPES = Object.keys(ARCHETYPE_LABELS) as ArchetypeTag[]

// 3-letter abbreviations — used only in the draft roster's archetype
// pairing, where the full labels caused the row layout to shift/wrap
// unpredictably as picks came in.
const ARCHETYPE_ABBREVIATIONS: Record<ArchetypeTag, string> = {
  long_hitter: 'LNG',
  precision_iron: 'IRN',
  short_game_specialist: 'SGW',
  scrambler: 'SCR',
  closer: 'CLO',
}

export function formatArchetypeAbbreviation(tag: ArchetypeTag): string {
  return ARCHETYPE_ABBREVIATIONS[tag]
}

const ARCHETYPE_COLOR_VARS: Record<ArchetypeTag, string> = {
  long_hitter: 'var(--archetype-long-hitter)',
  precision_iron: 'var(--archetype-precision-iron)',
  short_game_specialist: 'var(--archetype-short-game)',
  scrambler: 'var(--archetype-scrambler)',
  closer: 'var(--archetype-closer)',
}

export function archetypeColorVar(tag: ArchetypeTag): string {
  return ARCHETYPE_COLOR_VARS[tag]
}
