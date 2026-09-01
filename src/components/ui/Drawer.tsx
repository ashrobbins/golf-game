import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeftIcon, CloseIcon } from './icons'
import styles from './Drawer.module.css'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  titleId: string
  title: ReactNode
  children: ReactNode
  // When set, a "← {backLabel}" link replaces the visible heading (the
  // heading itself stays in the DOM, visually hidden, so aria-labelledby
  // keeps pointing at something real either way) — used by drawers that
  // can be reached from the mobile nav menu, so there's a way back to it
  // that isn't "close and re-open the hamburger."
  onBack?: () => void
  backLabel?: string
}

// Generic slide-in-from-left drawer shell — backdrop, panel, header with a
// close button, Escape-to-close, and a background scroll lock while open.
// Extracted from what was originally HowToPlayDrawer's own markup so a
// second drawer (round detail, on the stats page) could reuse the exact
// same shell/animation/interactions instead of re-implementing them.
// No full focus trap (Tab still escapes into the page) — wasn't asked for
// on the original drawer, and adding one blind is easy to get subtly
// wrong; revisit if it's actually needed.
export function Drawer({ isOpen, onClose, titleId, title, children, onBack, backLabel }: DrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    closeRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <button type="button" className={styles.backdrop} aria-label="Close" onClick={onClose} />
      <div className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={styles.header}>
          <h2 id={titleId} className={onBack ? `${styles.heading} ${styles.srOnly}` : styles.heading}>
            {title}
          </h2>
          {onBack && (
            <button type="button" className={styles.back} onClick={onBack}>
              <ChevronLeftIcon className={styles.backIcon} />
              {backLabel ?? 'Back'}
            </button>
          )}
          <button ref={closeRef} type="button" className={styles.close} aria-label="Close" onClick={onClose}>
            <CloseIcon className={styles.closeIcon} />
          </button>
        </div>

        <div className={styles.body}>{children}</div>
      </div>
    </>
  )
}
