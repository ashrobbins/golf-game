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

export function GolferCard({ golfer, onClick }: GolferCardProps) {
  const [firstName, surname] = splitName(golfer.name)

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
        <div className={styles.surname}>{surname}</div>
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
