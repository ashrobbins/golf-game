import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { loadCountries, loadCourses, loadOddsConfig } from '../content/loadContent'
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
  }, [])

  const value = useMemo<GameContextValue>(
    () => ({ content, view, course, simulationResult, startRound, beginDraft, finishDraft, playAgain }),
    [content, view, course, simulationResult, startRound, beginDraft, finishDraft, playAgain],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
