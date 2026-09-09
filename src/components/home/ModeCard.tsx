import type { ReactNode } from 'react'
import styles from './ModeCard.module.css'

interface ModeCardProps {
  icon: ReactNode
  title: string
  description: string
  // progressLabel is optional on its own — the "Season complete" state has
  // no label above it, just the value — but progressValue is required
  // whenever either is passed, since a label with no value renders nothing.
  progressLabel?: string
  progressValue?: string
  tone?: 'accent' | 'gold'
  onClick: () => void
}

// Same visual language as CourseCard (the accent-tinted gradient wash,
// border/radius/shadow, hover lift, focus ring, 560px mobile breakpoint) —
// deliberately a separate component rather than reusing CourseCard itself,
// since CourseCard's props are tightly course-shaped (par/flag/location).
export function ModeCard({
  icon,
  title,
  description,
  progressLabel,
  progressValue,
  tone = 'accent',
  onClick,
}: ModeCardProps) {
  return (
    <button
      type="button"
      className={tone === 'gold' ? `${styles.card} ${styles.gold}` : styles.card}
      onClick={onClick}
    >
      <span className={styles.icon} aria-hidden>
        {icon}
      </span>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      {progressValue && (
        <span className={styles.progress}>
          {progressLabel && <span className={styles.progressLabel}>{progressLabel}</span>}
          <span className={styles.progressValue}>{progressValue}</span>
        </span>
      )}
    </button>
  )
}
