import { CourseCard } from '../components/home/CourseCard'
import { useGame } from '../state/useGame'
import styles from './FreePlayPage.module.css'

export function FreePlayPage() {
  const { content, startRound } = useGame()

  if (content.status === 'loading') return <p>Loading content…</p>
  if (content.status === 'error') return <p>Failed to load content: {content.error}</p>

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Free Play</h1>
      <p className={styles.subtitle}>Pick a course to start your round.</p>
      <div className={styles.grid}>
        {content.courses.courses.map((course) => (
          <CourseCard
            key={course.id}
            name={course.name}
            location={course.location}
            par={course.par}
            countryIsoCode={course.countryIsoCode}
            onClick={() => startRound(course.id)}
          />
        ))}
      </div>
    </div>
  )
}
