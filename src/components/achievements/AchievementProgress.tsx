import { useState } from 'react'
import type {
  AchievementProgress as AchievementProgressData,
  AchievementRosterEntry,
} from '../../game/achievements/deriveAchievements'
import styles from './AchievementProgress.module.css'

interface AchievementProgressProps extends AchievementProgressData {
  // Present for any achievement with a named checklist — Grand Slam/Major
  // Slam's per-golfer birdie counts (each entry also carries current/
  // target), or a plain drafted-or-not/birdied-or-not checklist like Full
  // House or a country Sweep (entries carry just `achieved`). Either way,
  // the badge becomes a toggle revealing the full list; a row only shows
  // its own fraction when that entry defines current/target.
  roster?: AchievementRosterEntry[]
}

// Renders an achievement's optional {current, target} pair as an "X/Y"
// badge (e.g. "438/1,000") — a reusable building block for any achievement
// that tracks toward a numeric goal rather than unlocking in one round.
export function AchievementProgress({ current, target, roster }: AchievementProgressProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!roster || roster.length === 0) {
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
          {roster.map((entry) => (
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
              {entry.current !== undefined && entry.target !== undefined && (
                <span className={styles.count}>
                  {entry.current.toLocaleString()}/{entry.target.toLocaleString()}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
