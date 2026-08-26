import { useContext } from 'react'
import { RoundDetailContext } from './RoundDetailContext'
import type { RoundDetailContextValue } from './RoundDetailContext'

export function useRoundDetail(): RoundDetailContextValue {
  const ctx = useContext(RoundDetailContext)
  if (!ctx) throw new Error('useRoundDetail must be used within a RoundDetailProvider')
  return ctx
}
