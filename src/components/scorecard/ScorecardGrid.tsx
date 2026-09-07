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

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  // Cumulative horizontal shift applied to the table via transform, in
  // pixels (0 or negative — the table only ever moves left). Tracked in a
  // ref rather than read back from the DOM each time, since a mid-flight
  // CSS transition means the transform's current computed value doesn't
  // necessarily match the target we last set.
  const translateXRef = useRef(0)

  // While a round is being revealed hole-by-hole, keep the most recently
  // played hole in view automatically instead of leaving it up to the user
  // to scroll a widening table — the grid is locked (see .locked in the
  // CSS module) for exactly the same duration, so this is the only way to
  // see new columns land. Once the round is complete (revealedCount stops
  // being passed at all, on the final results/history view), the grid
  // unlocks and this effect never fires again.
  //
  // Deliberately shifts the table via a CSS transform rather than the
  // scroll area's native scrollLeft. Two problems with native scroll here:
  // (1) cell.scrollIntoView() walks every scrollable ancestor, including
  // the page itself, and was yanking the whole page's vertical scroll
  // position back up to the scorecard every time a new hole landed; (2)
  // even scoped to just this element (scrollArea.scrollTo/scrollLeft), its
  // own overflow-x:hidden while locked turns out to block programmatic
  // scrolling too in some browsers, not just user-driven scrolling. A
  // transform sidesteps both, since it never touches any ancestor's scroll
  // position and works regardless of overflow mode — see
  // ScorecardGrid.module.css for why the label/total columns had to move
  // out of this table entirely to make that transform safe to use.
  useEffect(() => {
    if (!isLiveReveal || !scrollAreaRef.current || !tableRef.current) return
    const currentHoleNumber = holes[revealed - 1]?.number
    if (currentHoleNumber === undefined) return
    const scrollArea = scrollAreaRef.current
    const table = tableRef.current
    const cell = table.querySelector<HTMLElement>(`[data-hole="${currentHoleNumber}"]`)
    if (!cell) return
    const scrollAreaRect = scrollArea.getBoundingClientRect()
    const cellRect = cell.getBoundingClientRect()
    const delta = cellRect.left + cellRect.width / 2 - (scrollAreaRect.left + scrollAreaRect.width / 2)
    const minTranslate = -(table.scrollWidth - scrollArea.clientWidth)
    const next = Math.min(0, Math.max(minTranslate, translateXRef.current - delta))
    translateXRef.current = next
    table.style.transform = `translateX(${next}px)`
  }, [isLiveReveal, revealed, holes])

  return (
    <div className={styles.wrapper}>
      <table className={styles.pinnedTable}>
        <thead>
          <tr>
            <th className={styles.rowLabel} scope="col">
              Hole
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th className={styles.rowLabel} scope="row">
              Par
            </th>
          </tr>
          <tr>
            <th className={styles.rowLabel} scope="row">
              Score
            </th>
          </tr>
        </tbody>
      </table>

      <div
        ref={scrollAreaRef}
        className={isLiveReveal ? `${styles.scrollArea} ${styles.locked}` : styles.scrollArea}
      >
        <table ref={tableRef} className={isLiveReveal ? `${styles.table} ${styles.sliding}` : styles.table}>
          <thead>
            <tr>
              {holes.map((hole) => (
                <th key={hole.number} data-hole={hole.number}>
                  {hole.number}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {holes.map((hole) => (
                <td key={hole.number}>{hole.par}</td>
              ))}
            </tr>
            <tr>
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
            </tr>
          </tbody>
        </table>
      </div>

      <table className={styles.pinnedTable}>
        <thead>
          <tr>
            <th className={styles.totalCell}>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={styles.totalCell}>{totalPar}</td>
          </tr>
          <tr>
            <td className={styles.totalCell}>{anyRevealed ? scoreTotal : '–'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
