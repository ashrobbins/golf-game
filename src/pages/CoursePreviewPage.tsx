import { CourseHoleTable } from '../components/course/CourseHoleTable'
import { CountryFlag } from '../components/picker/CountryFlag'
import { Button } from '../components/ui/Button'
import { useGame } from '../state/useGame'
import styles from './CoursePreviewPage.module.css'

export function CoursePreviewPage() {
  const { course, beginDraft } = useGame()

  if (!course) return null

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>
        {course.countryIsoCode && (
          <CountryFlag isoCode={course.countryIsoCode} className={styles.titleFlag} ariaHidden />
        )}
        {course.name}
      </h1>
      {course.location && <p className={styles.subtitle}>{course.location}</p>}
      <p className={styles.par}>Par {course.par} · {course.holes.length} holes</p>

      <div className={styles.cta}>
        <Button onClick={beginDraft}>Let's Go</Button>
      </div>

      <CourseHoleTable holes={course.holes} />

      <div className={styles.cta}>
        <Button onClick={beginDraft}>Let's Go</Button>
      </div>
    </div>
  )
}
