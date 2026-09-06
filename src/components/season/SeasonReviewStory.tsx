import { useEffect, useRef, useState } from 'react'
import type { SeasonReview, SeasonReviewNation, SeasonReviewRound } from '../../game/season/deriveSeasonReview'
import { CountryFlag } from '../picker/CountryFlag'
import { Confetti } from '../scorecard/Confetti'
import { StackedScorecard } from '../share/StackedScorecard'
import { CloseIcon } from '../ui/icons'
import styles from './SeasonReviewStory.module.css'

const TOTAL_SLIDES = 4
const SLIDE_DURATION_MS = 6000
const HOLD_THRESHOLD_MS = 180

interface SeasonReviewStoryProps {
  review: SeasonReview
  onClose: () => void
}

function formatToPar(score: number) {
  if (score === 0) return 'E'
  return score > 0 ? `+${score}` : `${score}`
}

function formatPoints(points: number) {
  return points > 0 ? `+${points}` : String(points)
}

const COURSE_SCORE_CLASS: Record<SeasonReviewRound['outcome'], string> = {
  under: styles.courseScoreUnder,
  even: styles.courseScoreEven,
  over: styles.courseScoreOver,
}

// 16 rounds -> two columns of 8 (9 doesn't divide 16 evenly — 8 is the
// closest even split, same reasoning as StackedScorecard's front-9/back-9
// split for holes).
function buildCourseColumns(rounds: SeasonReviewRound[]) {
  const half = rounds.length / 2
  return [rounds.slice(0, half), rounds.slice(half)]
}

// Reorders 1st/2nd/3rd into the podium's visual left-to-right layout
// (2nd, 1st, 3rd) and skips any place that doesn't exist (fewer than 3
// nations played this season).
function buildPodiumSlots(topNations: SeasonReviewNation[]) {
  const [first, second, third] = topNations
  const slots: Array<{ nation: SeasonReviewNation; place: string; className: string }> = []
  if (second) slots.push({ nation: second, place: '2nd', className: styles.silver })
  if (first) slots.push({ nation: first, place: '1st', className: styles.gold })
  if (third) slots.push({ nation: third, place: '3rd', className: styles.bronze })
  return slots
}

// A full-screen, Instagram-Stories-style recap shown after a season's final
// round (and re-openable any time from a completed Seasons History card) —
// deliberately its own dark, edge-to-edge visual language, not the app's
// normal light/dark surface theme (mirrors the approved mockup exactly).
//
// The slide-advance timer is driven by refs, not React state, so a running
// requestAnimationFrame loop never causes a 60fps re-render — only
// `current`/`isPaused` (which affect what's visually rendered) are React
// state. All mutable data the timer/pointer logic needs (accumulated
// progress, pause flag, current slide index) lives in refs so the
// mount-only effect that wires up keyboard/body-scroll handling never goes
// stale, matching the fixed lifecycle Drawer.tsx uses for the same reason.
export function SeasonReviewStory({ review, onClose }: SeasonReviewStoryProps) {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const currentRef = useRef(0)
  const isPausedRef = useRef(false)
  const rafIdRef = useRef<number | null>(null)
  const progressStartRef = useRef(0)
  const accumulatedMsRef = useRef(0)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdTriggeredRef = useRef(false)
  const fillRefs = useRef<Array<HTMLDivElement | null>>([])
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  function startProgress(index: number) {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    progressStartRef.current = performance.now()
    const fillEl = fillRefs.current[index]
    function tick(now: number) {
      const elapsed = accumulatedMsRef.current + (now - progressStartRef.current)
      const pct = Math.min(100, (elapsed / SLIDE_DURATION_MS) * 100)
      if (fillEl) fillEl.style.width = `${pct}%`
      if (pct >= 100) {
        activateSlide(index + 1)
      } else {
        rafIdRef.current = requestAnimationFrame(tick)
      }
    }
    rafIdRef.current = requestAnimationFrame(tick)
  }

  function activateSlide(rawIndex: number) {
    const index = Math.max(0, rawIndex)
    if (index >= TOTAL_SLIDES) {
      onCloseRef.current()
      return
    }
    currentRef.current = index
    setCurrent(index)
    accumulatedMsRef.current = 0
    isPausedRef.current = false
    setIsPaused(false)
    startProgress(index)
  }

  function pauseProgress() {
    if (isPausedRef.current) return
    isPausedRef.current = true
    setIsPaused(true)
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    accumulatedMsRef.current += performance.now() - progressStartRef.current
  }

  function resumeProgress() {
    if (!isPausedRef.current) return
    isPausedRef.current = false
    setIsPaused(false)
    startProgress(currentRef.current)
  }

  function togglePause() {
    if (isPausedRef.current) resumeProgress()
    else pauseProgress()
  }

  function nextSlide() {
    activateSlide(currentRef.current + 1)
  }

  function prevSlide() {
    activateSlide(currentRef.current - 1)
  }

  // Press-and-hold on either half of the slide pauses (Instagram-Stories
  // style); a quick tap under the hold threshold navigates instead. The
  // header pause/play button covers the same thing more discoverably.
  function handleZonePointerDown() {
    holdTriggeredRef.current = false
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    holdTimerRef.current = setTimeout(() => {
      holdTriggeredRef.current = true
      pauseProgress()
    }, HOLD_THRESHOLD_MS)
  }

  function handleZonePointerUp(direction: 'prev' | 'next') {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    if (holdTriggeredRef.current) {
      resumeProgress()
      holdTriggeredRef.current = false
      return
    }
    if (direction === 'prev') prevSlide()
    else nextSlide()
  }

  function handleZonePointerLeave() {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    if (holdTriggeredRef.current) {
      resumeProgress()
      holdTriggeredRef.current = false
    }
  }

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    activateSlide(0)

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current()
      if (e.key === 'ArrowRight') nextSlide()
      if (e.key === 'ArrowLeft') prevSlide()
      if (e.key === ' ') {
        e.preventDefault()
        togglePause()
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
      previouslyFocusedRef.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const previousDiff =
    review.previousSeason !== null ? review.totalStrokesToPar - review.previousSeason.totalStrokesToPar : null

  return (
    <div className={isPaused ? `${styles.overlay} ${styles.paused}` : styles.overlay} role="dialog" aria-modal="true" aria-label="Season Review">
      <div className={styles.stage}>
        <div className={styles.progressRow}>
          {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
            <div key={i} className={styles.segment}>
              <div
                ref={(el) => {
                  fillRefs.current[i] = el
                }}
                className={i < current ? `${styles.fill} ${styles.fillDone}` : styles.fill}
              />
            </div>
          ))}
        </div>

        <div className={styles.header}>
          <div className={styles.brand}>
            <span aria-hidden>🚩</span> Season {review.seasonNumber} Review
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.iconButton} onClick={togglePause} aria-label={isPaused ? 'Play' : 'Pause'}>
              {isPaused ? '▶' : '⏸'}
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              className={styles.iconButton}
              onClick={() => onCloseRef.current()}
              aria-label="Close"
            >
              <CloseIcon style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>

        <button type="button" className={`${styles.navArrow} ${styles.navArrowLeft}`} onClick={prevSlide} aria-label="Previous">
          ‹
        </button>
        <button type="button" className={`${styles.navArrow} ${styles.navArrowRight}`} onClick={nextSlide} aria-label="Next">
          ›
        </button>

        <div className={styles.tapZones}>
          <div
            className={styles.zone}
            onPointerDown={handleZonePointerDown}
            onPointerUp={() => handleZonePointerUp('prev')}
            onPointerLeave={handleZonePointerLeave}
            onPointerCancel={handleZonePointerLeave}
          />
          <div
            className={styles.zone}
            onPointerDown={handleZonePointerDown}
            onPointerUp={() => handleZonePointerUp('next')}
            onPointerLeave={handleZonePointerLeave}
            onPointerCancel={handleZonePointerLeave}
          />
        </div>

        {/* Slide 1: Cover */}
        <div className={current === 0 ? `${styles.slide} ${styles.slide1} ${styles.active}` : styles.slide}>
          <div className={styles.bgLayer} />
          <div className={styles.content}>
            <p className={styles.eyebrow}>
              Season {review.seasonNumber} · Complete
            </p>
            <div className={`${styles.bigNumber} ${styles.medium}`}>{formatToPar(review.totalStrokesToPar)}</div>
            <p className={styles.bestEverCaption}>
              Best season ever: {formatToPar(review.bestSeasonEver.totalStrokesToPar)} in Season{' '}
              {review.bestSeasonEver.seasonNumber}
            </p>
            <p className={styles.slideTitle}>to par across all {review.rounds.length} rounds</p>
            <div className={styles.courseTable}>
              {buildCourseColumns(review.rounds).map((column, colIndex) => (
                <div key={colIndex} className={styles.courseCol}>
                  {column.map((r) => (
                    <div
                      key={r.roundNumber}
                      className={r.isMajor ? `${styles.courseRow} ${styles.isMajor}` : styles.courseRow}
                    >
                      <span className={styles.courseRoundNum}>{r.roundNumber}</span>
                      <span className={styles.courseName}>{r.courseName}</span>
                      <span className={`${styles.courseScore} ${COURSE_SCORE_CLASS[r.outcome]}`}>
                        {formatToPar(r.totalStrokesToPar)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {!review.isBestSeasonEver && previousDiff !== null && review.previousSeason && (
              <p className={styles.slideSub}>
                {previousDiff < 0
                  ? `Your best season yet — ${Math.abs(previousDiff)} strokes better than Season ${review.previousSeason.seasonNumber}.`
                  : previousDiff > 0
                    ? `${previousDiff} strokes behind Season ${review.previousSeason.seasonNumber} — back for revenge?`
                    : `Tied with Season ${review.previousSeason.seasonNumber} — a rematch.`}
              </p>
            )}
          </div>
        </div>

        {/* Slide 2: Bogey-free */}
        <div className={current === 1 ? `${styles.slide} ${styles.slide2} ${styles.active}` : styles.slide}>
          <div className={styles.bgLayer} />
          {review.isBogeyFreeRecord && review.bogeyFreeRounds > 0 && <Confetti />}
          <div className={styles.content}>
            <p className={styles.eyebrow}>Bogey-Free Rounds</p>
            <div className={`${styles.bigNumber} ${styles.gold}`}>{review.bogeyFreeRounds}</div>
            <p className={styles.slideTitle}>
              round{review.bogeyFreeRounds === 1 ? '' : 's'} without a single bogey
            </p>
            {review.isBogeyFreeRecord && <div className={styles.recordRibbon}>🏅 New personal record</div>}
            {review.priorBestBogeyFreeRounds > 0 && (
              <p className={styles.slideSub}>
                {review.isBogeyFreeRecord
                  ? `Your previous best was ${review.priorBestBogeyFreeRounds}. You beat it by ${
                      review.bogeyFreeRounds - review.priorBestBogeyFreeRounds
                    }.`
                  : `Your best remains ${review.priorBestBogeyFreeRounds} bogey-free rounds in a season.`}
              </p>
            )}
          </div>
        </div>

        {/* Slide 3: Best round */}
        <div className={current === 2 ? `${styles.slide} ${styles.slide3} ${styles.active}` : styles.slide}>
          <div className={styles.bgLayer} />
          <div className={styles.content}>
            <p className={styles.eyebrow}>Best Round of the Season</p>
            {review.bestRound ? (
              <>
                <div className={styles.courseTag}>
                  {review.bestRound.countryIsoCode && (
                    <CountryFlag isoCode={review.bestRound.countryIsoCode} ariaHidden />
                  )}
                  {review.bestRound.courseName}
                  {review.bestRound.isMajor && <span className={styles.majorPill}>Major</span>}
                </div>
                <div className={`${styles.bigNumber} ${styles.small}`}>
                  {formatToPar(review.bestRound.totalStrokesToPar)}
                </div>
                <div className={styles.scorecardWrap}>
                  <StackedScorecard holes={review.bestRound.holes} holeResults={review.bestRound.holeResults} />
                </div>
                <p className={styles.slideSub}>Round {review.bestRound.roundNumber}</p>
              </>
            ) : (
              <p className={styles.slideSub}>No rounds recorded this season.</p>
            )}
          </div>
        </div>

        {/* Slide 4: Top performers */}
        <div className={current === 3 ? `${styles.slide} ${styles.slide4} ${styles.active}` : styles.slide}>
          <div className={styles.bgLayer} />
          <div className={styles.content}>
            <div className={styles.performerSection}>
              <p className={styles.performerHeading}>Top Players</p>
              {review.topPlayers.map((player, i) => (
                <div key={player.golferId} className={styles.playerRow}>
                  <span className={styles.rank}>{i + 1}</span>
                  {player.isoCode && <CountryFlag isoCode={player.isoCode} ariaHidden />}
                  <span className={styles.playerName}>{player.name}</span>
                  <span className={styles.playerPoints}>{formatPoints(player.points)}</span>
                </div>
              ))}
            </div>
            {review.topNations.length > 0 && (
              <div className={styles.performerSection}>
                <p className={styles.performerHeading}>Top Nations</p>
                <div className={styles.podium}>
                  {buildPodiumSlots(review.topNations).map(({ nation, place, className }) => (
                    <div key={nation.countryId} className={`${styles.podiumSlot} ${className}`}>
                      <div className={styles.podiumFlag}>
                        <CountryFlag isoCode={nation.isoCode} ariaHidden />
                      </div>
                      <div className={styles.podiumBar}>{place}</div>
                      <div className={styles.podiumName}>{nation.name}</div>
                      <div className={styles.podiumPoints}>{formatPoints(nation.points)} pts</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
