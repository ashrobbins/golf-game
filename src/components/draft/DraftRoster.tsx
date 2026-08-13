import type { Country, Golfer } from '../../content/types'
import type { DraftPick } from '../../game/draft/types'
import { isoToFlagEmoji } from '../picker/flag'
import styles from './DraftRoster.module.css'

interface DraftRosterProps {
  picks: DraftPick[]
  countryIndex: Map<string, Country>
  golferIndex: Map<string, Golfer>
  totalHoles: number
}

// A new row lands every time a pick is made — styled like the post-round
// commentary list so the draft and the results screen read as the same
// running "roster" table, just filling in over time instead of all at once.
export function DraftRoster({ picks, countryIndex, golferIndex, totalHoles }: DraftRosterProps) {
  if (picks.length === 0) return null

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>
        Your bag <span className={styles.count}>{picks.length}/{totalHoles}</span>
      </h3>
      <ul className={styles.list}>
        {picks.map((pick) => {
          const golfer = golferIndex.get(pick.golferId)
          const country = countryIndex.get(pick.countryId)

          return (
            <li key={pick.holeNumber} className={styles.row}>
              <span className={styles.holeNumber}>{pick.holeNumber}</span>
              <span className={styles.golferName}>{golfer?.name ?? pick.golferId}</span>
              {country && (
                <span className={styles.country}>
                  {isoToFlagEmoji(country.isoCode)} {country.name}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
