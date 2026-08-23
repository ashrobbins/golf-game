import { useMemo } from 'react'
import type { CountriesContent, Country, Course, Golfer } from '../../content/types'
import { generateHoleCommentary } from '../../game/simulation/commentary'
import { formatBogeyFreeHeadline, formatRelativeScore } from '../../game/simulation/formatTier'
import type { SimulationResult } from '../../game/simulation/types'
import { CountryFlag } from '../picker/CountryFlag'
import { Confetti } from './Confetti'
import { ScoreMark } from './ScoreMark'
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

  const countryIndex = useMemo(() => {
    const map = new Map<string, Country>()
    for (const country of countries.countries) map.set(country.id, country)
    return map
  }, [countries])

  const holeIndex = new Map(course.holes.map((hole) => [hole.number, hole]))

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
        {result.holeResults.map((hole, i) => {
          const country = countryIndex.get(hole.countryId)
          const holeInfo = holeIndex.get(hole.holeNumber)
          const gross = holeInfo ? holeInfo.par + hole.relativeScore : undefined
          const isLegend = golferIndex.get(hole.golferId)?.skill === 'legend'

          return (
            <li key={hole.holeNumber} className={isLegend ? `${styles.row} ${styles.legendRow}` : styles.row}>
              <div className={styles.rowHeader}>
                <span className={styles.holeNumber}>{hole.holeNumber}</span>
                {country && <CountryFlag isoCode={country.isoCode} className={styles.flag} ariaHidden />}
                <span className={styles.golferName}>
                  {golferIndex.get(hole.golferId)?.name ?? hole.golferId}
                </span>
              </div>
              <p className={styles.commentary}>{commentaryByHole[i]}</p>
              <span className={styles.tierMark}>
                {gross !== undefined && <ScoreMark gross={gross} tier={hole.outcomeTier} />}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
