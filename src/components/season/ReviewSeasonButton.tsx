import type { MouseEventHandler } from 'react'
import styles from './ReviewSeasonButton.module.css'

interface ReviewSeasonButtonProps {
  variant: 'button' | 'chip'
  onClick: MouseEventHandler<HTMLButtonElement>
}

// The "open the Season Review" trigger — used from both the results page's
// final-round CTA row ('button') and each completed Seasons History card
// ('chip'). Deliberately its own visual identity (indigo -> pink, not the
// app's primary/secondary Button styles, and not Instagram's own orange-
// through-pink ring) so it reads as "this is the one special thing you can
// do here" without being mistaken for a borrowed Stories affordance.
export function ReviewSeasonButton({ variant, onClick }: ReviewSeasonButtonProps) {
  const className = variant === 'button' ? styles.button : styles.chip
  return (
    <button type="button" className={className} onClick={onClick}>
      Review Season
    </button>
  )
}
