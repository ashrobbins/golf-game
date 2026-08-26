import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { PlayerLeaderboard } from '../components/stats/PlayerLeaderboard'
import { CountryFlag } from '../components/picker/CountryFlag'
import { Button } from '../components/ui/Button'
import { deriveStats, deriveStatsForCourse, rankGolfers } from '../game/stats/deriveStats'
import type { DerivedStats } from '../game/stats/deriveStats'
import type { RoundRecord } from '../game/stats/types'
import { loadStats } from '../game/stats/storage'
import { formatRelativeScore } from '../game/simulation/formatTier'
import { useGame } from '../state/useGame'
import { useRoundDetail } from '../state/useRoundDetail'
import styles from './StatsPage.module.css'

export function StatsPage() {
  const { content, playAgain, statsOverride } = useGame()
  const { open: openRound } = useRoundDetail()
  const [stats] = useState(() => loadStats())
  const rounds = statsOverride ?? stats.rounds

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
          <div className={styles.cta}>
            <Button variant="secondary" onClick={playAgain}>
              Play a round
            </Button>
          </div>

          <section className={`${styles.card} ${styles.careerCard}`}>
            <p className={styles.careerEyebrow}>Career</p>
            <StatsGrid stats={career} large onOpenRound={openRound} />
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>By course</h2>
            <ul className={styles.courseList}>
              {courseIds.map((courseId) => {
                const courseStats = deriveStatsForCourse(rounds, courseId)
                const isoCode = courseIsoCode(courseId)
                return (
                  <li key={courseId} className={styles.courseBlock}>
                    <div className={styles.courseHeader}>
                      {isoCode && (
                        <CountryFlag isoCode={isoCode} className={styles.courseFlag} ariaHidden />
                      )}
                      <span className={styles.courseName}>{courseName(courseId)}</span>
                    </div>
                    <CourseStatsGrid stats={courseStats} onOpenRound={openRound} />
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
              {history.map((round) => {
                const rowClasses = [styles.historyRow, round.isBogeyFreeRound && styles.bogeyFree]
                  .filter(Boolean)
                  .join(' ')
                return (
                  <li key={round.id} className={styles.historyItem}>
                    <button type="button" className={rowClasses} onClick={() => openRound(round)}>
                      <span className={styles.historyCourseCell}>
                        <span className={styles.historyCourse}>{courseName(round.courseId)}</span>
                        {round.isBogeyFreeRound && (
                          <span className={styles.historyBadge}>Bogey-free</span>
                        )}
                      </span>
                      <span className={styles.historyDate}>
                        {new Date(round.playedAt).toLocaleDateString()}
                      </span>
                      <span className={styles.historyScore}>
                        {formatRelativeScore(round.totalStrokesToPar)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <p className={styles.localNote}>
            All stats are stored locally on this device — they won't carry over to another
            device or browser, and will disappear if you clear your browsing data or use a
            private/incognito window.
          </p>
        </>
      )}
    </div>
  )
}

// The "Best round" stat's value, in both the career and per-course grids —
// a button rather than plain text so it doubles as a shortcut straight to
// that round's detail in the same drawer round-history rows open.
function BestRoundValue({
  round,
  onOpenRound,
}: {
  round: RoundRecord | null
  onOpenRound: (round: RoundRecord) => void
}) {
  if (!round) return null
  return (
    <button type="button" className={styles.bestRoundButton} onClick={() => onOpenRound(round)}>
      {formatRelativeScore(round.totalStrokesToPar)}
    </button>
  )
}

interface StatsGridProps {
  stats: DerivedStats
  large?: boolean
  onOpenRound: (round: RoundRecord) => void
}

function StatsGrid({ stats, large, onOpenRound }: StatsGridProps) {
  const gridClasses = [styles.grid, large && styles.careerGrid].filter(Boolean).join(' ')
  return (
    <dl className={gridClasses}>
      <StatItem label="Rounds played" value={stats.roundsPlayed} large={large} />
      <StatItem label="Bogey-free rounds" value={stats.bogeyFreeRounds} large={large} />
      <StatItem
        label="Best round"
        value={<BestRoundValue round={stats.bestRound} onOpenRound={onOpenRound} />}
        large={large}
      />
      <StatItem label="Total birdies" value={stats.totalBirdieCount} large={large} />
      <StatItem label="Total eagles" value={stats.totalEagleCount} large={large} />
      <StatItem label="Hole-in-ones" value={stats.holeInOnes} large={large} />
    </dl>
  )
}

function StatItem({ label, value, large }: { label: string; value: ReactNode; large?: boolean }) {
  return (
    <div className={styles.statItem}>
      <dt className={large ? styles.careerStatLabel : styles.statLabel}>{label}</dt>
      <dd className={large ? styles.careerStatValue : styles.statValue}>{value ?? '—'}</dd>
    </div>
  )
}

interface CourseStatsGridProps {
  stats: DerivedStats
  onOpenRound: (round: RoundRecord) => void
}

function CourseStatsGrid({ stats, onOpenRound }: CourseStatsGridProps) {
  return (
    <dl className={styles.courseGrid}>
      <CourseStatItem label="Rounds" value={stats.roundsPlayed} />
      <CourseStatItem label="Bogey-free" value={stats.bogeyFreeRounds} />
      <CourseStatItem
        label="Best round"
        value={<BestRoundValue round={stats.bestRound} onOpenRound={onOpenRound} />}
      />
      <CourseStatItem label="Birdies" value={stats.totalBirdieCount} />
      <CourseStatItem label="Eagles" value={stats.totalEagleCount} />
      <CourseStatItem label="Aces" value={stats.holeInOnes} />
    </dl>
  )
}

function CourseStatItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={styles.courseStatItem}>
      <dt className={styles.courseStatLabel}>{label}</dt>
      <dd className={styles.courseStatValue}>{value ?? '—'}</dd>
    </div>
  )
}
