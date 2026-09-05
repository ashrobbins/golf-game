import { useState } from 'react'
import { CountryFlag } from '../components/picker/CountryFlag'
import { Button } from '../components/ui/Button'
import { deriveSeasonStats } from '../game/season/deriveSeasonStats'
import { loadStats } from '../game/stats/storage'
import { useGame } from '../state/useGame'
import styles from './SeasonHubPage.module.css'

function formatToPar(score: number) {
  if (score === 0) return 'E'
  return score > 0 ? `+${score}` : `${score}`
}

export function SeasonHubPage() {
  const { content, activeSeason, seasonArchive, startSeason, startSeasonRound, viewSeasonHistory } = useGame()
  const [rounds] = useState(() => loadStats().rounds)

  if (content.status !== 'ready') return null
  const courseIndex = new Map(content.courses.courses.map((c) => [c.id, c]))

  if (!activeSeason) {
    const isFirstSeason = seasonArchive.length === 0
    const bestSeason = seasonArchive.reduce<{ seasonNumber: number; score: number } | null>((best, season) => {
      const score = season.results.reduce((sum, r) => sum + r.totalStrokesToPar, 0)
      if (!best || score < best.score) return { seasonNumber: season.seasonNumber, score }
      return best
    }, null)

    return (
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Seasons</h1>
        <p className={styles.subtitle}>16 rounds, 16 courses, one running score to par.</p>
        <div className={styles.startCard}>
          <div className={styles.startIcon} aria-hidden>
            {isFirstSeason ? '🏆' : '🔄'}
          </div>
          <p className={styles.startTitle}>Start Season {seasonArchive.length + 1}</p>
          {isFirstSeason ? (
            <>
              <p className={styles.startDesc}>
                Draft a fresh bag for every round and carry your score to par across all 16. Every 4th
                round is a major — go bogey-free to win it.
              </p>
              <div className={styles.startFeatures}>
                <div className={styles.startFeature}>
                  ⛳ <span><b>16 rounds</b> across 16 different courses</span>
                </div>
                <div className={styles.startFeature}>
                  🎴 <span><b>Fresh draft</b> every single round</span>
                </div>
                <div className={styles.startFeature}>
                  🏅 <span><b>4 majors</b> — Augusta, Pebble Beach, Royal Birkdale, Pinehurst</span>
                </div>
                <div className={styles.startFeature}>
                  💾 <span><b>Auto-saved</b> — pick it back up any time</span>
                </div>
              </div>
            </>
          ) : (
            <p className={styles.startDesc}>
              Your last season is complete. Start a new one whenever you're ready — your past seasons
              stay on record.
            </p>
          )}
          <Button onClick={startSeason}>Start Season {seasonArchive.length + 1}</Button>
        </div>

        {!isFirstSeason && (
          <div className={styles.recapCard}>
            <p className={styles.recapLabel}>Your seasons so far</p>
            <div className={styles.recapRow}>
              <span className={styles.recapStat}>
                Seasons played <b>{seasonArchive.length}</b>
              </span>
              {bestSeason && (
                <span className={styles.recapStat}>
                  Best score <b className={styles.recapGood}>{formatToPar(bestSeason.score)}</b> · Season{' '}
                  {bestSeason.seasonNumber}
                </span>
              )}
            </div>
            <button type="button" className={styles.crumbLink} onClick={viewSeasonHistory}>
              View full history →
            </button>
          </div>
        )}
      </div>
    )
  }

  const stats = deriveSeasonStats(activeSeason.id, rounds, content.countries)
  const totalScore = activeSeason.results.reduce((sum, r) => sum + r.totalStrokesToPar, 0)
  const currentRoundNumber = activeSeason.results.length + 1
  const nextCourse = courseIndex.get(activeSeason.schedule[currentRoundNumber - 1].courseId)

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Season {activeSeason.seasonNumber}</h1>
      <p className={styles.subtitle}>
        Round {currentRoundNumber} of {activeSeason.schedule.length}
        {nextCourse && ` · Next up: ${nextCourse.name}`}
      </p>
      <button type="button" className={styles.crumbLink} onClick={viewSeasonHistory}>
        View season history →
      </button>

      <div className={styles.scoreCard}>
        <div>
          <p className={styles.scoreCardLabel}>Score to par</p>
          <p className={styles.scoreCardValue}>{formatToPar(totalScore)}</p>
        </div>
        <div className={styles.metaStats}>
          <div className={styles.metaStat}>
            Top performer{' '}
            <span className={styles.metaStatValue}>{stats.topPerformer?.name ?? '—'}</span>
          </div>
          <div className={styles.metaStat}>
            <span className={styles.metaStatValue}>{stats.bogeyFreeRounds}</span> bogey-free round
            {stats.bogeyFreeRounds === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      <div className={styles.roundDots}>
        {activeSeason.schedule.map((entry) => {
          const done = entry.roundNumber <= activeSeason.results.length
          const isCurrent = entry.roundNumber === currentRoundNumber
          const classes = [styles.roundDot]
          if (done) classes.push(styles.dotDone)
          if (entry.isMajor) classes.push(styles.dotMajor)
          if (isCurrent) classes.push(styles.dotCurrent)
          return <span key={entry.roundNumber} className={classes.join(' ')} />
        })}
      </div>

      <ul className={styles.ladder}>
        {activeSeason.schedule.map((entry) => {
          const result = activeSeason.results.find((r) => r.roundNumber === entry.roundNumber)
          const course = courseIndex.get(entry.courseId)
          const isCurrent = entry.roundNumber === currentRoundNumber
          const isLocked = entry.roundNumber > currentRoundNumber

          const rowClasses = [styles.roundRow]
          if (entry.isMajor) rowClasses.push(styles.rowMajor)
          if (isCurrent) rowClasses.push(styles.rowCurrent)
          if (isLocked) rowClasses.push(styles.rowLocked)

          return (
            <li key={entry.roundNumber} className={rowClasses.join(' ')}>
              <span className={styles.roundNum}>{entry.roundNumber}</span>
              <div className={styles.roundBody}>
                <div className={styles.roundCourse}>
                  {course?.countryIsoCode && <CountryFlag isoCode={course.countryIsoCode} ariaHidden />}
                  {course?.name ?? entry.courseId}
                  {entry.isMajor && <span className={styles.majorTag}>Major</span>}
                </div>
                {course && <div className={styles.roundMeta}>Par {course.par}</div>}
              </div>
              {result ? (
                <span className={result.totalStrokesToPar > 0 ? styles.scoreOver : styles.scoreUnder}>
                  {formatToPar(result.totalStrokesToPar)}
                </span>
              ) : isCurrent ? (
                <button type="button" className={styles.playCta} onClick={startSeasonRound}>
                  Play
                </button>
              ) : (
                <span className={styles.roundMeta}>—</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
