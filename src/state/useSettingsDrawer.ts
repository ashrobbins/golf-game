import { useContext } from 'react'
import { SettingsContext } from './SettingsContext'
import type { SettingsContextValue } from './SettingsContext'

export function useSettingsDrawer(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettingsDrawer must be used within an OverlayProvider')
  return ctx
}
