import { useMemo, useState } from 'react'
import type { Country, Golfer } from '../../content/types'
import { GolferCard } from '../draft/GolferCard'
import { Button } from '../ui/Button'
import { Reel } from './Reel'
import { buildLoopingStrip, shuffle } from './stripBuilders'
import styles from './GolferReels.module.css'

const REEL_ITEM_HEIGHT = 136
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
  const [settledCount, setSettledCount] = useState(0)

  const strips = useMemo(
    () => targets.map((target) => buildLoopingStrip(shuffle(country.golfers), target, LOOPS)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spinToken],
  )

  const allSettled = settledCount >= targets.length
  const selectedGolfer = targets.find((g) => g.id === selectedId)

  return (
    <div className={styles.wrapper}>
      <div className={styles.reels}>
        {targets.map((golfer, i) => (
          <div key={golfer.id} className={styles.column}>
            <Reel
              items={strips[i]}
              itemHeight={REEL_ITEM_HEIGHT}
              durationMs={BASE_DURATION_MS + i * STAGGER_MS}
              spinToken={spinToken}
              edgeFade={false}
              getKey={(g, idx) => `${g.id}-${idx}`}
              onSettled={() => setSettledCount((c) => c + 1)}
              renderItem={(g) => <GolferCard golfer={g} />}
            />
            {allSettled && (
              <Button
                variant={selectedId === golfer.id ? 'primary' : 'secondary'}
                fullWidth
                onClick={() => setSelectedId(golfer.id)}
              >
                {selectedId === golfer.id ? 'Selected' : 'Select'}
              </Button>
            )}
          </div>
        ))}
      </div>
      {allSettled && selectedGolfer && (
        <Button onClick={() => onPick(selectedGolfer.id)}>Draft {selectedGolfer.name}</Button>
      )}
    </div>
  )
}
