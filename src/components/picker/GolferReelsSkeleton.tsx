import { REEL_ITEM_HEIGHT } from './GolferReels'
import reelsStyles from './GolferReels.module.css'
import styles from './GolferReelsSkeleton.module.css'

// Shown in GolferReels' place while a hole's country is still spinning —
// the offered golfers aren't known until it resolves, but reserving this
// block's exact footprint up front (same wrapper/reels/column classes
// GolferReels itself uses) means swapping the real reels in doesn't shift
// anything below on the page.
export function GolferReelsSkeleton() {
  return (
    <div className={reelsStyles.wrapper}>
      <div className={reelsStyles.reels}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={reelsStyles.column}>
            <div className={styles.card} style={{ height: REEL_ITEM_HEIGHT }} />
            <div className={styles.button} />
          </div>
        ))}
      </div>
      <div className={`${styles.button} ${styles.outerButton}`} />
    </div>
  )
}
