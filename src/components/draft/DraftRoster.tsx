import { archetypeColorVar } from '../../content/formatArchetype'
import type { Country, Golfer, Hole } from '../../content/types'
import type { DraftPick } from '../../game/draft/types'
import { bestFitArchetype } from '../../game/simulation/affinity'
import { CountryFlag } from '../picker/CountryFlag'
import { ArchetypeBadge } from '../ui/ArchetypeBadge'
import { GolfFlagIcon, GolferIcon } from '../ui/icons'
import styles from './DraftRoster.module.css'

interface DraftRosterProps {
  picks: DraftPick[]
  holes: Hole[]
  countryIndex: Map<string, Country>
  golferIndex: Map<string, Golfer>
  totalHoles: number
}

// A new row lands every time a pick is made — styled like the post-round
// commentary list so the draft and the results screen read as the same
// running "roster" table, just filling in over time instead of all at once.
// Three fixed-width columns (golfer / player archetype / hole archetype),
// via CSS grid, so a pick doesn't reflow the whole table — the golfer name
// is the only thing allowed to wrap, onto a second line within its own
// column, rather than pushing on the archetype columns next to it.
export function DraftRoster({ picks, holes, countryIndex, golferIndex, totalHoles }: DraftRosterProps) {
  if (picks.length === 0) return null

  const holeIndex = new Map(holes.map((hole) => [hole.number, hole]))

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>
        Your bag <span className={styles.count}>{picks.length}/{totalHoles}</span>
      </h3>
      <div className={styles.columnHeader} aria-hidden="true">
        <span />
        <span className={styles.columnLabel}>Player</span>
        <span className={styles.columnLabel}>Hole</span>
      </div>
      <ul className={styles.list}>
        {picks.map((pick) => {
          const golfer = golferIndex.get(pick.golferId)
          const country = countryIndex.get(pick.countryId)
          const hole = holeIndex.get(pick.holeNumber)
          const isLegend = golfer?.skill === 'legend'
          const playerArchetype = golfer && hole ? bestFitArchetype(golfer, hole.archetype) : undefined

          return (
            <li
              key={pick.holeNumber}
              className={isLegend ? `${styles.row} ${styles.legendRow}` : styles.row}
            >
              <span className={styles.golferCell}>
                <span className={styles.holeNumber}>{pick.holeNumber}</span>
                {country && <CountryFlag isoCode={country.isoCode} className={styles.flag} ariaHidden />}
                <span className={styles.golferName}>{golfer?.name ?? pick.golferId}</span>
              </span>
              <span className={styles.archetypeCell}>
                {playerArchetype && (
                  <>
                    <GolferIcon
                      className={styles.archetypeIcon}
                      style={{ color: archetypeColorVar(playerArchetype) }}
                      aria-hidden="true"
                    />
                    <ArchetypeBadge tag={playerArchetype} label="abbr" />
                  </>
                )}
              </span>
              <span className={styles.archetypeCell}>
                {hole && (
                  <>
                    <GolfFlagIcon
                      className={styles.archetypeIcon}
                      style={{ color: archetypeColorVar(hole.archetype) }}
                      aria-hidden="true"
                    />
                    <ArchetypeBadge tag={hole.archetype} label="abbr" />
                  </>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
