import { useContext } from 'react'
import { HowToPlayContext } from './HowToPlayContext'
import type { HowToPlayContextValue } from './HowToPlayContext'

export function useHowToPlay(): HowToPlayContextValue {
  const ctx = useContext(HowToPlayContext)
  if (!ctx) throw new Error('useHowToPlay must be used within a HowToPlayProvider')
  return ctx
}
