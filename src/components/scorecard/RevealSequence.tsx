import { useMemo } from 'react'
import type { CountriesContent, Country, Golfer, Hole } from '../../content/types'
import { generateHoleCommentary } from '../../game/simulation/commentary'
import type { HoleResult } from '../../game/simulation/types'
import type { SeasonRoundContext } from '../../state/GameContext'
import { SeasonRoundBanner } from '../season/SeasonRoundBanner'
import { Button } from '../ui/Button'
import { CurrentHoleCard } from './CurrentHoleCard'
import { HoleResultRow } from './HoleResultRow'
import { RoundHero } from './RoundHero'
import { ScorecardGrid } from './ScorecardGrid'
import styles from './RevealSequence.module.css'

interface RevealSequenceProps {
  courseName: string
  countryIsoCode?: string
  holes: Hole[]
  holeResults: HoleResult[]
  countries: CountriesContent
  revealedCount: number
  onSkip: () => void
  seasonRoundContext?: SeasonRoundContext
}

export function RevealSequence({
  courseName,
  countryIsoCode,
  holes,
  holeResults,
  countries,
  revealedCount,
  onSkip,
  seasonRoundContext,
}: RevealSequenceProps) {
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

  const holeIndex = new Map(holes.map((hole) => [hole.number, hole]))

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
  const currentCountry = currentHole ? countryIndex.get(currentHole.countryId) : undefined
  const currentHoleInfo = currentHole ? holeIndex.get(currentHole.holeNumber) : undefined

  // The hole currently being revealed stays solely in the spotlight card
  // above — only holes that have already settled build up in the table
  // below, so there's no duplication between the two.
  const completedHoles = holeResults.slice(0, Math.max(revealedCount - 1, 0))

  return (
    <div className={styles.wrapper}>
      {seasonRoundContext && <SeasonRoundBanner context={seasonRoundContext} />}
      <RoundHero
        courseName={courseName}
        countryIsoCode={countryIsoCode}
        holes={holes}
        holeResults={holeResults}
        revealedCount={revealedCount}
      />
      <ScorecardGrid holes={holes} holeResults={holeResults} revealedCount={revealedCount} />

      {currentHole && currentGolfer && currentHoleInfo && (
        <CurrentHoleCard
          holeNumber={currentHole.holeNumber}
          isoCode={currentCountry?.isoCode}
          golferName={currentGolfer.name}
          gross={currentHoleInfo.par + currentHole.relativeScore}
          tier={currentHole.outcomeTier}
          commentary={commentaryByHole[revealedCount - 1]}
        />
      )}

      <div className={styles.skipRow}>
        <Button variant="secondary" onClick={onSkip}>
          Skip
        </Button>
      </div>

      {completedHoles.length > 0 && (
        <>
          <p className={styles.eyebrow}>Holes so far</p>
          <ul className={styles.list}>
            {completedHoles.map((hole, i) => {
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
                  animateIn={i === completedHoles.length - 1}
                />
              )
            })}
          </ul>
        </>
      )}

      {/* Only worth a second skip button once the table above has some
          real length to skip past — with 1-2 rows it just duplicates the
          one under the commentary card right above. Skipping from all the
          way down here jumps straight to the final scorecard, which starts
          at the top of the page — scroll there too, or it'd land mid-scroll
          on a page the user hasn't seen yet. */}
      {completedHoles.length >= 3 && (
        <div className={styles.skipRow}>
          <Button
            variant="secondary"
            onClick={() => {
              window.scrollTo(0, 0)
              onSkip()
            }}
          >
            Skip
          </Button>
        </div>
      )}
    </div>
  )
}
