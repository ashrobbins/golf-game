import { useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useDraftAnimation } from '../../hooks/useDraftAnimation'
import styles from './Reel.module.css'

export const DEFAULT_REEL_ITEM_HEIGHT = 56

interface ReelProps<T> {
  // The strip of content the reel scrolls through. The LAST item is where
  // the reel comes to rest — build the strip so it already ends on the
  // predetermined result.
  items: T[]
  durationMs: number
  // Change this to trigger a fresh spin (e.g. the current hole number).
  spinToken: number | string
  getKey: (item: T, index: number) => string
  renderItem: (item: T, index: number) => ReactNode
  onSettled?: () => void
  itemHeight?: number
  // Fades the top/bottom edges of the strip as it scrolls past — suits a
  // rolodex-style spinner (the country picker) but reads as an unwanted
  // gradient on content cards (golfer reels), so it's opt-out per use.
  edgeFade?: boolean
}

export function Reel<T>({
  items,
  durationMs,
  spinToken,
  getKey,
  renderItem,
  onSettled,
  itemHeight = DEFAULT_REEL_ITEM_HEIGHT,
  edgeFade = true,
}: ReelProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null)
  const settledRef = useRef(false)
  const { enabled: animationEnabled } = useDraftAnimation()
  const reducedMotion = !animationEnabled
  const restingOffset = -(items.length - 1) * itemHeight

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    settledRef.current = false

    const settleOnce = () => {
      if (settledRef.current) return
      settledRef.current = true
      onSettled?.()
    }

    if (reducedMotion) {
      track.style.transform = `translateY(${restingOffset}px)`
      const raf = requestAnimationFrame(settleOnce)
      return () => cancelAnimationFrame(raf)
    }

    // Web Animations API instead of a CSS transition triggered by writing
    // two style snapshots from JS — that pattern (reset, force reflow,
    // re-enable transition) is a well-known source of flakiness on iOS
    // WebKit specifically (both Safari and Chrome use it there), which can
    // coalesce the two writes into one frame and skip straight to the
    // resting position no matter how the reflow/rAF timing is nudged.
    // `.animate()` is driven explicitly by JS rather than relying on the
    // browser diffing style snapshots across a paint boundary, so it
    // sidesteps that whole bug class rather than working around it again.
    track.style.transform = 'translateY(0px)'
    const animation = track.animate(
      [{ transform: 'translateY(0px)' }, { transform: `translateY(${restingOffset}px)` }],
      { duration: durationMs, easing: 'cubic-bezier(0.12, 0.83, 0.24, 1)', fill: 'forwards' },
    )

    animation.finished
      .then(() => {
        // fill: 'forwards' is a rendered effect, not a committed inline
        // style — set the real style too so later reads (e.g. a resting
        // reel remounting with the same track) see the right value.
        track.style.transform = `translateY(${restingOffset}px)`
        settleOnce()
      })
      .catch(() => {
        // Cancelled below (unmount or a fresh spinToken) — no-op.
      })

    return () => {
      animation.cancel()
    }
    // restingOffset is derived from items/spinToken together; re-running on
    // spinToken change alone is the intent (a fresh spin), not on every
    // items identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinToken, reducedMotion])

  return (
    <div
      className={edgeFade ? `${styles.viewport} ${styles.fade}` : styles.viewport}
      style={{ height: itemHeight }}
    >
      <div ref={trackRef} className={styles.track}>
        {items.map((item, i) => (
          <div key={getKey(item, i)} className={styles.item} style={{ height: itemHeight }}>
            {renderItem(item, i)}
          </div>
        ))}
      </div>
    </div>
  )
}
