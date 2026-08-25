import { useMemo, useState } from 'react'
import type { Country, Golfer } from '../../content/types'
import { GolferCard } from '../draft/GolferCard'
import { Button } from '../ui/Button'
import { Reel } from './Reel'
import { buildLoopingStrip, shuffle } from './stripBuilders'
import styles from './GolferReels.module.css'

// Exported so GolferReelsSkeleton can reserve exactly this much space while
// the real reel contents (which depend on the resolved country) aren't
// known yet.
export const REEL_ITEM_HEIGHT = 136
const BASE_DURATION_MS = 750
const STAGGER_MS = 225
const LOOPS = 3

interface GolferReelsProps {
  // The country the offer is drawn from — its full roster is used as filler
  // content for the spin, purely cosmetic.
  country: Country
  // The 3 real offered golfers, in reel order.
  targets: Golfer[]
  spinToken: number | string
  onPick: (golferId: string) => void
}

// Parent must remount this with `key={spinToken}` so a fresh spin gets fresh
// internal state, rather than resetting it here via an effect.
export function GolferReels({ country, targets, spinToken, onPick }: GolferReelsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [settledIndices, setSettledIndices] = useState<Set<number>>(() => new Set())

  const strips = useMemo(
    () => targets.map((target) => buildLoopingStrip(shuffle(country.golfers), target, LOOPS)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spinToken],
  )

  const allSettled = settledIndices.size >= targets.length
  const selectedGolfer = targets.find((g) => g.id === selectedId)

  return (
    <div className={styles.wrapper}>
      <div className={styles.reels}>
        {targets.map((golfer, i) => {
          // Gate the legend border on this specific reel having settled —
          // targets are known from the start, so applying it unconditionally
          // would give away a legend pick while it's still spinning.
          const showLegendBorder = settledIndices.has(i) && golfer.skill === 'legend'

          return (
            <div
              key={golfer.id}
              className={showLegendBorder ? `${styles.column} ${styles.legend}` : styles.column}
            >
              <Reel
                items={strips[i]}
                itemHeight={REEL_ITEM_HEIGHT}
                durationMs={BASE_DURATION_MS + i * STAGGER_MS}
                spinToken={spinToken}
                edgeFade={false}
                getKey={(g, idx) => `${g.id}-${idx}`}
                onSettled={() =>
                  setSettledIndices((prev) => {
                    const next = new Set(prev)
                    next.add(i)
                    return next
                  })
                }
                renderItem={(g) => (
                  <GolferCard golfer={g} onClick={allSettled ? () => setSelectedId(golfer.id) : undefined} />
                )}
              />
              {/* Always mounted (not conditional on allSettled) so its
                  height is reserved from the reel's first render — hidden
                  via visibility rather than left unmounted, so it never
                  causes a layout shift when the reel finishes spinning. */}
              <Button
                variant={selectedId === golfer.id ? 'primary' : 'secondary'}
                fullWidth
                disabled={!allSettled}
                className={allSettled ? undefined : styles.pending}
                onClick={() => setSelectedId(golfer.id)}
              >
                {selectedId === golfer.id ? 'Selected' : 'Select'}
              </Button>
            </div>
          )
        })}
      </div>
      {/* Same reasoning — always mounted, hidden until there's a golfer to
          name, so picking one never shifts the roster below. */}
      <Button
        disabled={!selectedGolfer}
        className={selectedGolfer ? undefined : styles.pending}
        onClick={() => selectedGolfer && onPick(selectedGolfer.id)}
      >
        Draft {selectedGolfer?.name ?? ' '}
      </Button>
    </div>
  )
}
