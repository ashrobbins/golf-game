import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import styles from './Reel.module.css'

export const DEFAULT_REEL_ITEM_HEIGHT = 56

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [])
  return reduced
}

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
  const reducedMotion = usePrefersReducedMotion()
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
      track.style.transition = 'none'
      track.style.transform = `translateY(${restingOffset}px)`
      const raf = requestAnimationFrame(settleOnce)
      return () => cancelAnimationFrame(raf)
    }

    track.style.transition = 'none'
    track.style.transform = 'translateY(0px)'

    // Force a synchronous layout flush so the browser actually commits the
    // transition:none + transform:0 state before the transition is
    // re-enabled below. Without this, iOS Safari (both Chrome and Safari
    // there use WebKit) can coalesce both style writes into a single
    // frame and skip the animation entirely, jumping straight to the
    // resting position — a single requestAnimationFrame isn't a strong
    // enough guarantee on that engine.
    void track.offsetHeight

    track.style.transition = `transform ${durationMs}ms cubic-bezier(0.12, 0.83, 0.24, 1)`
    track.style.transform = `translateY(${restingOffset}px)`

    // Fallback in case 'transitionend' doesn't fire (e.g. backgrounded tab).
    const timeout = window.setTimeout(settleOnce, durationMs + 150)

    return () => {
      window.clearTimeout(timeout)
    }
    // restingOffset is derived from items/spinToken together; re-running on
    // spinToken change alone is the intent (a fresh spin), not on every
    // items identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinToken, reducedMotion])

  function handleTransitionEnd() {
    if (settledRef.current) return
    settledRef.current = true
    onSettled?.()
  }

  return (
    <div
      className={edgeFade ? `${styles.viewport} ${styles.fade}` : styles.viewport}
      style={{ height: itemHeight }}
    >
      <div ref={trackRef} className={styles.track} onTransitionEnd={handleTransitionEnd}>
        {items.map((item, i) => (
          <div key={getKey(item, i)} className={styles.item} style={{ height: itemHeight }}>
            {renderItem(item, i)}
          </div>
        ))}
      </div>
    </div>
  )
}
