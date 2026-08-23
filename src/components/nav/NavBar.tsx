import { useGame } from '../../state/useGame'
import { ThemeToggle } from './ThemeToggle'
import styles from './NavBar.module.css'

export function NavBar() {
  const { playAgain } = useGame()

  return (
    <header className={styles.bar}>
      <button type="button" className={styles.logo} onClick={playAgain}>
        <span className={styles.logoMark}>⛳</span>
        Beating Bogey
      </button>
      <ThemeToggle />
    </header>
  )
}
