import { useContext } from 'react'
import { NavDrawerContext } from './NavDrawerContext'
import type { NavDrawerContextValue } from './NavDrawerContext'

export function useNavDrawer(): NavDrawerContextValue {
  const ctx = useContext(NavDrawerContext)
  if (!ctx) throw new Error('useNavDrawer must be used within an OverlayProvider')
  return ctx
}
