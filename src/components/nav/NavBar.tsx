import { useGame } from '../../state/useGame'
import { AchievementsTrigger } from './AchievementsTrigger'
import { HamburgerTrigger } from './HamburgerTrigger'
import { HowToPlayTrigger } from './HowToPlayTrigger'
import { LogoMark } from './LogoMark'
import { SettingsTrigger } from './SettingsTrigger'
import { StatsTrigger } from './StatsTrigger'
import styles from './NavBar.module.css'

export function NavBar() {
  const { playAgain } = useGame()

  return (
    <header className={styles.bar}>
      <button type="button" className={styles.logo} onClick={playAgain}>
        <LogoMark className={styles.logoImage} />
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
