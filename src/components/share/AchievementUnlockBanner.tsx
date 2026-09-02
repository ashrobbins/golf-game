import type { Achievement } from '../../game/achievements/deriveAchievements'
import styles from './AchievementUnlockBanner.module.css'

interface AchievementUnlockBannerProps {
  achievements: Achievement[]
}

// Share-card-specific sibling of achievements/NewAchievementCard — same
// gold trophy language, but names only (no description, no CTA button):
// there's no room to spare at 400px wide alongside the hero/scorecard/top
// performer this sits between, and the name alone is what earns a second
// look from someone scrolling past the shared image.
export function AchievementUnlockBanner({ achievements }: AchievementUnlockBannerProps) {
  if (achievements.length === 0) return null

  return (
    <div className={styles.banner}>
      <p className={styles.heading}>
        <span aria-hidden>🎉</span> New achievement{achievements.length > 1 ? 's' : ''} unlocked
      </p>
      {achievements.map((achievement) => (
        <div key={achievement.id} className={styles.row}>
          <span className={styles.trophy} aria-hidden>
            🏆
          </span>
          <p className={styles.name}>{achievement.name}</p>
        </div>
      ))}
    </div>
  )
}
