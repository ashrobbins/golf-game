import type { SimulationResult } from '../simulation/types'
import type { RoundRecord, StatsStore } from './types'

const STORAGE_KEY = 'beating-bogey:stats'
const CURRENT_VERSION = 1

function emptyStore(): StatsStore {
  return { version: CURRENT_VERSION, rounds: [] }
}

// Private-browsing / storage-disabled environments can throw on almost any
// localStorage access, not just writes. Once that happens we stop touching
// localStorage for the rest of the session and keep everything in this
// in-memory fallback instead, so a broken storage API degrades to
// "stats don't persist across a reload" rather than throwing.
let storageDisabled = false
let memoryStore: StatsStore = emptyStore()

export function loadStats(): StatsStore {
  if (storageDisabled) return memoryStore

  let raw: string | null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    storageDisabled = true
    return memoryStore
  }

  if (!raw) return emptyStore()

  try {
    const parsed = JSON.parse(raw) as StatsStore
    if (parsed.version !== CURRENT_VERSION) {
      console.warn(
        `${STORAGE_KEY} has version ${parsed.version}, expected ${CURRENT_VERSION} — resetting stats`,
      )
      return emptyStore()
    }
    return parsed
  } catch {
    return emptyStore()
  }
}

export function recordRound(result: SimulationResult): RoundRecord {
  const record: RoundRecord = {
    ...result,
    id: crypto.randomUUID(),
    playedAt: new Date().toISOString(),
  }

  const updated: StatsStore = {
    version: CURRENT_VERSION,
    rounds: [...loadStats().rounds, record],
  }

  if (storageDisabled) {
    memoryStore = updated
    return record
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    storageDisabled = true
    memoryStore = updated
  }

  return record
}
