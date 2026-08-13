import { useEffect, useRef, useState } from 'react'
import type { HoleResult } from '../game/simulation/types'

// Slow enough to read a full hole commentary sentence before the next one
// lands; Skip is always available for anyone who doesn't want to wait.
const REVEAL_INTERVAL_MS = 2200

// Caller must remount (e.g. via `key`) when starting a fresh round — this
// hook does not reset its own progress if holeResults changes underneath it.
export function useHoleRevealSequencer(holeResults: HoleResult[]) {
  const [revealedCount, setRevealedCount] = useState(0)
  const intervalRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (holeResults.length === 0) return

    intervalRef.current = window.setInterval(() => {
      setRevealedCount((count) => {
        const next = count + 1
        if (next >= holeResults.length) {
          window.clearInterval(intervalRef.current)
        }
        return next
      })
    }, REVEAL_INTERVAL_MS)

    return () => window.clearInterval(intervalRef.current)
  }, [holeResults])

  function skipToEnd() {
    window.clearInterval(intervalRef.current)
    setRevealedCount(holeResults.length)
  }

  return {
    revealedCount,
    isComplete: revealedCount >= holeResults.length,
    skipToEnd,
  }
}
