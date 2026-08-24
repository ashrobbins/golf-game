import { useHowToPlay } from '../../state/useHowToPlay'
import styles from './HowToPlayDrawer.module.css'

// The nav's "?" circle icon — one of two entry points into the rules
// drawer (the other is the home page's "How it works" button). Both just
// call the shared HowToPlayContext's open(); the drawer itself only ever
// exists once, rendered from App.tsx.
export function HowToPlayTrigger() {
  const { open } = useHowToPlay()

  return (
    <button type="button" className={styles.trigger} aria-label="How to play" onClick={open}>
      ?
    </button>
  )
}
