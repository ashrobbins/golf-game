import { forwardRef } from 'react'
import type { CountriesContent, Country, Course } from '../../content/types'
import { findTopPerformer } from '../../game/share/topPerformer'
import type { SimulationResult } from '../../game/simulation/types'
import { ResultsHero } from '../scorecard/ResultsHero'
import { StackedScorecard } from './StackedScorecard'
import { TopPerformerCard } from './TopPerformerCard'
import styles from './ShareCard.module.css'

interface ShareCardProps {
  course: Course
  countries: CountriesContent
  result: SimulationResult
  // Short display form of the share URL for the footer — full-length codes
  // run ~50 characters, too cramped at this font size, so callers pass an
  // already-truncated string.
  shareUrlDisplay: string
}

// Rendered off-screen at its real natural size (see ShareModal.tsx, which
// captures this with html-to-image at a high pixelRatio) — nothing in here
// is sized for a big final image, the capture step is what does that.
// Reuses ResultsHero wholesale so the hero section can never visually drift
// from the real results page; StackedScorecard/TopPerformerCard are new,
// built specifically for this static-image layout (see their own files for
// why they aren't just reused from the scrollable/live-reveal versions).
export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(function ShareCard(
  { course, countries, result, shareUrlDisplay },
  ref,
) {
  const countryIndex = new Map<string, Country>(countries.countries.map((c) => [c.id, c]))
  const performer = findTopPerformer(course.id, result.holeResults, countries)
  const performerHole = performer ? course.holes.find((h) => h.number === performer.hole.holeNumber) : undefined

  return (
    <div ref={ref} className={styles.card}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>⛳</span>
        <span className={styles.brandName}>Beating Bogey</span>
      </div>

      <ResultsHero
        courseName={course.name}
        countryIsoCode={course.countryIsoCode}
        holes={course.holes}
        holeResults={result.holeResults}
        totalStrokesToPar={result.totalStrokesToPar}
        bogeyFreeThroughHole={result.bogeyFreeThroughHole}
        isBogeyFreeRound={result.isBogeyFreeRound}
      />

      <StackedScorecard holes={course.holes} holeResults={result.holeResults} />

      {performer && performerHole && (
        <TopPerformerCard
          performer={performer}
          hole={performerHole}
          countryIsoCode={countryIndex.get(performer.hole.countryId)?.isoCode}
        />
      )}

      <div className={styles.footer}>
        <span className={styles.footerUrl}>{shareUrlDisplay}</span>
        <span className={styles.footerTag}>Can you go lower?</span>
      </div>
    </div>
  )
})
