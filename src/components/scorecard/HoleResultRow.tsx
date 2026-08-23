import type { OutcomeTier } from '../../content/types'
import { CountryFlag } from '../picker/CountryFlag'
import { ScoreMark } from './ScoreMark'
import styles from './HoleResultRow.module.css'

interface HoleResultRowProps {
  holeNumber: number
  isoCode?: string
  golferName: string
  commentary: string
  gross: number
  tier: OutcomeTier
  isLegend?: boolean
  // Plays a one-time entrance animation on mount — used only for the row
  // that's newly landed at the bottom of the live reveal's growing table,
  // not for the final results list (which renders complete, instantly).
  animateIn?: boolean
}

// Shared per-hole row — used by both the live reveal's growing "holes so
// far" table and the final results list, so a given outcome always reads
// identically in both places (same idea as ScoreMark itself).
export function HoleResultRow({
  holeNumber,
  isoCode,
  golferName,
  commentary,
  gross,
  tier,
  isLegend,
  animateIn,
}: HoleResultRowProps) {
  const classes = [styles.row, isLegend && styles.legend, animateIn && styles.animateIn]
    .filter(Boolean)
    .join(' ')

  return (
    <li className={classes}>
      <span className={styles.number}>{holeNumber}</span>
      {isoCode && <CountryFlag isoCode={isoCode} className={styles.flag} ariaHidden />}
      <div className={styles.body}>
        <div className={styles.name}>{golferName}</div>
        <p className={styles.commentary}>{commentary}</p>
      </div>
      <ScoreMark gross={gross} tier={tier} className={styles.mark} />
    </li>
  )
}
