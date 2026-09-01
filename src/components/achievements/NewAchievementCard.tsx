import type { Achievement } from '../../game/achievements/deriveAchievements'
import { ArrowRightIcon } from '../ui/icons'
import styles from './NewAchievementCard.module.css'

interface NewAchievementCardProps {
  achievements: Achievement[]
  onViewAchievements: () => void
}

// Shown on the results page, directly under ResultsHero, only when this
// specific round newly unlocked one or more achievements (see
// GameProvider.tsx's finishDraft, which diffs achievement state from just
// before the round to just after it). A round can unlock more than one at
// once, so this stacks a short list rather than only ever showing one.
export function NewAchievementCard({ achievements, onViewAchievements }: NewAchievementCardProps) {
  if (achievements.length === 0) return null

  return (
    <div className={styles.card}>
      <p className={styles.heading}>
        <span aria-hidden>🎉</span> New Achievement complete
      </p>
      {achievements.map((achievement) => (
        <div key={achievement.id} className={styles.row}>
          <span className={styles.trophy} aria-hidden>
            🏆
          </span>
          <div className={styles.body}>
            <p className={styles.name}>{achievement.name}</p>
            <p className={styles.desc}>{achievement.description}</p>
          </div>
        </div>
      ))}
      <button type="button" className={styles.cta} onClick={onViewAchievements}>
        View achievements
        <ArrowRightIcon className={styles.ctaIcon} />
      </button>
    </div>
  )
}
