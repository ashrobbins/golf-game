import { useDraftAnimation } from '../../hooks/useDraftAnimation'
import { useSettingsDrawer } from '../../state/useSettingsDrawer'
import { AnimationIcon, PaintbrushIcon } from '../ui/icons'
import { Drawer } from '../ui/Drawer'
import { ThemeToggle } from './ThemeToggle'
import styles from './SettingsDrawer.module.css'

// Rendered once (from App.tsx), reading open/closed state from
// SettingsContext so both the desktop cog trigger and the mobile
// hamburger menu's "Settings" row control this one shared instance —
// same pattern as HowToPlayDrawer.
export function SettingsDrawer() {
  const { isOpen, close, openedFromNav, backToNav } = useSettingsDrawer()
  const { enabled: animationEnabled, setEnabled: setAnimationEnabled } = useDraftAnimation()

  return (
    <Drawer
      isOpen={isOpen}
      onClose={close}
      titleId="settings-heading"
      title="Settings"
      onBack={openedFromNav ? backToNav : undefined}
      backLabel="Menu"
      hideClose
    >
      <p className={styles.groupLabel}>Settings</p>
      <div className={styles.toggleRow}>
        <span className={styles.toggleLabelGroup}>
          <PaintbrushIcon className={styles.toggleIcon} />
          <span className={styles.toggleLabel}>Theme</span>
        </span>
        <ThemeToggle />
      </div>
      <div className={styles.toggleRow}>
        <span className={styles.toggleLabelGroup}>
          <AnimationIcon className={styles.toggleIcon} />
          <span className={styles.toggleTextGroup}>
            <span className={styles.toggleLabel}>Spinner animations</span>
            <span className={styles.toggleHint}>Spins instantly when off</span>
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={animationEnabled}
          aria-label={animationEnabled ? 'Turn off spinner animations' : 'Turn on spinner animations'}
          className={animationEnabled ? `${styles.switchTrack} ${styles.switchTrackOn}` : styles.switchTrack}
          onClick={() => setAnimationEnabled(!animationEnabled)}
        >
          <span className={animationEnabled ? `${styles.switchThumb} ${styles.switchThumbOn}` : styles.switchThumb} />
        </button>
      </div>
    </Drawer>
  )
}
