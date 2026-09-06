import { useEffect, useMemo, useState } from 'react'
import { RevealSequence } from '../components/scorecard/RevealSequence'
import { Scorecard } from '../components/scorecard/Scorecard'
import { ReviewSeasonButton } from '../components/season/ReviewSeasonButton'
import { SeasonReviewStory } from '../components/season/SeasonReviewStory'
import { SeasonRoundBanner } from '../components/season/SeasonRoundBanner'
import { ShareModal } from '../components/share/ShareModal'
import { Button } from '../components/ui/Button'
import { ShareIcon } from '../components/ui/icons'
import { deriveSeasonReview } from '../game/season/deriveSeasonReview'
import { loadStats } from '../game/stats/storage'
import { useHoleRevealSequencer } from '../hooks/useHoleRevealSequencer'
import { useGame } from '../state/useGame'

export function ResultsPage() {
  const {
    content,
    course,
    simulationResult,
    playAgain,
    newlyUnlockedAchievements,
    viewAchievements,
    seasonRoundContext,
    continueSeason,
    activeSeason,
    seasonArchive,
  } = useGame()
  const { revealedCount, isComplete, skipToEnd } = useHoleRevealSequencer(
    simulationResult?.holeResults ?? [],
  )
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [rounds] = useState(() => loadStats().rounds)

  // The ?simResults debug shortcut should land straight on the finished
  // scorecard, not replay the hole-by-hole reveal.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('simResults')) {
      skipToEnd()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A season round's results page shows "Finish Season"/"Review Season"
  // only once the season it belongs to has actually completed — finishDraft
  // (GameProvider.tsx) sets activeSeason to null synchronously the moment
  // that happens, while seasonRoundContext itself stays populated until
  // continueSeason clears it, so this only ever holds true on the season's
  // true final round.
  const isLastSeasonRound = Boolean(seasonRoundContext) && activeSeason === null

  const review = useMemo(() => {
    if (!isLastSeasonRound || !seasonRoundContext || content.status !== 'ready') return null
    const season = seasonArchive.find((s) => s.id === seasonRoundContext.seasonId)
    if (!season) return null
    return deriveSeasonReview(season, seasonArchive, rounds, content.courses.courses, content.countries)
  }, [isLastSeasonRound, seasonRoundContext, seasonArchive, rounds, content])

  if (content.status !== 'ready' || !course || !simulationResult) return null

  const primaryCta = seasonRoundContext ? (
    <Button onClick={continueSeason}>{isLastSeasonRound ? 'Finish Season' : 'Continue Season'}</Button>
  ) : (
    <Button onClick={playAgain}>Play again</Button>
  )

  const reviewCta = isLastSeasonRound && review && (
    <ReviewSeasonButton variant="button" onClick={() => setIsReviewOpen(true)} />
  )

  return (
    <div>
      {isComplete ? (
        <>
          {seasonRoundContext && <SeasonRoundBanner context={seasonRoundContext} />}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            {primaryCta}
            <Button variant="secondary" onClick={() => setIsShareOpen(true)}>
              <ShareIcon style={{ width: 16, height: 16 }} />
              Share
            </Button>
            {reviewCta}
          </div>
          <Scorecard
            course={course}
            countries={content.countries}
            result={simulationResult}
            newlyUnlockedAchievements={newlyUnlockedAchievements}
            onViewAchievements={viewAchievements}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 24 }}>
            {primaryCta}
            <Button variant="secondary" onClick={() => setIsShareOpen(true)}>
              <ShareIcon style={{ width: 16, height: 16 }} />
              Share
            </Button>
            {reviewCta}
          </div>
          <ShareModal
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
            course={course}
            countries={content.countries}
            result={simulationResult}
            newlyUnlockedAchievements={newlyUnlockedAchievements}
          />
        </>
      ) : (
        <RevealSequence
          courseName={course.name}
          countryIsoCode={course.countryIsoCode}
          holes={course.holes}
          holeResults={simulationResult.holeResults}
          countries={content.countries}
          revealedCount={revealedCount}
          onSkip={skipToEnd}
          seasonRoundContext={seasonRoundContext}
        />
      )}
      {isReviewOpen && review && <SeasonReviewStory review={review} onClose={() => setIsReviewOpen(false)} />}
    </div>
  )
}
