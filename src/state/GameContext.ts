import { createContext } from 'react'
import type { Course } from '../content/types'
import type { CountriesContent, CoursesContent, OddsConfig } from '../content/types'
import type { DraftPick } from '../game/draft/types'
import type { SimulationResult } from '../game/simulation/types'

export type View = 'home' | 'course-info' | 'draft' | 'results'

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
  startRound: (courseId: string) => void
  beginDraft: () => void
  finishDraft: (picks: DraftPick[]) => void
  playAgain: () => void
}

export const GameContext = createContext<GameContextValue | null>(null)
