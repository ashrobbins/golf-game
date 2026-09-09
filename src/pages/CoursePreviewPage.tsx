import { useMemo, useState } from 'react'
import { AchievementChecklist } from '../components/course/AchievementChecklist'
import { CourseHoleTable } from '../components/course/CourseHoleTable'
import { CountryFlag } from '../components/picker/CountryFlag'
import { SeasonRoundBanner } from '../components/season/SeasonRoundBanner'
import { Button } from '../components/ui/Button'
import { deriveAchievements, deriveCourseAchievementChecklist } from '../game/achievements/deriveAchievements'
import { loadStats } from '../game/stats/storage'
import { useGame } from '../state/useGame'
import styles from './CoursePreviewPage.module.css'

export function CoursePreviewPage() {
  const { content, course, beginDraft, seasonRoundContext, statsOverride } = useGame()
  const [stats] = useState(() => loadStats())
  const rounds = statsOverride ?? stats.rounds

  const checklistAchievements = useMemo(() => {
    if (content.status !== 'ready' || !course) return []
    const achievements = deriveAchievements(rounds, content.courses.courses, content.countries)
    return deriveCourseAchievementChecklist(achievements, rounds, content.countries, {
      courseId: course.id,
      countryIsoCode: course.countryIsoCode,
      isSeasonRound: Boolean(seasonRoundContext),
      isMajor: Boolean(seasonRoundContext?.isMajor),
    })
  }, [content, course, rounds, seasonRoundContext])

  if (!course) return null

  return (
    <div className={styles.wrapper}>
      {seasonRoundContext && <SeasonRoundBanner context={seasonRoundContext} />}
      <h1 className={styles.title}>
        {course.countryIsoCode && (
          <CountryFlag isoCode={course.countryIsoCode} className={styles.titleFlag} ariaHidden />
        )}
        {course.name}
      </h1>
      {course.location && <p className={styles.subtitle}>{course.location}</p>}
      <p className={styles.par}>Par {course.par} · {course.holes.length} holes</p>

      <div className={styles.cta}>
        <Button onClick={() => beginDraft(false)}>Build My Bag</Button>
        <Button variant="secondary" onClick={() => beginDraft(true)}>
          Auto-Pick
        </Button>
      </div>

      <AchievementChecklist achievements={checklistAchievements} courseName={course.name} />

      <CourseHoleTable holes={course.holes} />

      <div className={styles.cta}>
        <Button onClick={() => beginDraft(false)}>Build My Bag</Button>
        <Button variant="secondary" onClick={() => beginDraft(true)}>
          Auto-Pick
        </Button>
      </div>
    </div>
  )
}
