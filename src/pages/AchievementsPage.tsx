import { useMemo, useState } from 'react'
import { deriveAchievements } from '../game/achievements/deriveAchievements'
import type { Achievement } from '../game/achievements/deriveAchievements'
import { loadStats } from '../game/stats/storage'
import { useGame } from '../state/useGame'
import styles from './AchievementsPage.module.css'

export function AchievementsPage() {
  const { content, statsOverride } = useGame()
  const [stats] = useState(() => loadStats())
  const rounds = statsOverride ?? stats.rounds

  const achievements = useMemo(() => {
    if (content.status !== 'ready') return []
    return deriveAchievements(rounds, content.courses.courses)
  }, [content, rounds])

  if (content.status !== 'ready') return null

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length
  const courseAchievements = achievements.filter((a) => a.section === 'course')
  const careerAchievements = achievements.filter((a) => a.section === 'career')
  const iconicAchievements = achievements.filter((a) => a.section === 'iconic')

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Achievements</h1>
      <p className={styles.subtitle}>Milestones from every round you've played.</p>
      <p className={styles.progress}>
        <strong>{unlockedCount}</strong> of <strong>{achievements.length}</strong> complete
      </p>

      <p className={styles.sectionLabel}>Course achievements</p>
      <AchievementCard achievements={courseAchievements} />

      <p className={styles.sectionLabel}>Career milestones</p>
      <AchievementCard achievements={careerAchievements} />

      <p className={styles.sectionLabel}>Iconic moments</p>
      <AchievementCard achievements={iconicAchievements} />

      <p className={styles.localNote}>
        Achievements are based on your stats. Stats are stored locally on this device, so they
        won't carry over to another device or browser, and will disappear if you clear your
        browsing data or use a private/incognito window.
      </p>
    </div>
  )
}

function AchievementCard({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className={styles.card}>
      <ul className={styles.list}>
        {achievements.map((achievement) => {
          const rowClasses = [styles.row, achievement.isUnlocked && styles.unlocked]
            .filter(Boolean)
            .join(' ')
          return (
            <li key={achievement.id} className={rowClasses}>
              <span className={styles.trophy} aria-hidden>
                🏆
              </span>
              <div className={styles.body}>
                <div className={styles.name}>{achievement.name}</div>
                <p className={styles.desc}>{achievement.description}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
