import { useTheme } from '../../hooks/useTheme'
import { MoonIcon, SunIcon } from '../ui/icons'
import styles from './ThemeToggle.module.css'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={styles.track}
      onClick={toggleTheme}
    >
      <span className={isDark ? `${styles.thumb} ${styles.thumbDark}` : styles.thumb}>
        {isDark ? <MoonIcon className={styles.icon} /> : <SunIcon className={styles.icon} />}
      </span>
    </button>
  )
}
