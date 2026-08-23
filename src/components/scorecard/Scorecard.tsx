import { useMemo } from 'react'
import type { CountriesContent, Country, Course, Golfer } from '../../content/types'
import { generateHoleCommentary } from '../../game/simulation/commentary'
import type { SimulationResult } from '../../game/simulation/types'
import { Confetti } from './Confetti'
import { HoleResultRow } from './HoleResultRow'
import { RoundHero } from './RoundHero'
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
      <RoundHero courseName={course.name} holes={course.holes} holeResults={result.holeResults} />
      <ScorecardGrid holes={course.holes} holeResults={result.holeResults} />

      <ul className={styles.list}>
        {result.holeResults.map((hole, i) => {
          const golfer = golferIndex.get(hole.golferId)
          const country = countryIndex.get(hole.countryId)
          const holeInfo = holeIndex.get(hole.holeNumber)
          if (!golfer || !holeInfo) return null

          return (
            <HoleResultRow
              key={hole.holeNumber}
              holeNumber={hole.holeNumber}
              isoCode={country?.isoCode}
              golferName={golfer.name}
              commentary={commentaryByHole[i]}
              gross={holeInfo.par + hole.relativeScore}
              tier={hole.outcomeTier}
              isLegend={golfer.skill === 'legend'}
            />
          )
        })}
      </ul>
    </div>
  )
}
