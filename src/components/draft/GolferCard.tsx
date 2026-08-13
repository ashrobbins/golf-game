import { formatArchetypeLabel } from '../../content/formatArchetype'
import { splitName } from '../../content/formatName'
import type { Golfer } from '../../content/types'
import styles from './GolferCard.module.css'

export function GolferCard({ golfer }: { golfer: Golfer }) {
  const [firstName, surname] = splitName(golfer.name)

  return (
    <div className={styles.card}>
      <div className={styles.name}>
        <div className={styles.firstName}>{firstName}</div>
        <div className={styles.surname}>{surname}</div>
      </div>
      <div className={styles.era}>{golfer.era ?? ' '}</div>
      <div className={styles.chips}>
        {golfer.archetypes.map((tag) => (
          <span key={tag} className={styles.chip}>
            {formatArchetypeLabel(tag)}
          </span>
        ))}
      </div>
    </div>
  )
}
