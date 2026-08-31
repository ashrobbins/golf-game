import { useGame } from '../../state/useGame'
import { TrophyIcon } from '../ui/icons'
import styles from './AchievementsTrigger.module.css'

// The nav's achievements entry point — same pattern as StatsTrigger
// (a labeled pill, since it navigates to a whole page rather than opening
// an overlay). Hidden entirely below 560px, where it moves into the
// mobile nav drawer instead (see MobileNavDrawer.tsx) rather than
// shrinking to an icon-only button the way StatsTrigger used to.
export function AchievementsTrigger() {
  const { viewAchievements } = useGame()

  return (
    <button type="button" className={styles.trigger} onClick={viewAchievements} aria-label="Achievements">
      <TrophyIcon className={styles.icon} />
      <span className={styles.label}>Achievements</span>
    </button>
  )
}
