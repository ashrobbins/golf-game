import { useMemo, useState } from 'react'
import type { CountriesContent, Course } from '../content/types'
import { CountryFlag } from '../components/picker/CountryFlag'
import { ReviewSeasonButton } from '../components/season/ReviewSeasonButton'
import { SeasonReviewStory } from '../components/season/SeasonReviewStory'
import { Button } from '../components/ui/Button'
import { ChevronLeftIcon } from '../components/ui/icons'
import { deriveSeasonReview } from '../game/season/deriveSeasonReview'
import { deriveSeasonStats } from '../game/season/deriveSeasonStats'
import type { ActiveSeason, CompletedSeason } from '../game/season/types'
import { loadStats } from '../game/stats/storage'
import type { RoundRecord } from '../game/stats/types'
import { useGame } from '../state/useGame'
import { useRoundDetail } from '../state/useRoundDetail'
import { useSeasonLeaderboard } from '../state/useSeasonLeaderboard'
import styles from './SeasonHistoryPage.module.css'

function formatToPar(score: number) {
  if (score === 0) return 'E'
  return score > 0 ? `+${score}` : `${score}`
}

function SeasonCard({
  season,
  rounds,
  countries,
  courseIndex,
  isActive,
  onResume,
  onOpenRound,
  onReview,
}: {
  season: ActiveSeason | CompletedSeason
  rounds: RoundRecord[]
  countries: CountriesContent
  courseIndex: Map<string, Course>
  isActive: boolean
  onResume?: () => void
  onOpenRound: (record: RoundRecord) => void
  onReview?: (season: ActiveSeason | CompletedSeason) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const stats = deriveSeasonStats(season.id, rounds, countries)
  const totalScore = season.results.reduce((sum, r) => sum + r.totalStrokesToPar, 0)
  const { open: openLeaderboard } = useSeasonLeaderboard()

  function toggle() {
    setIsExpanded((open) => !open)
  }

  return (
    // The whole card toggles the accordion on click — nested controls
    // (Resume, each round row) stop propagation in their own handlers so
    // clicking them doesn't also fire this. role="button" here is a
    // pragmatic accessibility trade-off given the nested real buttons, so
    // keyboard users get Enter/Space support on the card itself too.
    <div
      className={styles.card}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggle()
        }
      }}
    >
      <div className={styles.cardTop}>
        <span className={styles.cardTopLeft}>
          <span className={styles.name}>Season {season.seasonNumber}</span>
          <span className={isActive ? `${styles.status} ${styles.statusActive}` : `${styles.status} ${styles.statusComplete}`}>
            {isActive ? 'In progress' : 'Complete'}
          </span>
        </span>
        <span className={isExpanded ? `${styles.chevron} ${styles.chevronOpen}` : styles.chevron} aria-hidden>
          ▾
        </span>
      </div>
      <div className={styles.row}>
        <div>
          <div className={totalScore < 0 ? `${styles.score} ${styles.scoreGood}` : totalScore > 0 ? `${styles.score} ${styles.scoreBad}` : styles.score}>
            {formatToPar(totalScore)}
          </div>
          <div className={styles.meta}>
            {season.results.length} of {season.schedule.length} rounds
          </div>
        </div>
        <div className={styles.metaStats}>
          {stats.topPerformer ? (
            <button
              type="button"
              className={styles.tapButton}
              onClick={(e) => {
                e.stopPropagation()
                openLeaderboard(season.id, season.seasonNumber)
              }}
            >
              <span className={styles.tapLabel}>Top performer</span>
              <span className={styles.tapNameRow}>
                {stats.topPerformer.name}
                <span aria-hidden>›</span>
              </span>
            </button>
          ) : (
            <div className={styles.metaStat}>
              Top performer <span className={styles.metaStatValue}>—</span>
            </div>
          )}
          <div className={styles.metaStat}>
            <span className={styles.metaStatValue}>{stats.bogeyFreeRounds}</span> bogey-free round
            {stats.bogeyFreeRounds === 1 ? '' : 's'}
          </div>
          {onReview && !isActive && (
            <ReviewSeasonButton
              variant="chip"
              onClick={(e) => {
                e.stopPropagation()
                onReview(season)
              }}
            />
          )}
        </div>
      </div>
      {isActive && onResume && (
        <button
          type="button"
          className={styles.crumbLink}
          onClick={(e) => {
            e.stopPropagation()
            onResume()
          }}
        >
          ← Resume Season {season.seasonNumber}
        </button>
      )}
      {isExpanded && (
        <ul className={styles.roundList}>
          {season.schedule.map((entry) => {
            const result = season.results.find((r) => r.roundNumber === entry.roundNumber)
            const course = courseIndex.get(entry.courseId)
            const record = result ? rounds.find((r) => r.id === result.roundRecordId) : undefined

            return (
              <li key={entry.roundNumber}>
                <button
                  type="button"
                  className={styles.roundRow}
                  disabled={!record}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (record) onOpenRound(record)
                  }}
                >
                  <span className={styles.roundNum}>{entry.roundNumber}</span>
                  <span className={styles.roundCourse}>
                    {course?.countryIsoCode && <CountryFlag isoCode={course.countryIsoCode} ariaHidden />}
                    {course?.name ?? entry.courseId}
                    {entry.isMajor && <span className={styles.majorTag}>Major</span>}
                  </span>
                  {result ? (
                    <span className={result.totalStrokesToPar > 0 ? styles.scoreOver : styles.scoreUnder}>
                      {formatToPar(result.totalStrokesToPar)}
                    </span>
                  ) : (
                    <span className={styles.meta}>—</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function SeasonHistoryPage() {
  const { content, activeSeason, seasonArchive, viewSeasons } = useGame()
  const [rounds] = useState(() => loadStats().rounds)
  const { open: openRound } = useRoundDetail()
  const [reviewSeason, setReviewSeason] = useState<CompletedSeason | null>(null)

  const review = useMemo(() => {
    if (!reviewSeason || content.status !== 'ready') return null
    return deriveSeasonReview(reviewSeason, seasonArchive, rounds, content.courses.courses, content.countries)
  }, [reviewSeason, seasonArchive, rounds, content])

  if (content.status !== 'ready') return null

  const hasAnySeason = activeSeason || seasonArchive.length > 0
  const courseIndex = new Map(content.courses.courses.map((c) => [c.id, c]))

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Seasons</h1>
      <p className={styles.subtitle}>Every season you've played, past and present.</p>
      <Button variant="secondary" className={styles.backCta} onClick={viewSeasons}>
        <ChevronLeftIcon style={{ width: 16, height: 16 }} />
        Back to Season Hub
      </Button>

      {!hasAnySeason ? (
        <p className={styles.empty}>No seasons played yet.</p>
      ) : (
        <div className={styles.list}>
          {activeSeason && (
            <SeasonCard
              season={activeSeason}
              rounds={rounds}
              countries={content.countries}
              courseIndex={courseIndex}
              isActive
              onResume={viewSeasons}
              onOpenRound={openRound}
            />
          )}
          {[...seasonArchive].reverse().map((season) => (
            <SeasonCard
              key={season.id}
              season={season}
              rounds={rounds}
              countries={content.countries}
              courseIndex={courseIndex}
              isActive={false}
              onOpenRound={openRound}
              onReview={(s) => setReviewSeason(s as CompletedSeason)}
            />
          ))}
        </div>
      )}
      {review && <SeasonReviewStory review={review} onClose={() => setReviewSeason(null)} />}
    </div>
  )
}
