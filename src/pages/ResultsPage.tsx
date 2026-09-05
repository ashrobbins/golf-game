import { useEffect, useState } from 'react'
import { RevealSequence } from '../components/scorecard/RevealSequence'
import { Scorecard } from '../components/scorecard/Scorecard'
import { SeasonRoundBanner } from '../components/season/SeasonRoundBanner'
import { ShareModal } from '../components/share/ShareModal'
import { Button } from '../components/ui/Button'
import { ShareIcon } from '../components/ui/icons'
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
  } = useGame()
  const { revealedCount, isComplete, skipToEnd } = useHoleRevealSequencer(
    simulationResult?.holeResults ?? [],
  )
  const [isShareOpen, setIsShareOpen] = useState(false)

  // The ?simResults debug shortcut should land straight on the finished
  // scorecard, not replay the hole-by-hole reveal.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('simResults')) {
      skipToEnd()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (content.status !== 'ready' || !course || !simulationResult) return null

  const primaryCta = seasonRoundContext ? (
    <Button onClick={continueSeason}>Continue Season</Button>
  ) : (
    <Button onClick={playAgain}>Play again</Button>
  )

  return (
    <div>
      {isComplete ? (
        <>
          {seasonRoundContext && <SeasonRoundBanner context={seasonRoundContext} />}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            {primaryCta}
            <Button variant="secondary" onClick={() => setIsShareOpen(true)}>
              <ShareIcon style={{ width: 16, height: 16 }} />
              Share
            </Button>
          </div>
          <Scorecard
            course={course}
            countries={content.countries}
            result={simulationResult}
            newlyUnlockedAchievements={newlyUnlockedAchievements}
            onViewAchievements={viewAchievements}
          />
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
            {primaryCta}
            <Button variant="secondary" onClick={() => setIsShareOpen(true)}>
              <ShareIcon style={{ width: 16, height: 16 }} />
              Share
            </Button>
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
    </div>
  )
}
