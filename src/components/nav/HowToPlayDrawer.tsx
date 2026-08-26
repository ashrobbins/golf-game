import { ALL_ARCHETYPES } from '../../content/formatArchetype'
import { useHowToPlay } from '../../state/useHowToPlay'
import { ScoreMark } from '../scorecard/ScoreMark'
import { ArchetypeBadge } from '../ui/ArchetypeBadge'
import { Drawer } from '../ui/Drawer'
import styles from './HowToPlayDrawer.module.css'

// The drawer panel itself — rendered exactly once (from App.tsx), reading
// open/closed state from HowToPlayContext so any number of triggers (nav
// icon, home page CTA, ...) can control this one shared instance. The
// shared slide-in shell (backdrop, close button, Escape, scroll lock) lives
// in ui/Drawer.tsx — this component is just the rules content.
export function HowToPlayDrawer() {
  const { isOpen, close } = useHowToPlay()

  return (
    <Drawer isOpen={isOpen} onClose={close} titleId="how-to-play-heading" title="How to Play">
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
    </Drawer>
  )
}
