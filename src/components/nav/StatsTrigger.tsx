import { useGame } from '../../state/useGame'
import { StatsIcon } from '../ui/icons'
import styles from './StatsTrigger.module.css'

// The nav's stats entry point. Unlike HowToPlayTrigger (an icon-only circle
// opening an overlay), this carries its own "Stats" label since it navigates
// to a whole page (GameContext's 'stats' view) rather than a drawer — worth
// being explicit about rather than relying on the icon alone. The label
// hides below 560px (see .module.css) so the nav has room for the site
// title to stay on one line on narrow screens; the icon alone still opens
// the same page.
export function StatsTrigger() {
  const { viewStats } = useGame()

  return (
    <button type="button" className={styles.trigger} onClick={viewStats} aria-label="Stats">
      <StatsIcon className={styles.icon} />
      <span className={styles.label}>Stats</span>
    </button>
  )
}
