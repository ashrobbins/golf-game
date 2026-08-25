import { ArchetypeBadge } from '../ui/ArchetypeBadge'
import { CountryFlag } from '../picker/CountryFlag'
import type { Hole } from '../../content/types'
import styles from './HoleHeader.module.css'

interface HoleHeaderProps {
  courseName: string
  countryIsoCode?: string
  hole: Hole
  totalHoles: number
}

export function HoleHeader({ courseName, countryIsoCode, hole, totalHoles }: HoleHeaderProps) {
  return (
    <div className={styles.header}>
      <h2 className={styles.title}>
        {countryIsoCode && (
          <CountryFlag isoCode={countryIsoCode} className={styles.titleFlag} ariaHidden />
        )}
        {courseName} — Hole {hole.number} / {totalHoles}
      </h2>
      {hole.name && <p className={styles.holeName}>{hole.name}</p>}
      <p className={styles.details}>
        Par {hole.par} · {hole.yardage} yds
      </p>
      <ArchetypeBadge tag={hole.archetype} className={styles.archetype} />
    </div>
  )
}
