import { useEffect, useRef, useState } from 'react'
import { ALL_ARCHETYPES } from '../../content/formatArchetype'
import { ScoreMark } from '../scorecard/ScoreMark'
import { ArchetypeBadge } from '../ui/ArchetypeBadge'
import { CloseIcon } from '../ui/icons'
import styles from './HowToPlayDrawer.module.css'

// Self-contained, same pattern as ThemeToggle — owns its own open/closed
// state rather than lifting it up to NavBar, since nothing else needs to
// know whether the drawer is open.
export function HowToPlayDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  function close() {
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  // Escape-to-close and a background scroll lock while open. No full focus
  // trap (Tab still escapes into the page) — wasn't asked for, and adding
  // one blind is easy to get subtly wrong; revisit if it's actually needed.
  useEffect(() => {
    if (!isOpen) return

    closeRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label="How to play"
        onClick={() => setIsOpen(true)}
      >
        ?
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close"
            onClick={close}
          />
          <div className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="how-to-play-heading">
            <div className={styles.header}>
              <h2 id="how-to-play-heading" className={styles.heading}>
                How to Play
              </h2>
              <button ref={closeRef} type="button" className={styles.close} aria-label="Close" onClick={close}>
                <CloseIcon className={styles.closeIcon} />
              </button>
            </div>

            <div className={styles.body}>
              <div className={styles.section}>
                <p className={styles.sectionTitle}>The goal</p>
                <p className={styles.sectionText}>
                  Play all 18 holes without a single bogey. Every hole you survive keeps your streak alive — one
                  bogey anywhere ends it.
                </p>
              </div>

              <div className={styles.section}>
                <p className={styles.sectionTitle}>Draft your bag</p>
                <p className={styles.sectionText}>
                  Before you play, you draft one real golfer for each of the 18 holes. Spin the wheel to draw a
                  country, then pick one of three golfers offered from that country.</p>
                <p></p>
                <p className={styles.sectionText}>Each golfer suits certain hole types
                  better than others — watch a hole's archetype and try to match it to the player's archetype.
                </p>
              </div>

              <div className={styles.section}>
                <p className={styles.sectionTitle}>Archetypes</p>
                <p className={styles.sectionText}>
                  Every hole and every player has an archetype. For holes, this indicates the type of player that is best suited to making par. For players, it indicates their primary skill. Your job when creating your bag is to assign a player to a hole with a matching archetype.</p>
                <p></p>
                <ul className={styles.archetypeList}>
                  {ALL_ARCHETYPES.map((tag) => (
                    <li key={tag}>
                      <ArchetypeBadge tag={tag} />
                    </li>
                  ))}
                </ul>
                <p></p>
                <p className={styles.sectionText}>
                  If there's no match, pick a player archetype that closely aligns with the hole, for example if the hole requires a <ArchetypeBadge tag="long_hitter" />, you might choose a player with <ArchetypeBadge tag="precision_iron" />.
                </p>
                <p></p>
                <p className={styles.sectionText}>
                  <span className={styles.legendText}>Legends</span> are highlighted in gold. If you select a legend for a hole and they have a matching archetype, they have the highest chance of making par.
                </p>
                <p></p>
                <p className={styles.sectionText}>
                  <b>Par is never guaranteed,</b> you're trying to give yourself the best chance of avoiding a bogey.
                </p>
              </div>

              <div className={styles.section}>
                <p className={styles.sectionTitle}>Play your round</p>
                <p className={styles.sectionText}>
                  Once your bag is set, the game simulates your round one hole at a time. A golfer whose archetype fits the hole,
                  and who's a higher skill tier, gets better odds — but as mentioned, every hole always carries some risk of a
                  bogey, even for a legend on their best hole.
                </p>
              </div>

              <div className={styles.section}>
                <p className={styles.sectionTitle}>The scorecard</p>
                <p className={styles.sectionText}>Standard golf scorecard notation is used throughout the app:</p>
                <div className={styles.markRow}>
                  <span className={styles.markItem}>
                    <ScoreMark gross={3} tier="birdie" /> Birdie
                  </span>
                  <span className={styles.markItem}>
                    <ScoreMark gross={3} tier="eagle" /> Eagle
                  </span>
                  <span className={styles.markItem}>
                    <ScoreMark gross={5} tier="bogey_plus" /> Bogey+
                  </span>
                  <span className={styles.markItem}>
                    <ScoreMark gross={1} tier="hole_in_one" /> HIO
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
