import { useEffect } from 'react'
import { RevealSequence } from '../components/scorecard/RevealSequence'
import { Scorecard } from '../components/scorecard/Scorecard'
import { Button } from '../components/ui/Button'
import { useHoleRevealSequencer } from '../hooks/useHoleRevealSequencer'
import { useGame } from '../state/useGame'

export function ResultsPage() {
  const { content, course, simulationResult, playAgain } = useGame()
  const { revealedCount, isComplete, skipToEnd } = useHoleRevealSequencer(
    simulationResult?.holeResults ?? [],
  )

  // The ?simResults debug shortcut should land straight on the finished
  // scorecard, not replay the hole-by-hole reveal.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('simResults')) {
      skipToEnd()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (content.status !== 'ready' || !course || !simulationResult) return null

  return (
    <div>
      {isComplete ? (
        <>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Button variant="secondary" onClick={playAgain}>
              Play again
            </Button>
          </div>
          <Scorecard course={course} countries={content.countries} result={simulationResult} />
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button onClick={playAgain}>Play again</Button>
          </div>
        </>
      ) : (
        <RevealSequence
          courseName={course.name}
          holes={course.holes}
          holeResults={simulationResult.holeResults}
          countries={content.countries}
          revealedCount={revealedCount}
          onSkip={skipToEnd}
        />
      )}
    </div>
  )
}
