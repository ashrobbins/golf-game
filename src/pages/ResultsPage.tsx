import { RevealSequence } from '../components/scorecard/RevealSequence'
import { Scorecard } from '../components/scorecard/Scorecard'
import { ShareCard } from '../components/share/ShareCard'
import { Button } from '../components/ui/Button'
import { useHoleRevealSequencer } from '../hooks/useHoleRevealSequencer'
import { useGame } from '../state/useGame'

export function ResultsPage() {
  const { content, course, simulationResult, playAgain } = useGame()
  const { revealedCount, isComplete, skipToEnd } = useHoleRevealSequencer(
    simulationResult?.holeResults ?? [],
  )

  if (content.status !== 'ready' || !course || !simulationResult) return null

  return (
    <div>
      {isComplete ? (
        <>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Button onClick={playAgain}>Play again</Button>
          </div>
          <Scorecard course={course} countries={content.countries} result={simulationResult} />
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <ShareCard course={course} result={simulationResult} />
          </div>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button onClick={playAgain}>Play again</Button>
          </div>
        </>
      ) : (
        <RevealSequence
          holes={course.holes}
          holeResults={simulationResult.holeResults}
          countries={content.countries}
          revealedCount={revealedCount}
          isComplete={isComplete}
          onSkip={skipToEnd}
        />
      )}
    </div>
  )
}
