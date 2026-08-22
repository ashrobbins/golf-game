import type { CSSProperties } from 'react'
import {
  archetypeColorVar,
  formatArchetypeAbbreviation,
  formatArchetypeLabel,
} from '../../content/formatArchetype'
import type { ArchetypeTag } from '../../content/types'
import styles from './ArchetypeBadge.module.css'

interface ArchetypeBadgeProps {
  tag: ArchetypeTag
  className?: string
  // 'compact' shrinks the label — used where the badge sits inside an
  // already-dense layout (golfer cards).
  size?: 'default' | 'compact'
  // 'abbr' swaps in a fixed-width 3-letter code instead of the full label —
  // used only in the draft roster, where variable-length labels caused the
  // row to reflow as picks came in.
  label?: 'full' | 'abbr'
}

// Shared colour-coded label for an archetype tag — used on the course
// preview table, the draft page's hole header, golfer cards, and the draft
// roster so all four read as the same visual language.
export function ArchetypeBadge({ tag, className, size = 'default', label = 'full' }: ArchetypeBadgeProps) {
  const classes = [styles.badge, size === 'compact' && styles.compact, className].filter(Boolean).join(' ')

  return (
    <span className={classes} style={{ '--badge-color': archetypeColorVar(tag) } as CSSProperties}>
      {label === 'abbr' ? formatArchetypeAbbreviation(tag) : formatArchetypeLabel(tag)}
    </span>
  )
}
