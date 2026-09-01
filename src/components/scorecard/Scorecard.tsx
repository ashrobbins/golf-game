import { useMemo } from 'react'
import type { CountriesContent, Country, Course, Golfer } from '../../content/types'
import type { Achievement } from '../../game/achievements/deriveAchievements'
import { generateHoleCommentary } from '../../game/simulation/commentary'
import type { SimulationResult } from '../../game/simulation/types'
import { NewAchievementCard } from '../achievements/NewAchievementCard'
import { Confetti } from './Confetti'
import { HoleResultRow } from './HoleResultRow'
import { ResultsHero } from './ResultsHero'
import { ScorecardGrid } from './ScorecardGrid'
import styles from './Scorecard.module.css'

interface ScorecardProps {
  course: Course
  countries: CountriesContent
  result: SimulationResult
  // Only ever set when this Scorecard is the live result of a round just
  // played (see ResultsPage.tsx) — omitted when reused to display a past
  // round from Stats or a shared /round/[code] link, so the "new
  // achievement" card never appears outside the moment it actually happened.
  newlyUnlockedAchievements?: Achievement[]
  onViewAchievements?: () => void
}

export function Scorecard({
  course,
  countries,
  result,
  newlyUnlockedAchievements,
  onViewAchievements,
}: ScorecardProps) {
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
      <ResultsHero
        courseName={course.name}
        countryIsoCode={course.countryIsoCode}
        holes={course.holes}
        holeResults={result.holeResults}
        totalStrokesToPar={result.totalStrokesToPar}
        bogeyFreeThroughHole={result.bogeyFreeThroughHole}
        isBogeyFreeRound={result.isBogeyFreeRound}
      />
      {newlyUnlockedAchievements && newlyUnlockedAchievements.length > 0 && onViewAchievements && (
        <NewAchievementCard achievements={newlyUnlockedAchievements} onViewAchievements={onViewAchievements} />
      )}
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
