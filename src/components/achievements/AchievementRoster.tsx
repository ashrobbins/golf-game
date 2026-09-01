import type { AchievementRosterEntry } from '../../game/achievements/deriveAchievements'
import styles from './AchievementRoster.module.css'

// Renders an achievement's named checklist as a comma-separated line of
// names, bolding and colouring green whichever ones have already achieved
// their part — a reusable building block for any achievement that needs
// the same thing from several different people (e.g. The Grand Slam).
export function AchievementRoster({ roster }: { roster: AchievementRosterEntry[] }) {
  return (
    <p className={styles.roster}>
      {roster.map((entry, index) => (
        <span key={entry.name}>
          <span className={entry.achieved ? styles.achieved : undefined}>{entry.name}</span>
          {index < roster.length - 1 && ', '}
        </span>
      ))}
    </p>
  )
}
