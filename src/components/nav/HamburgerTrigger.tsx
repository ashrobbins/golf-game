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
  const { isOpen: settingsOpen } = useSettingsDrawer()
  const { isOpen: helpOpen } = useHowToPlay()

  // OverlayProvider only ever has one of these open at a time (they share
  // one slide-in panel slot), and however it was opened — the nav drawer
  // itself, drilling into Settings/How to play from the nav, or a direct
  // trigger elsewhere entirely (HomePage's "How it works" button, the
  // desktop cog) — the mobile hamburger is still the one control that can
  // dismiss it. So it tracks all three and doubles as a close button
  // whenever any of them is open, not just the nav drawer.
  const isMenuOpen = navOpen || settingsOpen || helpOpen

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
