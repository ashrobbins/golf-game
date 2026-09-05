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

export function exportStats(): StatsStore {
  return loadStats()
}

function isValidRoundRecord(value: unknown): value is RoundRecord {
  if (typeof value !== 'object' || value === null) return false
  const r = value as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    typeof r.playedAt === 'string' &&
    typeof r.courseId === 'string' &&
    Array.isArray(r.holeResults) &&
    typeof r.totalStrokesToPar === 'number' &&
    typeof r.bogeyFreeThroughHole === 'number' &&
    typeof r.isBogeyFreeRound === 'boolean' &&
    (r.seasonId === undefined || typeof r.seasonId === 'string') &&
    (r.seasonRoundNumber === undefined || typeof r.seasonRoundNumber === 'number') &&
    (r.isMajor === undefined || typeof r.isMajor === 'boolean')
  )
}

// Replaces (not merges with) whatever is currently stored — this is meant for
// restoring a backup onto a fresh install, e.g. after iOS wipes a home-screen
// web app's storage when its icon is removed and re-added.
export function importStats(data: unknown): StatsStore {
  if (typeof data !== 'object' || data === null) {
    throw new Error('That file doesn\'t look like a Beating Bogey backup.')
  }
  const candidate = data as Record<string, unknown>
  if (candidate.version !== CURRENT_VERSION || !Array.isArray(candidate.rounds)) {
    throw new Error('That file doesn\'t look like a Beating Bogey backup.')
  }
  if (!candidate.rounds.every(isValidRoundRecord)) {
    throw new Error('That backup file is corrupted or from an incompatible version.')
  }

  const store: StatsStore = { version: CURRENT_VERSION, rounds: candidate.rounds }

  if (storageDisabled) {
    memoryStore = store
    return store
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    storageDisabled = true
    memoryStore = store
  }

  return store
}

export function recordRound(
  result: SimulationResult,
  seasonTag?: { seasonId: string; seasonRoundNumber: number; isMajor: boolean },
): RoundRecord {
  const record: RoundRecord = {
    ...result,
    id: crypto.randomUUID(),
    playedAt: new Date().toISOString(),
    ...seasonTag,
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
