import { useMemo } from 'react'
import type { CountriesContent, Course, Golfer } from '../../content/types'
import { generateHoleCommentary } from '../../game/simulation/commentary'
import {
  formatBogeyFreeHeadline,
  formatRelativeScore,
  formatTierLabel,
  tierColorVar,
} from '../../game/simulation/formatTier'
import type { SimulationResult } from '../../game/simulation/types'
import { Confetti } from './Confetti'
import { ScorecardGrid } from './ScorecardGrid'
import styles from './Scorecard.module.css'

interface ScorecardProps {
  course: Course
  countries: CountriesContent
  result: SimulationResult
}

export function Scorecard({ course, countries, result }: ScorecardProps) {
  const golferIndex = useMemo(() => {
    const map = new Map<string, Golfer>()
    for (const country of countries.countries) {
      for (const golfer of country.golfers) map.set(golfer.id, golfer)
    }
    return map
  }, [countries])

  const commentaryByHole = useMemo(
    () =>
      result.holeResults.map((hole) => {
        const golfer = golferIndex.get(hole.golferId)
        const holeInfo = course.holes.find((h) => h.number === hole.holeNumber)
        if (!golfer || !holeInfo) return ''
        return generateHoleCommentary(golfer, holeInfo, hole.outcomeTier, hole.archetypeMatched)
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [result.holeResults],
  )

  return (
    <div className={styles.wrapper}>
      {result.isBogeyFreeRound && <Confetti />}
      <h2 className={styles.title}>{course.name}</h2>
      <p className={result.isBogeyFreeRound ? styles.headlineCelebratory : styles.headline}>
        {result.isBogeyFreeRound && <span className={styles.trophy}>🏆</span>}
        {formatBogeyFreeHeadline(result.bogeyFreeThroughHole, result.isBogeyFreeRound, course.holes.length)}
      </p>
      <p className={styles.total}>Total: {formatRelativeScore(result.totalStrokesToPar)}</p>

      <ScorecardGrid holes={course.holes} holeResults={result.holeResults} />

      <ul className={styles.list}>
        {result.holeResults.map((hole, i) => (
          <li key={hole.holeNumber} className={styles.row}>
            <div className={styles.rowHeader}>
              <span className={styles.holeNumber}>{hole.holeNumber}</span>
              <span className={styles.golferName}>
                {golferIndex.get(hole.golferId)?.name ?? hole.golferId}
              </span>
              <span className={styles.tier} style={{ color: tierColorVar(hole.outcomeTier) }}>
                {formatTierLabel(hole.outcomeTier)}
              </span>
            </div>
            <p className={styles.commentary}>{commentaryByHole[i]}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
