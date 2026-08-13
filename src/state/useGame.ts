import { useContext } from 'react'
import { GameContext } from './GameContext'
import type { GameContextValue } from './GameContext'

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within a GameProvider')
  return ctx
}
