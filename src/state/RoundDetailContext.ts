import { createContext } from 'react'
import type { RoundRecord } from '../game/stats/types'

export interface RoundDetailContextValue {
  round: RoundRecord | null
  open: (round: RoundRecord) => void
  close: () => void
}

export const RoundDetailContext = createContext<RoundDetailContextValue | null>(null)
