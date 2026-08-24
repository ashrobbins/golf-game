import type { KeyboardEvent } from 'react'
import { splitName } from '../../content/formatName'
import type { Golfer } from '../../content/types'
import { ArchetypeBadge } from '../ui/ArchetypeBadge'
import styles from './GolferCard.module.css'

interface GolferCardProps {
  golfer: Golfer
  // When provided, the whole card acts as the selection control (in
  // addition to whatever Select button a parent renders alongside it).
  onClick?: () => void
}

// A surname only risks an ugly mid-word wrap if it contains one long
// unbroken word — "Tom Morris" and "Cabrera-Bello" wrap fine at their
// natural space/hyphen, no shrinking needed. Checked against the real
// roster's longest names (up to "Ballesteros"/"Montgomerie" at 11 chars).
const LONG_WORD_THRESHOLD = 10

function hasLongWord(surname: string): boolean {
  return surname.split(/[\s-]+/).some((word) => word.length >= LONG_WORD_THRESHOLD)
}

export function GolferCard({ golfer, onClick }: GolferCardProps) {
  const [firstName, surname] = splitName(golfer.name)
  const surnameClassName = hasLongWord(surname) ? `${styles.surname} ${styles.surnameLong}` : styles.surname

  const cardClassName = [styles.card, onClick && styles.clickable].filter(Boolean).join(' ')

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!onClick) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      className={cardClassName}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.name}>
        <div className={styles.firstName}>{firstName}</div>
        <div className={surnameClassName}>{surname}</div>
      </div>
      <div className={styles.era}>{golfer.era ?? ' '}</div>
      <div className={styles.chips}>
        {golfer.archetypes.map((tag) => (
          <ArchetypeBadge key={tag} tag={tag} size="compact" />
        ))}
      </div>
    </div>
  )
}
