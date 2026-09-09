import { ModeCard } from '../components/home/ModeCard'
import { LogoMark } from '../components/nav/LogoMark'
import { Button } from '../components/ui/Button'
import { useGame } from '../state/useGame'
import { useHowToPlay } from '../state/useHowToPlay'
import styles from './HomePage.module.css'

export function HomePage() {
  const { content, activeSeason, seasonArchive, goFreePlay, viewSeasons } = useGame()
  const { open } = useHowToPlay()

  let seasonProgressLabel: string | undefined
  let seasonProgressValue: string | undefined

  if (activeSeason && content.status === 'ready') {
    const nextEntry = activeSeason.schedule[activeSeason.results.length]
    const courseName = content.courses.courses.find((c) => c.id === nextEntry?.courseId)?.name
    if (nextEntry && courseName) {
      seasonProgressLabel = 'Up next'
      seasonProgressValue = `Round ${nextEntry.roundNumber} · ${courseName}`
    }
  } else if (!activeSeason && seasonArchive.length > 0) {
    seasonProgressValue = 'Season complete'
  }

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
          progressLabel={seasonProgressLabel}
          progressValue={seasonProgressValue}
          tone="gold"
          onClick={viewSeasons}
        />
      </div>
    </div>
  )
}
