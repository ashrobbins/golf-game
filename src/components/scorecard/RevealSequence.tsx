import { useMemo } from 'react'
import type { CountriesContent, Golfer, Hole } from '../../content/types'
import { generateHoleCommentary } from '../../game/simulation/commentary'
import { formatTierLabel } from '../../game/simulation/formatTier'
import type { HoleResult } from '../../game/simulation/types'
import { Button } from '../ui/Button'
import { ScorecardGrid } from './ScorecardGrid'
import styles from './RevealSequence.module.css'

interface RevealSequenceProps {
  courseName: string
  holes: Hole[]
  holeResults: HoleResult[]
  countries: CountriesContent
  revealedCount: number
  isComplete: boolean
  onSkip: () => void
}

export function RevealSequence({
  courseName,
  holes,
  holeResults,
  countries,
  revealedCount,
  isComplete,
  onSkip,
}: RevealSequenceProps) {
  const golferIndex = useMemo(() => {
    const map = new Map<string, Golfer>()
    for (const country of countries.countries) {
      for (const golfer of country.golfers) map.set(golfer.id, golfer)
    }
    return map
  }, [countries])

  // Generated once per hole result (not on every re-render) so the flavor
  // text for a given hole stays put once shown.
  const commentaryByHole = useMemo(
    () =>
      holeResults.map((result) => {
        const golfer = golferIndex.get(result.golferId)
        const hole = holes.find((h) => h.number === result.holeNumber)
        if (!golfer || !hole) return ''
        return generateHoleCommentary(golfer, hole, result.outcomeTier, result.archetypeMatched)
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [holeResults],
  )

  const currentHole = holeResults[revealedCount - 1]
  const currentGolfer = currentHole ? golferIndex.get(currentHole.golferId) : undefined

  return (
    <div className={styles.wrapper}>
      <ScorecardGrid holes={holes} holeResults={holeResults} revealedCount={revealedCount} />
      <h2 className={styles.courseName}>{courseName}</h2>
      {!isComplete && (
        <div className={styles.status}>
          <p className={styles.golferLine}>
            {currentHole && currentGolfer
              ? `Hole ${currentHole.holeNumber} · ${currentGolfer.name} · ${formatTierLabel(currentHole.outcomeTier)}`
              : 'Simulating…'}
          </p>
          {currentHole && (
            <p className={styles.commentary}>{commentaryByHole[revealedCount - 1]}</p>
          )}
          <Button variant="secondary" onClick={onSkip}>
            Skip
          </Button>
        </div>
      )}
    </div>
  )
}
