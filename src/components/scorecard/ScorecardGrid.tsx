import { useEffect, useRef } from 'react'
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
  // Holes to render as scored; the rest render as pending. Defaults to fully
  // revealed. Passing this prop at all (even 0) is also what flags "live
  // reveal in progress" below — Scorecard.tsx (final results, including the
  // round-detail drawer) never passes it, RevealSequence.tsx always does.
  revealedCount?: number
}

export function ScorecardGrid({ holes, holeResults, revealedCount }: ScorecardGridProps) {
  const isLiveReveal = revealedCount !== undefined
  const revealed = revealedCount ?? holeResults.length
  const totalPar = holes.reduce((sum, hole) => sum + hole.par, 0)

  const revealedResults = holeResults.slice(0, revealed)
  const anyRevealed = revealedResults.length > 0
  const scoreTotal = revealedResults.reduce(
    (sum, result, i) => sum + holes[i].par + result.relativeScore,
    0,
  )

  const wrapperRef = useRef<HTMLDivElement>(null)

  // While a round is being revealed hole-by-hole, keep the most recently
  // played hole in view automatically instead of leaving it up to the user
  // to scroll a widening table — the grid is locked (see .locked below) for
  // exactly the same duration, so this is the only way to see new columns
  // land. Once the round is complete (revealedCount stops being passed at
  // all, on the final results/history view), the grid unlocks and this
  // effect never fires again.
  useEffect(() => {
    if (!isLiveReveal || !wrapperRef.current) return
    const currentHoleNumber = holes[revealed - 1]?.number
    if (currentHoleNumber === undefined) return
    const cell = wrapperRef.current.querySelector<HTMLElement>(`[data-hole="${currentHoleNumber}"]`)
    cell?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [isLiveReveal, revealed, holes])

  return (
    <div ref={wrapperRef} className={isLiveReveal ? `${styles.wrapper} ${styles.locked}` : styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.rowLabel} scope="col">
              Hole
            </th>
            {holes.map((hole) => (
              <th key={hole.number} data-hole={hole.number}>
                {hole.number}
              </th>
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
