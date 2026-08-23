import styles from '../scorecard/HoleOutcomeDots.module.css'

interface DraftProgressDotsProps {
  totalHoles: number
  draftedCount: number
}

// Same dot-strip visual language as the results screen's HoleOutcomeDots
// (shares its CSS module), reused with simpler two-state semantics for the
// draft screen: filled = drafted, grey = not yet — there's no outcome to
// color by until the round is actually played.
export function DraftProgressDots({ totalHoles, draftedCount }: DraftProgressDotsProps) {
  return (
    <div className={styles.strip}>
      {Array.from({ length: totalHoles }, (_, i) => (
        <span key={i} className={i < draftedCount ? `${styles.dot} ${styles.picked}` : styles.dot} />
      ))}
    </div>
  )
}
