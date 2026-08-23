import type { Hole } from '../../content/types'
import type { HoleResult } from '../../game/simulation/types'
import { ScoreMark } from './ScoreMark'
import styles from './ScorecardGrid.module.css'

interface ScorecardGridProps {
  // Full course holes, ordered 1..N — gives the Par row and each hole's par
  // for turning a relative score into a real stroke count.
  holes: Hole[]
  // Same order as `holes`. May be shorter than `holes` during a live reveal.
  holeResults: HoleResult[]
  // Holes to render as scored; the rest render as pending. Defaults to fully revealed.
  revealedCount?: number
}

export function ScorecardGrid({ holes, holeResults, revealedCount }: ScorecardGridProps) {
  const revealed = revealedCount ?? holeResults.length
  const totalPar = holes.reduce((sum, hole) => sum + hole.par, 0)

  const revealedResults = holeResults.slice(0, revealed)
  const anyRevealed = revealedResults.length > 0
  const scoreTotal = revealedResults.reduce(
    (sum, result, i) => sum + holes[i].par + result.relativeScore,
    0,
  )

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.rowLabel} scope="col">
              Hole
            </th>
            {holes.map((hole) => (
              <th key={hole.number}>{hole.number}</th>
            ))}
            <th className={styles.totalCell}>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th className={styles.rowLabel} scope="row">
              Par
            </th>
            {holes.map((hole) => (
              <td key={hole.number}>{hole.par}</td>
            ))}
            <td className={styles.totalCell}>{totalPar}</td>
          </tr>
          <tr>
            <th className={styles.rowLabel} scope="row">
              Score
            </th>
            {holes.map((hole, i) => {
              const result = holeResults[i]
              const isRevealed = Boolean(result) && i < revealed
              if (!isRevealed) {
                return (
                  <td key={hole.number} className={styles.pending}>
                    –
                  </td>
                )
              }
              const gross = hole.par + result.relativeScore
              return (
                <td key={hole.number}>
                  <ScoreMark gross={gross} tier={result.outcomeTier} />
                </td>
              )
            })}
            <td className={styles.totalCell}>{anyRevealed ? scoreTotal : '–'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
