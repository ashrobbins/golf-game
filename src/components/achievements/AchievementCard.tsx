import type { Achievement } from '../../game/achievements/deriveAchievements'
import { AchievementHoleDots } from './AchievementHoleDots'
import { AchievementProgress } from './AchievementProgress'
import { AchievementRoster } from './AchievementRoster'
import styles from './AchievementCard.module.css'

// Shared list-of-achievements card — used by AchievementsPage's own
// section lists, and reused as-is by the Course Preview page's Achievement
// Checklist, so both read as the same visual language.
export function AchievementCard({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className={styles.card}>
      <ul className={styles.list}>
        {achievements.map((achievement) => {
          const rowClasses = [styles.row, achievement.isUnlocked && styles.unlocked].filter(Boolean).join(' ')
          return (
            <li key={achievement.id} className={rowClasses}>
              <span className={styles.trophy} aria-hidden>
                🏆
              </span>
              <div className={styles.body}>
                <div className={styles.name}>{achievement.name}</div>
                <p className={styles.desc}>{achievement.description}</p>
                {achievement.roster && !achievement.compactRoster && (
                  <AchievementRoster roster={achievement.roster} />
                )}
                {achievement.progress && (
                  <AchievementProgress {...achievement.progress} roster={achievement.roster} />
                )}
                {achievement.holeProgress && <AchievementHoleDots holes={achievement.holeProgress} />}
                {achievement.trivia && <p className={styles.trivia}>{achievement.trivia}</p>}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
