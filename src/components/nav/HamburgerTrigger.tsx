import { HamburgerIcon } from '../ui/icons'
import { useNavDrawer } from '../../state/useNavDrawer'
import styles from './HamburgerTrigger.module.css'

// Mobile-only entry point into the nav drawer (Stats/Achievements/theme).
// Visually the same circular trigger style as HowToPlayTrigger (which sits
// immediately to its left) — defined self-contained here rather than
// importing HowToPlayDrawer.module.css's .trigger class and trying to
// override just its display rule from a second file, which would leave
// the visibility toggle at the mercy of cross-module CSS cascade order.
// Hidden above the 560px breakpoint, where Stats/Achievements/theme toggle
// already show inline instead.
export function HamburgerTrigger() {
  const { open } = useNavDrawer()

  return (
    <button type="button" className={styles.trigger} aria-label="Menu" onClick={open}>
      <HamburgerIcon className={styles.icon} />
    </button>
  )
}
