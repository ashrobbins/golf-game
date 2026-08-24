import { useMemo, useState } from 'react'
import { PlayerLeaderboard } from '../components/stats/PlayerLeaderboard'
import { CountryFlag } from '../components/picker/CountryFlag'
import { Button } from '../components/ui/Button'
import { deriveStats, deriveStatsForCourse, rankGolfers } from '../game/stats/deriveStats'
import type { DerivedStats } from '../game/stats/deriveStats'
import { loadStats } from '../game/stats/storage'
import { formatRelativeScore } from '../game/simulation/formatTier'
import { useGame } from '../state/useGame'
import styles from './StatsPage.module.css'

function pluralize(count: number, word: string): string {
  return count === 1 ? word : `${word}s`
}

export function StatsPage() {
  const { content, playAgain } = useGame()
  const [stats] = useState(() => loadStats())
  const rounds = stats.rounds

  const career = useMemo(() => deriveStats(rounds), [rounds])
  const courseIds = useMemo(() => Array.from(new Set(rounds.map((r) => r.courseId))), [rounds])
  const ranking = useMemo(() => rankGolfers(rounds), [rounds])
  const history = useMemo(() => [...rounds].reverse(), [rounds])

  if (content.status !== 'ready') return null

  function courseName(courseId: string): string {
    if (content.status !== 'ready') return courseId
    return content.courses.courses.find((c) => c.id === courseId)?.name ?? courseId
  }

  function courseIsoCode(courseId: string): string | undefined {
    if (content.status !== 'ready') return undefined
    return content.courses.courses.find((c) => c.id === courseId)?.countryIsoCode
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Your stats</h1>

      {rounds.length === 0 ? (
        <>
          <p className={styles.subtitle}>Play a round to start building your stats.</p>
          <div className={styles.cta}>
            <Button onClick={playAgain}>Let's Go</Button>
          </div>
        </>
      ) : (
        <>
          <section className={`${styles.card} ${styles.careerCard}`}>
            <p className={styles.careerEyebrow}>Career</p>
            <StatsGrid stats={career} large />
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>By course</h2>
            <ul className={styles.courseList}>
              {courseIds.map((courseId) => {
                const courseStats = deriveStatsForCourse(rounds, courseId)
                const isoCode = courseIsoCode(courseId)
                return (
                  <li key={courseId} className={styles.courseRow}>
                    {isoCode && (
                      <CountryFlag isoCode={isoCode} className={styles.courseFlag} ariaHidden />
                    )}
                    <span className={styles.courseName}>{courseName(courseId)}</span>
                    <span className={styles.courseStats}>
                      <b>{courseStats.roundsPlayed}</b> {pluralize(courseStats.roundsPlayed, 'round')} ·{' '}
                      <b>{courseStats.bogeyFreeRounds}</b> bogey-free ·{' '}
                      <b>{courseStats.lowestBogeyCount}</b> fewest bogeys ·{' '}
                      <b>{courseStats.highestBirdieCount}</b>{' '}
                      {pluralize(courseStats.highestBirdieCount ?? 0, 'birdie')} ·{' '}
                      <b>{courseStats.highestEagleCount}</b>{' '}
                      {pluralize(courseStats.highestEagleCount ?? 0, 'eagle')} ·{' '}
                      <b>{courseStats.holeInOnes}</b> {pluralize(courseStats.holeInOnes, 'ace')}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Top players</h2>
            <PlayerLeaderboard ranking={ranking} countries={content.countries} />
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Round history</h2>
            <ul className={styles.history}>
              {history.map((round) => (
                <li key={round.id} className={styles.historyRow}>
                  <span className={styles.historyCourse}>{courseName(round.courseId)}</span>
                  <span className={styles.historyDate}>
                    {new Date(round.playedAt).toLocaleDateString()}
                  </span>
                  <span className={styles.historyScore}>
                    {formatRelativeScore(round.totalStrokesToPar)}
                  </span>
                  {round.isBogeyFreeRound && (
                    <span className={styles.historyBadge}>Bogey-free</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}

function StatsGrid({ stats, large }: { stats: DerivedStats; large?: boolean }) {
  const gridClasses = [styles.grid, large && styles.careerGrid].filter(Boolean).join(' ')
  return (
    <dl className={gridClasses}>
      <StatItem label="Rounds played" value={stats.roundsPlayed} large={large} />
      <StatItem label="Bogey-free rounds" value={stats.bogeyFreeRounds} large={large} />
      <StatItem label="Lowest bogeys" value={stats.lowestBogeyCount} large={large} />
      <StatItem label="Most birdies" value={stats.highestBirdieCount} large={large} />
      <StatItem label="Most eagles" value={stats.highestEagleCount} large={large} />
      <StatItem label="Hole-in-ones" value={stats.holeInOnes} large={large} />
    </dl>
  )
}

function StatItem({ label, value, large }: { label: string; value: number | null; large?: boolean }) {
  return (
    <div className={styles.statItem}>
      <dt className={large ? styles.careerStatLabel : styles.statLabel}>{label}</dt>
      <dd className={large ? styles.careerStatValue : styles.statValue}>{value ?? '—'}</dd>
    </div>
  )
}
