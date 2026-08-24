import { createContext } from 'react'

export interface HowToPlayContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const HowToPlayContext = createContext<HowToPlayContextValue | null>(null)
