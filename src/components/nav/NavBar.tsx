import { useGame } from '../../state/useGame'
import { AchievementsTrigger } from './AchievementsTrigger'
import { HamburgerTrigger } from './HamburgerTrigger'
import { HowToPlayTrigger } from './HowToPlayTrigger'
import { SettingsTrigger } from './SettingsTrigger'
import { StatsTrigger } from './StatsTrigger'
import styles from './NavBar.module.css'

export function NavBar() {
  const { playAgain } = useGame()

  return (
    <header className={styles.bar}>
      <button type="button" className={styles.logo} onClick={playAgain}>
        <span className={styles.logoMark}>⛳</span>
        Beating Bogey
      </button>
      <div className={styles.right}>
        <StatsTrigger />
        <AchievementsTrigger />
        <HowToPlayTrigger />
        <SettingsTrigger />
        <HamburgerTrigger />
      </div>
    </header>
  )
}
