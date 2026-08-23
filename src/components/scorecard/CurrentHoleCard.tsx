import type { OutcomeTier } from '../../content/types'
import { CountryFlag } from '../picker/CountryFlag'
import { ScoreMark } from './ScoreMark'
import styles from './CurrentHoleCard.module.css'

interface CurrentHoleCardProps {
  holeNumber: number
  isoCode?: string
  golferName: string
  gross: number
  tier: OutcomeTier
  commentary: string
}

// The in-progress hole's own spotlight card during a live reveal — settles
// into a HoleResultRow in the table below once the next hole starts.
export function CurrentHoleCard({ holeNumber, isoCode, golferName, gross, tier, commentary }: CurrentHoleCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <span className={styles.holeNumber}>{holeNumber}</span>
        {isoCode && <CountryFlag isoCode={isoCode} className={styles.flag} ariaHidden />}
        <span className={styles.name}>{golferName}</span>
        <ScoreMark gross={gross} tier={tier} size="large" />
      </div>
      <p className={styles.commentary}>{commentary}</p>
    </div>
  )
}
