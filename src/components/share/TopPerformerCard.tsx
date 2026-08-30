import { useMemo } from 'react'
import type { TopPerformer } from '../../game/share/topPerformer'
import { hashSeed } from '../../game/share/seed'
import { generateHoleCommentary } from '../../game/simulation/commentary'
import { mulberry32 } from '../../game/rng'
import type { Hole } from '../../content/types'
import { CountryFlag } from '../picker/CountryFlag'
import { ScoreMark } from '../scorecard/ScoreMark'
import styles from './TopPerformerCard.module.css'

interface TopPerformerCardProps {
  performer: TopPerformer
  hole: Hole
  // The spotlighted golfer's own country flag (via their holeResult's
  // countryId) — not the course's.
  countryIsoCode?: string
}

// Based on CurrentHoleCard's real "spotlighted single hole" pattern (same
// number/flag/name/large-mark layout), plus the app's established
// inset-gold-bar convention for a legend/highlight row — this is the same
// idea, just built as a standalone card. Commentary runs bigger than
// CurrentHoleCard's real size since it carries more weight here as the
// focal text of a static share image.
export function TopPerformerCard({ performer, hole, countryIsoCode }: TopPerformerCardProps) {
  const { golfer, hole: holeResult, isHighlight } = performer
  const gross = hole.par + holeResult.relativeScore

  // Seeded rather than left on the default Math.random() — this card gets
  // rendered twice at once (the modal's visible thumbnail and the
  // off-screen copy that's actually captured for the shared image), and
  // both need to show identical text, not two independently-rolled lines.
  const commentary = useMemo(() => {
    const seed = hashSeed(`${holeResult.holeNumber}:${golfer.id}:${holeResult.outcomeTier}:${holeResult.archetypeMatched}`)
    return generateHoleCommentary(golfer, hole, holeResult.outcomeTier, holeResult.archetypeMatched, mulberry32(seed))
  }, [golfer, hole, holeResult])

  return (
    <div className={isHighlight ? `${styles.card} ${styles.highlight}` : styles.card}>
      <p className={isHighlight ? styles.eyebrow : `${styles.eyebrow} ${styles.eyebrowNeutral}`}>
        {isHighlight ? '🏆 Top performer' : 'On this round'}
      </p>
      <div className={styles.top}>
        <span className={styles.holeNumber}>{holeResult.holeNumber}</span>
        {countryIsoCode && <CountryFlag isoCode={countryIsoCode} className={styles.flag} ariaHidden />}
        <span className={styles.name}>{golfer.name}</span>
        <ScoreMark gross={gross} tier={holeResult.outcomeTier} size="large" />
      </div>
      <p className={styles.commentary}>{commentary}</p>
    </div>
  )
}
