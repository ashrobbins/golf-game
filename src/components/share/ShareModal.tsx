import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { toBlob } from 'html-to-image'
import type { CountriesContent, Course } from '../../content/types'
import type { Achievement } from '../../game/achievements/deriveAchievements'
import { buildShareText, buildShareUrl } from '../../game/share/shareText'
import { formatRelativeScore } from '../../game/simulation/formatTier'
import type { SimulationResult } from '../../game/simulation/types'
import { CloseIcon, ImageIcon, LinkIcon } from '../ui/icons'
import { ShareCard } from './ShareCard'
import styles from './ShareModal.module.css'

// ShareCard's own fixed, unscaled width (see ShareCard.module.css) — the
// divisor for turning a measured container width into a zoom factor below.
const SHARE_CARD_WIDTH = 400

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  course: Course
  countries: CountriesContent
  result: SimulationResult
  newlyUnlockedAchievements?: Achievement[]
}

const PIXEL_RATIO = 2.5
type CopyState = 'idle' | 'copied'

function truncateForDisplay(url: string): string {
  return url.length > 40 ? `${url.slice(0, 38)}…` : url
}

export function ShareModal({
  isOpen,
  onClose,
  course,
  countries,
  result,
  newlyUnlockedAchievements,
}: ShareModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const captureRef = useRef<HTMLDivElement>(null)
  const thumbWrapRef = useRef<HTMLDivElement>(null)
  const [imageCopyState, setImageCopyState] = useState<CopyState>('idle')
  const [linkCopyState, setLinkCopyState] = useState<CopyState>('idle')
  // Zoom factor that fills the thumbnail to the modal's actual (responsive)
  // width instead of a fixed 0.4 — measured live so it always fills the
  // container regardless of viewport size, rather than leaving a gap or
  // looking squished on narrow phones.
  const [thumbScale, setThumbScale] = useState(0.4)

  useLayoutEffect(() => {
    if (!isOpen) return
    const wrap = thumbWrapRef.current
    if (!wrap) return

    function updateScale() {
      if (!wrap) return
      setThumbScale(wrap.clientWidth / SHARE_CARD_WIDTH)
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [isOpen])

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

  const shareUrl = buildShareUrl(result, window.location.origin)
  const shareText = buildShareText(course.name, result, shareUrl)

  function downloadCapturedImage() {
    if (!captureRef.current) return
    toBlob(captureRef.current, { pixelRatio: PIXEL_RATIO }).then((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `beating-bogey-${course.id}.png`
      link.click()
      URL.revokeObjectURL(url)
    })
  }

  async function handleCopyImage() {
    if (!captureRef.current) return

    // Passing a Promise<Blob> (rather than awaiting first) keeps this
    // inside the click's user-activation window even though generation is
    // async — some browsers (Safari especially) refuse a clipboard write
    // that happens "too late" after the click that triggered it otherwise.
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      try {
        const blobPromise = toBlob(captureRef.current, { pixelRatio: PIXEL_RATIO }).then(
          (blob) => blob ?? Promise.reject(new Error('Image generation failed')),
        )
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })])
        setImageCopyState('copied')
        setTimeout(() => setImageCopyState('idle'), 1500)
        return
      } catch {
        // Fall through to the download fallback below — most likely cause
        // is a browser that doesn't support clipboard image writes at all
        // (older Firefox) rather than anything the user did wrong.
      }
    }
    downloadCapturedImage()
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareText)
    } catch {
      // Nothing better to fall back to for text — clipboard access being
      // blocked here would be unusual (no image-specific caveats apply),
      // so this is left as a silent no-op rather than guessing at a fix.
    }
    setLinkCopyState('copied')
    setTimeout(() => setLinkCopyState('idle'), 1500)
  }

  return (
    <>
      <button type="button" className={styles.backdrop} aria-label="Close" onClick={onClose} />
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="share-modal-heading">
        <div className={styles.header}>
          <div>
            <h2 id="share-modal-heading" className={styles.heading}>
              Share your round
            </h2>
            <p className={styles.subtext}>
              {course.name} · {formatRelativeScore(result.totalStrokesToPar)}
            </p>
          </div>
          <button ref={closeRef} type="button" className={styles.close} aria-label="Close" onClick={onClose}>
            <CloseIcon className={styles.closeIcon} />
          </button>
        </div>

        <div className={styles.thumbWrap} ref={thumbWrapRef}>
          <div className={styles.thumb}>
            <div className={styles.thumbInner} style={{ zoom: thumbScale }}>
              <ShareCard
                course={course}
                countries={countries}
                result={result}
                shareUrlDisplay={truncateForDisplay(shareUrl)}
                newlyUnlockedAchievements={newlyUnlockedAchievements}
              />
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={imageCopyState === 'copied' ? `${styles.btn} ${styles.secondary} ${styles.copied}` : `${styles.btn} ${styles.secondary}`}
            onClick={handleCopyImage}
          >
            <ImageIcon className={styles.btnIcon} />
            <span>{imageCopyState === 'copied' ? 'Copied!' : 'Copy image'}</span>
          </button>
          <button
            type="button"
            className={linkCopyState === 'copied' ? `${styles.btn} ${styles.primary} ${styles.copied}` : `${styles.btn} ${styles.primary}`}
            onClick={handleCopyLink}
          >
            <LinkIcon className={styles.btnIcon} />
            <span>{linkCopyState === 'copied' ? 'Copied!' : 'Copy link'}</span>
          </button>
        </div>
      </div>

      {/* Off-screen, full natural size — what actually gets captured.
          Not display:none/visibility:hidden, both of which would make
          html-to-image measure it as zero-size; pushed off the viewport
          instead so it still lays out and paints normally. */}
      <div className={styles.offscreen} aria-hidden>
        <ShareCard
          ref={captureRef}
          course={course}
          countries={countries}
          result={result}
          shareUrlDisplay={truncateForDisplay(shareUrl)}
          newlyUnlockedAchievements={newlyUnlockedAchievements}
        />
      </div>
    </>
  )
}
