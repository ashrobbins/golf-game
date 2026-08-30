import type { Hole } from '../../content/types'
import type { HoleResult } from '../../game/simulation/types'
import { ScoreMark } from '../scorecard/ScoreMark'
import styles from './StackedScorecard.module.css'

interface StackedScorecardProps {
  holes: Hole[]
  holeResults: HoleResult[]
}

interface HalfProps {
  label: string
  totalLabel: string
  holes: Hole[]
  holeResults: HoleResult[]
}

// Front 9 over back 9 rather than one wide scrollable table — this is only
// ever used for a static image (the share card), which can't scroll, so
// the ScorecardGrid layout doesn't apply here. Both halves render through
// this same component so their column widths (set once, in the CSS grid
// template) can never drift out of alignment with each other the way two
// independently-sized <table> elements would.
function ScorecardHalf({ label, totalLabel, holes, holeResults }: HalfProps) {
  const totalPar = holes.reduce((sum, hole) => sum + hole.par, 0)
  const total = holeResults.reduce((sum, r, i) => sum + holes[i].par + r.relativeScore, 0)

  return (
    <div className={styles.block}>
      <div className={`${styles.row} ${styles.head}`}>
        <div className={styles.label}>{label}</div>
        {holes.map((hole) => (
          <div key={hole.number}>{hole.number}</div>
        ))}
        <div>{totalLabel}</div>
      </div>
      <div className={styles.row}>
        <div className={styles.label}>Par</div>
        {holes.map((hole) => (
          <div key={hole.number}>{hole.par}</div>
        ))}
        <div className={styles.subtotal}>{totalPar}</div>
      </div>
      <div className={styles.row}>
        <div className={styles.label}>Score</div>
        {holes.map((hole, i) => {
          const result = holeResults[i]
          const gross = hole.par + result.relativeScore
          return (
            <div key={hole.number}>
              {result.outcomeTier === 'par' ? gross : <ScoreMark gross={gross} tier={result.outcomeTier} />}
            </div>
          )
        })}
        <div className={styles.subtotal}>{total}</div>
      </div>
    </div>
  )
}

export function StackedScorecard({ holes, holeResults }: StackedScorecardProps) {
  const half = holes.length / 2
  return (
    <div className={styles.scorecards}>
      <ScorecardHalf
        label="Front 9"
        totalLabel="Out"
        holes={holes.slice(0, half)}
        holeResults={holeResults.slice(0, half)}
      />
      <ScorecardHalf
        label="Back 9"
        totalLabel="In"
        holes={holes.slice(half)}
        holeResults={holeResults.slice(half)}
      />
    </div>
  )
}
