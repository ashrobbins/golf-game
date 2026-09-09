import { useState } from 'react'
import { AchievementCard } from '../achievements/AchievementCard'
import type { Achievement } from '../../game/achievements/deriveAchievements'
import styles from './AchievementChecklist.module.css'

// Closed-by-default accordion on the Course Preview page — "things you
// could try to check off" for the specific round about to be played. Renders
// nothing at all when there's nothing left to chase here (every relevant
// achievement is already unlocked), rather than showing an empty "0" panel.
export function AchievementChecklist({
  achievements,
  courseName,
}: {
  achievements: Achievement[]
  courseName: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  if (achievements.length === 0) return null

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <span className={styles.toggleLabel}>
          <span aria-hidden>🏆</span>
          <span className={styles.toggleLabelLines}>
            <span>{courseName}</span>
            <span>Achievement Checklist</span>
          </span>
        </span>
        <span className={styles.toggleRight}>
          <span className={styles.count}>{achievements.length}</span>
          <span className={isOpen ? `${styles.chevron} ${styles.chevronOpen}` : styles.chevron} aria-hidden>
            ▾
          </span>
        </span>
      </button>
      {isOpen && (
        <div className={styles.panel}>
          <AchievementCard achievements={achievements} />
        </div>
      )}
    </div>
  )
}
