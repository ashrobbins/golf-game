import type { ReactNode } from 'react'
import styles from './ModeCard.module.css'

interface ModeCardProps {
  icon: ReactNode
  title: string
  description: string
  progress?: string
  tone?: 'accent' | 'gold'
  onClick: () => void
}

// Same visual language as CourseCard (the accent-tinted gradient wash,
// border/radius/shadow, hover lift, focus ring, 560px mobile breakpoint) —
// deliberately a separate component rather than reusing CourseCard itself,
// since CourseCard's props are tightly course-shaped (par/flag/location).
export function ModeCard({ icon, title, description, progress, tone = 'accent', onClick }: ModeCardProps) {
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
      {progress && (
        <span className={styles.progress}>
          <span className={styles.progressLabel}>Season in progress</span>
          <span className={styles.progressValue}>{progress}</span>
        </span>
      )}
    </button>
  )
}
