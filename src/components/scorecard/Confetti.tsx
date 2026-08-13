import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import styles from './Confetti.module.css'

const COLORS = ['#d4a017', '#2e8b57', '#3b6fd6', '#d1483f', '#8a4fd1']
const PIECE_COUNT = 60

interface ConfettiPiece {
  left: number
  delay: number
  duration: number
  color: string
  rotate: number
  drift: number
}

function randomPiece(): ConfettiPiece {
  return {
    left: Math.random() * 100,
    delay: Math.random() * 1.2,
    duration: 2.6 + Math.random() * 2.2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotate: Math.random() * 360,
    drift: (Math.random() - 0.5) * 140,
  }
}

// Purely decorative, one-shot celebration overlay for a bogey-free round.
// Fixed to the viewport so it reads as a full-screen moment, not a
// contained widget. Respects prefers-reduced-motion via CSS.
export function Confetti() {
  const pieces = useMemo(() => Array.from({ length: PIECE_COUNT }, randomPiece), [])

  return (
    <div className={styles.wrapper} aria-hidden="true">
      {pieces.map((piece, i) => (
        <span
          key={i}
          className={styles.piece}
          style={
            {
              left: `${piece.left}%`,
              backgroundColor: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              '--rotate': `${piece.rotate}deg`,
              '--drift': `${piece.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
