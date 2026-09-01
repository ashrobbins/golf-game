import { createContext } from 'react'
import type { Course } from '../content/types'
import type { CountriesContent, CoursesContent, OddsConfig } from '../content/types'
import type { Achievement } from '../game/achievements/deriveAchievements'
import type { DraftPick } from '../game/draft/types'
import type { SimulationResult } from '../game/simulation/types'
import type { RoundRecord } from '../game/stats/types'

export type View = 'home' | 'course-info' | 'draft' | 'results' | 'stats' | 'shared-round' | 'achievements'

interface ContentReady {
  status: 'ready'
  countries: CountriesContent
  courses: CoursesContent
  odds: OddsConfig
}

export type ContentState = { status: 'loading' } | { status: 'error'; error: string } | ContentReady

export interface GameContextValue {
  content: ContentState
  view: View
  course?: Course
  simulationResult?: SimulationResult
  // Set only by the `?simStats` debug shortcut (see GameProvider.tsx) — when
  // present, StatsPage renders these instead of loading real localStorage
  // stats, so the mock data can never pollute a real player's history.
  statsOverride?: RoundRecord[]
  // The code segment of a /round/[code] URL, set when the app boots on that
  // path (see GameProvider.tsx) — SharedRoundPage decodes it itself once
  // content is ready, rather than GameProvider doing the decode.
  sharedRoundCode?: string
  // Whichever achievements this specific round newly unlocked (that weren't
  // already unlocked before it), computed once in finishDraft and cleared
  // by playAgain — powers the results page's NewAchievementCard. Empty for
  // a round reached any other way (shared link, stats history, ?simResults).
  newlyUnlockedAchievements: Achievement[]
  // Set by beginDraft's argument and read by DraftPage — when true, each
  // hole's golfer is chosen automatically (see game/draft/autoPick.ts)
  // instead of waiting for a manual Select/Draft click. Reset by playAgain.
  isAutoPick: boolean
  startRound: (courseId: string) => void
  beginDraft: (autoPick: boolean) => void
  finishDraft: (picks: DraftPick[]) => void
  playAgain: () => void
  viewStats: () => void
  viewAchievements: () => void
}

export const GameContext = createContext<GameContextValue | null>(null)
