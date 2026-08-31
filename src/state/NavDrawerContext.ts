import { createContext } from 'react'

export interface NavDrawerContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const NavDrawerContext = createContext<NavDrawerContextValue | null>(null)
