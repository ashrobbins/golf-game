import { useEffect, useRef, useState } from 'react'
import type { Course } from '../../content/types'
import type { SimulationResult } from '../../game/simulation/types'
import { Button } from '../ui/Button'
import { shareCanvasImage } from './shareApi'
import type { ShareOutcome } from './shareApi'
import { renderShareCard, SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH } from './shareCardRenderer'
import styles from './ShareCard.module.css'

const OUTCOME_MESSAGE: Record<ShareOutcome, string | null> = {
  shared: null,
  cancelled: null,
  copied: 'Copied to clipboard.',
  downloaded: 'Saved to your device.',
  failed: "Couldn't share — try again.",
}

interface ShareCardProps {
  course: Course
  result: SimulationResult
}

export function ShareCard({ course, result }: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    renderShareCard(ctx, course, result)
  }, [course, result])

  async function handleShare() {
    const canvas = canvasRef.current
    if (!canvas) return
    const shareOutcome = await shareCanvasImage(canvas, {
      title: `${course.name} — Beating Bogey`,
      text: result.isBogeyFreeRound
        ? 'Bogey-free 18!'
        : `Bogey-free through hole ${result.bogeyFreeThroughHole}`,
      fileName: `golf-draft-${course.id}.png`,
    })
    setOutcome(shareOutcome)
  }

  return (
    <div className={styles.wrapper}>
      <canvas
        ref={canvasRef}
        width={SHARE_CARD_WIDTH}
        height={SHARE_CARD_HEIGHT}
        className={styles.canvas}
      />
      <Button variant="secondary" onClick={handleShare}>
        Share result
      </Button>
      {outcome && OUTCOME_MESSAGE[outcome] && <p className={styles.status}>{OUTCOME_MESSAGE[outcome]}</p>}
    </div>
  )
}
