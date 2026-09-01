import { useSettingsDrawer } from '../../state/useSettingsDrawer'
import { SettingsIcon } from '../ui/icons'
import styles from './SettingsTrigger.module.css'

// Desktop-only entry point into the Settings drawer — same circular trigger
// style as HowToPlayTrigger, sitting right after it in the nav. Hidden
// below 560px, where Settings is reached via the mobile hamburger menu's
// own "Settings" row instead (see MobileNavDrawer.tsx).
export function SettingsTrigger() {
  const { open } = useSettingsDrawer()

  return (
    <button type="button" className={styles.trigger} aria-label="Settings" onClick={open}>
      <SettingsIcon className={styles.icon} />
    </button>
  )
}
