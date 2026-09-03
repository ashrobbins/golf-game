import { useGame } from '../../state/useGame'
import { useHowToPlay } from '../../state/useHowToPlay'
import { useNavDrawer } from '../../state/useNavDrawer'
import { useSettingsDrawer } from '../../state/useSettingsDrawer'
import { HelpCircleIcon, SettingsIcon, StatsIcon, TrophyIcon } from '../ui/icons'
import { Drawer } from '../ui/Drawer'
import styles from './MobileNavDrawer.module.css'

// Mobile-only nav menu — Stats/Achievements move in here below 560px (see
// StatsTrigger/AchievementsTrigger's own media queries), and "How to play"
// and "Settings" live here too, handing off to their own existing drawers
// (with a "← Menu" back link back to this one) rather than duplicating
// their content — see HowToPlayDrawer.tsx/SettingsDrawer.tsx. Opened by
// HamburgerTrigger, rendered once from App.tsx, same "shared chrome"
// pattern as those drawers. Shares its open/closed state with
// HowToPlayContext/SettingsContext via OverlayProvider, so only one of
// this, Help, and Settings can ever be open at once.
export function MobileNavDrawer() {
  const { isOpen, close } = useNavDrawer()
  const { viewStats, viewAchievements } = useGame()
  const { openFromNav: openHelpFromNav } = useHowToPlay()
  const { openFromNav: openSettingsFromNav } = useSettingsDrawer()

  function goToStats() {
    viewStats()
    close()
  }

  function goToAchievements() {
    viewAchievements()
    close()
  }

  return (
    <Drawer isOpen={isOpen} onClose={close} titleId="mobile-nav-heading" title="Menu" hideClose>
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
        <button type="button" className={styles.item} onClick={openHelpFromNav}>
          <HelpCircleIcon className={styles.itemIcon} />
          How to play
        </button>
        <button type="button" className={styles.item} onClick={openSettingsFromNav}>
          <SettingsIcon className={styles.itemIcon} />
          Settings
        </button>
      </nav>
    </Drawer>
  )
}
