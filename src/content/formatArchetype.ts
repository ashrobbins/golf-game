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
