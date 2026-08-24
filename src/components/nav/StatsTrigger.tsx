import { useGame } from '../../state/useGame'
import { StatsIcon } from '../ui/icons'
import styles from './StatsTrigger.module.css'

// The nav's stats entry point. Unlike HowToPlayTrigger (an icon-only circle
// opening an overlay), this carries its own "Stats" label since it navigates
// to a whole page (GameContext's 'stats' view) rather than a drawer — worth
// being explicit about rather than relying on the icon alone.
export function StatsTrigger() {
  const { viewStats } = useGame()

  return (
    <button type="button" className={styles.trigger} onClick={viewStats}>
      <StatsIcon className={styles.icon} />
      Stats
    </button>
  )
}
