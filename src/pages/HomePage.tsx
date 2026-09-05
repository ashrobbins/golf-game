import { ModeCard } from '../components/home/ModeCard'
import { LogoMark } from '../components/nav/LogoMark'
import { Button } from '../components/ui/Button'
import { useGame } from '../state/useGame'
import { useHowToPlay } from '../state/useHowToPlay'
import styles from './HomePage.module.css'

function formatToPar(score: number) {
  if (score === 0) return 'E'
  return score > 0 ? `+${score}` : `${score}`
}

export function HomePage() {
  const { activeSeason, goFreePlay, viewSeasons } = useGame()
  const { open } = useHowToPlay()

  const seasonProgress = activeSeason
    ? (() => {
        const roundNumber = activeSeason.results.length + 1
        const total = activeSeason.results.reduce((sum, r) => sum + r.totalStrokesToPar, 0)
        return `Round ${roundNumber} of ${activeSeason.schedule.length} · ${formatToPar(total)}`
      })()
    : undefined

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>
        <LogoMark className={styles.titleMark} />
        Beating Bogey
      </h1>
      <p className={styles.subtitle}>Draft a bag, play a round, or chase a full season.</p>
      <Button variant="secondary" className={styles.howItWorks} onClick={open}>
        <span className={styles.howItWorksIcon} aria-hidden>
          ?
        </span>
        How it works
      </Button>
      <div className={styles.grid}>
        <ModeCard
          icon="⛳"
          title="Free Play"
          description="Pick any course and play a single round — no commitment, jump straight in."
          onClick={goFreePlay}
        />
        <ModeCard
          icon="🏆"
          title="Seasons"
          description="16 rounds, 16 courses, one running score to par. Every 4th round is a major."
          progress={seasonProgress}
          tone="gold"
          onClick={viewSeasons}
        />
      </div>
    </div>
  )
}
