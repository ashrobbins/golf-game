import { formatArchetypeLabel } from '../../content/formatArchetype'
import type { Hole } from '../../content/types'
import styles from './HoleHeader.module.css'

interface HoleHeaderProps {
  courseName: string
  hole: Hole
  totalHoles: number
}

export function HoleHeader({ courseName, hole, totalHoles }: HoleHeaderProps) {
  return (
    <div className={styles.header}>
      <h2 className={styles.title}>
        {courseName} — Hole {hole.number} / {totalHoles}
      </h2>
      <p className={styles.details}>
        Par {hole.par} · {hole.yardage} yds · {formatArchetypeLabel(hole.archetype)}
      </p>
    </div>
  )
}
