import type { CSSProperties } from 'react'
import { archetypeColorVar, formatArchetypeLabel } from '../../content/formatArchetype'
import type { ArchetypeTag } from '../../content/types'
import styles from './ArchetypeBadge.module.css'

interface ArchetypeBadgeProps {
  tag: ArchetypeTag
  className?: string
}

// Shared colour-coded "dot + label" treatment for an archetype tag — used on
// the course preview table and the draft page's hole header so the two
// screens read as the same visual language.
export function ArchetypeBadge({ tag, className }: ArchetypeBadgeProps) {
  return (
    <span
      className={className ? `${styles.badge} ${className}` : styles.badge}
      style={{ '--badge-color': archetypeColorVar(tag) } as CSSProperties}
    >
      {formatArchetypeLabel(tag)}
    </span>
  )
}
