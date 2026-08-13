import { CourseCard } from '../components/home/CourseCard'
import { useGame } from '../state/useGame'
import styles from './HomePage.module.css'

export function HomePage() {
  const { content, startRound } = useGame()

  if (content.status === 'loading') return <p>Loading content…</p>
  if (content.status === 'error') return <p>Failed to load content: {content.error}</p>

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Beating Bogey</h1>
      <p className={styles.subtitle}>Pick a course to start your round.</p>
      <div className={styles.grid}>
        {content.courses.courses.map((course) => (
          <CourseCard
            key={course.id}
            courseId={course.id}
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
