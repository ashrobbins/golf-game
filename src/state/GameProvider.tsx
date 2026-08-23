import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { loadCountries, loadCourses, loadOddsConfig } from '../content/loadContent'
import { MOCK_COURSE_ID, MOCK_SIMULATION_RESULT } from '../content/mockSimulationResult'
import type { Course } from '../content/types'
import { assertWheelHasCapacity } from '../game/draft/engine'
import type { DraftPick } from '../game/draft/types'
import { simulateRound } from '../game/simulation/engine'
import type { SimulationResult } from '../game/simulation/types'
import { GameContext } from './GameContext'
import type { ContentState, GameContextValue, View } from './GameContext'

export function GameProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ContentState>({ status: 'loading' })
  const [view, setView] = useState<View>('home')
  const [course, setCourse] = useState<Course | undefined>()
  const [simulationResult, setSimulationResult] = useState<SimulationResult | undefined>()

  useEffect(() => {
    let cancelled = false
    Promise.all([loadCountries(), loadCourses(), loadOddsConfig()])
      .then(([countries, courses, odds]) => {
        if (cancelled) return
        assertWheelHasCapacity(countries)
        setContent({ status: 'ready', countries, courses, odds })

        // Debug-only shortcut (?simResults) — jumps straight to the results
        // page with hand-crafted, not-simulated data so every outcome tier
        // can be checked without playing a full round. Never touches real
        // game state beyond this one-time initial jump.
        if (new URLSearchParams(window.location.search).has('simResults')) {
          const mockCourse = courses.courses.find((c) => c.id === MOCK_COURSE_ID)
          if (mockCourse) {
            setCourse(mockCourse)
            setSimulationResult(MOCK_SIMULATION_RESULT)
            setView('results')
          }
        }
      })
      .catch((err: Error) => {
        if (cancelled) return
        setContent({ status: 'error', error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const startRound = useCallback(
    (courseId: string) => {
      if (content.status !== 'ready') return
      const selected = content.courses.courses.find((c) => c.id === courseId)
      if (!selected) return
      setCourse(selected)
      setSimulationResult(undefined)
      setView('course-info')
    },
    [content],
  )

  const beginDraft = useCallback(() => {
    setView('draft')
  }, [])

  const finishDraft = useCallback(
    (picks: DraftPick[]) => {
      if (content.status !== 'ready' || !course) return
      const result = simulateRound(picks, course, content.countries, content.odds)
      setSimulationResult(result)
      setView('results')
    },
    [content, course],
  )

  const playAgain = useCallback(() => {
    setCourse(undefined)
    setSimulationResult(undefined)
    setView('home')

    // Drop ?simResults so leaving the mock results page doesn't leave the
    // URL pointing somewhere that'd re-trigger it on refresh/share.
    if (new URLSearchParams(window.location.search).has('simResults')) {
      const url = new URL(window.location.href)
      url.searchParams.delete('simResults')
      window.history.replaceState({}, '', url)
    }
  }, [])

  const value = useMemo<GameContextValue>(
    () => ({ content, view, course, simulationResult, startRound, beginDraft, finishDraft, playAgain }),
    [content, view, course, simulationResult, startRound, beginDraft, finishDraft, playAgain],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
