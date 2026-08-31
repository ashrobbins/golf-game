import { useGame } from '../../state/useGame'
import { useNavDrawer } from '../../state/useNavDrawer'
import { PaintbrushIcon, StatsIcon, TrophyIcon } from '../ui/icons'
import { Drawer } from '../ui/Drawer'
import { ThemeToggle } from './ThemeToggle'
import styles from './MobileNavDrawer.module.css'

// Mobile-only nav menu — Stats/Achievements move in here below 560px
// (see StatsTrigger/AchievementsTrigger's own media queries), and the
// theme toggle moves in here too, at the bottom, below a divider. Opened
// by HamburgerTrigger, rendered once from App.tsx, same "shared chrome"
// pattern as HowToPlayDrawer/RoundDetailDrawer. Shares its open/closed
// state with HowToPlayContext via OverlayProvider, so this and the How to
// Play drawer can never both be open at once.
export function MobileNavDrawer() {
  const { isOpen, close } = useNavDrawer()
  const { viewStats, viewAchievements } = useGame()

  function goToStats() {
    viewStats()
    close()
  }

  function goToAchievements() {
    viewAchievements()
    close()
  }

  return (
    <Drawer isOpen={isOpen} onClose={close} titleId="mobile-nav-heading" title="Menu">
      <nav className={styles.list}>
        <button type="button" className={styles.item} onClick={goToStats}>
          <StatsIcon className={styles.itemIcon} />
          Stats
        </button>
        <button type="button" className={styles.item} onClick={goToAchievements}>
          <TrophyIcon className={styles.itemIcon} />
          Achievements
        </button>
        <div className={styles.divider} />
        <div className={styles.toggleRow}>
          {/* Same icon-and-label layout as the Stats/Achievements buttons
              above (see .item), so "Theme" lines up with them instead of
              needing its own hand-tuned indent. "Theme" rather than "Dark
              mode" — the toggle's own aria-label already says "Switch to
              light/dark mode" dynamically, so a static visible label here
              just needs to name the control, not guess at its current
              state. */}
          <span className={styles.toggleLabelGroup}>
            <PaintbrushIcon className={styles.itemIcon} />
            <span className={styles.toggleLabel}>Theme</span>
          </span>
          <ThemeToggle />
        </div>
      </nav>
    </Drawer>
  )
}
