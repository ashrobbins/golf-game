import { ArchetypeBadge } from '../ui/ArchetypeBadge'
import type { Hole } from '../../content/types'
import styles from './CourseHoleTable.module.css'

function sumPar(holes: Hole[]): number {
  return holes.reduce((sum, hole) => sum + hole.par, 0)
}

function sumYardage(holes: Hole[]): number {
  return holes.reduce((sum, hole) => sum + hole.yardage, 0)
}

function HoleRow({ hole }: { hole: Hole }) {
  return (
    <tr className={styles.row}>
      <td className={styles.holeCell}>
        <div className={styles.holeMain}>
          <span className={styles.holeNumber}>{hole.number}</span>
          {hole.name && <span className={styles.holeName}>{hole.name}</span>}
        </div>
        {/* Shown only on narrow viewports, in place of the dropped Archetype
            column — see .archetypeMobile / .archetypeCell in the CSS. */}
        <div className={styles.archetypeMobile}>
          <ArchetypeBadge tag={hole.archetype} />
        </div>
      </td>
      <td className={styles.numberCell}>{hole.par}</td>
      <td className={styles.numberCell}>{hole.yardage}</td>
      <td className={styles.archetypeCell}>
        <ArchetypeBadge tag={hole.archetype} />
      </td>
    </tr>
  )
}

function SubtotalRow({
  label,
  holes,
  emphasis,
}: {
  label: string
  holes: Hole[]
  emphasis?: boolean
}) {
  return (
    <tr className={emphasis ? styles.totalRow : styles.subtotalRow}>
      <td className={styles.holeCell}>{label}</td>
      <td className={styles.numberCell}>{sumPar(holes)}</td>
      <td className={styles.numberCell}>{sumYardage(holes)}</td>
      <td className={styles.archetypeCell} />
    </tr>
  )
}

export function CourseHoleTable({ holes }: { holes: Hole[] }) {
  const front = holes.filter((h) => h.number <= 9)
  const back = holes.filter((h) => h.number > 9)

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.headCell}>Hole</th>
            <th className={styles.headCell}>Par</th>
            <th className={styles.headCell}>Yards</th>
            <th className={`${styles.headCell} ${styles.archetypeCell}`}>Archetype</th>
          </tr>
        </thead>
        <tbody>
          {front.map((hole) => (
            <HoleRow key={hole.number} hole={hole} />
          ))}
          {front.length > 0 && <SubtotalRow label="Out" holes={front} />}
          {back.map((hole) => (
            <HoleRow key={hole.number} hole={hole} />
          ))}
          {back.length > 0 && <SubtotalRow label="In" holes={back} />}
          <SubtotalRow label="Total" holes={holes} emphasis />
        </tbody>
      </table>
    </div>
  )
}
