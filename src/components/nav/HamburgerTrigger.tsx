import { CloseIcon, HamburgerIcon } from '../ui/icons'
import { useNavDrawer } from '../../state/useNavDrawer'
import { useSettingsDrawer } from '../../state/useSettingsDrawer'
import { useHowToPlay } from '../../state/useHowToPlay'
import styles from './HamburgerTrigger.module.css'

// Mobile-only entry point into the nav drawer (Stats/Achievements/theme).
// Visually the same circular trigger style as HowToPlayTrigger (which sits
// immediately to its left) — defined self-contained here rather than
// importing HowToPlayDrawer.module.css's .trigger class and trying to
// override just its display rule from a second file, which would leave
// the visibility toggle at the mercy of cross-module CSS cascade order.
// Hidden above the 560px breakpoint, where Stats/Achievements/theme toggle
// already show inline instead.
//
// Doubles as the drawer's close control while it's open (swapping to a
// cross icon) — MobileNavDrawer hides its own header close button
// (hideClose) so this is the only affordance, rather than two ways to
// close the same menu.
export function HamburgerTrigger() {
  const { isOpen: navOpen, open, close } = useNavDrawer()
  const { openedFromNav: settingsOpenedFromNav } = useSettingsDrawer()
  const { openedFromNav: helpOpenedFromNav } = useHowToPlay()

  // Drilling into "How to play" or "Settings" from the nav drawer swaps the
  // overlay's `active.kind` away from 'nav', so useNavDrawer().isOpen alone
  // goes false even though the mobile menu is still visually open one level
  // deep. Track those nav-originated states too so the trigger keeps
  // showing (and acting as) a close button for the whole time the menu
  // system is open, not just at its top level.
  const isMenuOpen = navOpen || settingsOpenedFromNav || helpOpenedFromNav

  return (
    <button
      type="button"
      className={styles.trigger}
      aria-label={isMenuOpen ? 'Close menu' : 'Menu'}
      aria-expanded={isMenuOpen}
      onClick={isMenuOpen ? close : open}
    >
      {isMenuOpen ? <CloseIcon className={styles.icon} /> : <HamburgerIcon className={styles.icon} />}
    </button>
  )
}
