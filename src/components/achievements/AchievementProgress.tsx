import { useState } from 'react'
import type {
  AchievementProgress as AchievementProgressData,
  AchievementRosterEntry,
} from '../../game/achievements/deriveAchievements'
import styles from './AchievementProgress.module.css'

interface AchievementProgressProps extends AchievementProgressData {
  // Only present for achievements whose roster entries also carry a
  // current/target breakdown (currently just The Grand Slam's per-golfer
  // birdie counts). When that breakdown exists, the badge becomes a toggle
  // that reveals it; otherwise it stays a plain, non-interactive "X/Y" pill.
  roster?: AchievementRosterEntry[]
}

// Renders an achievement's optional {current, target} pair as an "X/Y"
// badge (e.g. "438/1,000") — a reusable building block for any achievement
// that tracks toward a numeric goal rather than unlocking in one round.
export function AchievementProgress({ current, target, roster }: AchievementProgressProps) {
  const [isOpen, setIsOpen] = useState(false)

  const breakdown = roster?.filter(
    (entry): entry is AchievementRosterEntry & { current: number; target: number } =>
      entry.current !== undefined && entry.target !== undefined,
  )

  if (!breakdown || breakdown.length === 0) {
    return (
      <span className={styles.badge}>
        {current.toLocaleString()}/{target.toLocaleString()}
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        className={`${styles.badge} ${styles.toggle}`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {current.toLocaleString()}/{target.toLocaleString()}
        <span className={styles.chevron} aria-hidden>
          ▾
        </span>
      </button>
      {isOpen && (
        <div className={styles.breakdown}>
          {breakdown.map((entry) => (
            <div
              key={entry.name}
              className={entry.achieved ? `${styles.row} ${styles.achieved}` : styles.row}
            >
              <span className={styles.name}>
                {entry.achieved && (
                  <span className={styles.check} aria-hidden>
                    ✓
                  </span>
                )}
                {entry.name}
              </span>
              <span className={styles.count}>
                {entry.current.toLocaleString()}/{entry.target.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
