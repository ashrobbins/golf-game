import { useMemo, useState } from 'react'
import { AchievementCard } from '../components/achievements/AchievementCard'
import { COUNTRY_SWEEP_ID_PREFIX, deriveAchievements } from '../game/achievements/deriveAchievements'
import type { AchievementSection } from '../game/achievements/deriveAchievements'
import { loadStats } from '../game/stats/storage'
import { useGame } from '../state/useGame'
import styles from './AchievementsPage.module.css'

// One tab per AchievementSection, in tab-bar order — the label here is
// the short tab text; the fuller name still written above each section's
// own list lives inline in the JSX below, right next to its AchievementCard.
const TABS: Array<{ section: AchievementSection; label: string }> = [
  { section: 'career', label: 'Career' },
  { section: 'iconic', label: 'Iconic' },
  { section: 'course', label: 'Course' },
  { section: 'season', label: 'Seasons' },
]

// Split out of the flat career list the same way COUNTRY_SWEEP_ID_PREFIX
// is, for the same reason — 7 "birdie on home soil" achievements would
// otherwise drown in the same list as the dozen-or-so plain milestones.
const HOME_TOWN_HEROES_ID_PREFIX = 'home-town-heroes-'

type ActiveTab = 'all' | AchievementSection

export function AchievementsPage() {
  const { content, statsOverride } = useGame()
  const [stats] = useState(() => loadStats())
  const [activeTab, setActiveTab] = useState<ActiveTab>('all')
  const rounds = statsOverride ?? stats.rounds

  const achievements = useMemo(() => {
    if (content.status !== 'ready') return []
    return deriveAchievements(rounds, content.courses.courses, content.countries)
  }, [content, rounds])

  if (content.status !== 'ready') return null

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length
  const courseAchievements = achievements.filter((a) => a.section === 'course')
  const careerAchievements = achievements.filter((a) => a.section === 'career')
  const careerMilestones = careerAchievements.filter(
    (a) => !a.id.startsWith(COUNTRY_SWEEP_ID_PREFIX) && !a.id.startsWith(HOME_TOWN_HEROES_ID_PREFIX),
  )
  const countrySweepAchievements = careerAchievements.filter((a) =>
    a.id.startsWith(COUNTRY_SWEEP_ID_PREFIX),
  )
  const homeTownHeroesAchievements = careerAchievements.filter((a) =>
    a.id.startsWith(HOME_TOWN_HEROES_ID_PREFIX),
  )
  const iconicAchievements = achievements.filter((a) => a.section === 'iconic')
  const seasonAchievements = achievements.filter((a) => a.section === 'season')

  const showsSection = (section: AchievementSection) => activeTab === 'all' || activeTab === section

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Achievements</h1>
      <p className={styles.subtitle}>Milestones from every round you've played.</p>
      <p className={styles.progress}>
        <strong>{unlockedCount}</strong> of <strong>{achievements.length}</strong> complete
      </p>

      <div className={styles.tabBar}>
        <button
          type="button"
          className={activeTab === 'all' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
        <div className={styles.tabDivider} />
        <div className={styles.tabScroll}>
          {TABS.map((tab) => {
            const sectionAchievements = achievements.filter((a) => a.section === tab.section)
            const sectionUnlocked = sectionAchievements.filter((a) => a.isUnlocked).length
            return (
              <button
                key={tab.section}
                type="button"
                className={activeTab === tab.section ? `${styles.tab} ${styles.tabActive}` : styles.tab}
                onClick={() => setActiveTab(tab.section)}
              >
                {tab.label}{' '}
                <span className={styles.tabCount}>
                  {sectionUnlocked}/{sectionAchievements.length}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {showsSection('career') && (
        <>
          <p className={styles.sectionLabel}>Career milestones</p>
          <AchievementCard achievements={careerMilestones} />
          <p className={styles.sectionLabel}>Country Sweeps</p>
          <AchievementCard achievements={countrySweepAchievements} />
          <p className={styles.sectionLabel}>Home Town Heroes</p>
          <AchievementCard achievements={homeTownHeroesAchievements} />
        </>
      )}

      {showsSection('iconic') && (
        <>
          <p className={styles.sectionLabel}>Iconic moments</p>
          <AchievementCard achievements={iconicAchievements} />
        </>
      )}

      {showsSection('course') && (
        <>
          <p className={styles.sectionLabel}>By Course</p>
          <AchievementCard achievements={courseAchievements} />
        </>
      )}

      {showsSection('season') && (
        <>
          <p className={styles.sectionLabel}>Seasons</p>
          <AchievementCard achievements={seasonAchievements} />
        </>
      )}

      <p className={styles.localNote}>
        Achievements are based on your stats. Stats are stored locally on this device, so they
        won't carry over to another device or browser, and will disappear if you clear your
        browsing data or use a private/incognito window.
      </p>
    </div>
  )
}
