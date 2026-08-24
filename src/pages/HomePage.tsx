import { CourseCard } from '../components/home/CourseCard'
import { Button } from '../components/ui/Button'
import { useGame } from '../state/useGame'
import { useHowToPlay } from '../state/useHowToPlay'
import styles from './HomePage.module.css'

export function HomePage() {
  const { content, startRound } = useGame()
  const { open } = useHowToPlay()

  if (content.status === 'loading') return <p>Loading content…</p>
  if (content.status === 'error') return <p>Failed to load content: {content.error}</p>

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Beating Bogey</h1>
      <p className={styles.subtitle}>Pick a course to start your round.</p>
      <Button variant="secondary" className={styles.howItWorks} onClick={open}>
        <span className={styles.howItWorksIcon} aria-hidden>
          ?
        </span>
        How it works
      </Button>
      <div className={styles.grid}>
        {content.courses.courses.map((course) => (
          <CourseCard
            key={course.id}
            name={course.name}
            location={course.location}
            par={course.par}
            onClick={() => startRound(course.id)}
          />
        ))}
      </div>
    </div>
  )
}
