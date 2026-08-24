import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { loadCountries, loadCourses, loadOddsConfig } from '../content/loadContent'
import { MOCK_COURSE_ID, MOCK_SIMULATION_RESULT } from '../content/mockSimulationResult'
import type { Course } from '../content/types'
import { assertWheelHasCapacity } from '../game/draft/engine'
import type { DraftPick } from '../game/draft/types'
import { simulateRound } from '../game/simulation/engine'
import type { SimulationResult } from '../game/simulation/types'
import { recordRound } from '../game/stats/storage'
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

        // Debug-only shortcuts, both using the same hand-crafted, not-
        // simulated mock bag (real golfers, every outcome tier represented)
        // so a full round never has to be played to check something.
        // Never touches real game state beyond this one-time initial jump.
        //  - ?simResults jumps straight to the finished results page
        //    (ResultsPage skips the hole-by-hole reveal entirely).
        //  - ?simReveal jumps to the same mock bag but lands at the START
        //    of the reveal sequence instead, for checking the reveal
        //    animation/pacing itself without redrafting 18 holes first.
        const params = new URLSearchParams(window.location.search)
        if (params.has('simResults') || params.has('simReveal')) {
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
      recordRound(result)
      setView('results')
    },
    [content, course],
  )

  const viewStats = useCallback(() => {
    setView('stats')
  }, [])

  const playAgain = useCallback(() => {
    setCourse(undefined)
    setSimulationResult(undefined)
    setView('home')

    // Drop the debug shortcut params so leaving the mock results page
    // doesn't leave the URL pointing somewhere that'd re-trigger them on
    // refresh/share.
    const params = new URLSearchParams(window.location.search)
    if (params.has('simResults') || params.has('simReveal')) {
      const url = new URL(window.location.href)
      url.searchParams.delete('simResults')
      url.searchParams.delete('simReveal')
      window.history.replaceState({}, '', url)
    }
  }, [])

  const value = useMemo<GameContextValue>(
    () => ({
      content,
      view,
      course,
      simulationResult,
      startRound,
      beginDraft,
      finishDraft,
      playAgain,
      viewStats,
    }),
    [content, view, course, simulationResult, startRound, beginDraft, finishDraft, playAgain, viewStats],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
