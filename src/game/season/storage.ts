import type { Course } from '../../content/types'
import type { ActiveSeason, CompletedSeason, SeasonRoundResult, SeasonScheduleEntry, SeasonsStore } from './types'

const ACTIVE_KEY = 'beating-bogey:season'
const ARCHIVE_KEY = 'beating-bogey:seasons'
const CURRENT_VERSION = 1
export const TOTAL_ROUNDS = 16

// Fixed schedule positions — matches the mockup's major placement, not
// courses.json's own order. Pinehurst No. 2 is deliberately last: it's the
// newest/least-established major of the four, closing out the season.
const MAJOR_ROUND_NUMBERS = [4, 8, 12, 16]
export const MAJOR_COURSE_IDS = ['augusta-national', 'royal-birkdale', 'pebble-beach', 'pinehurst-no-2']

// Private-browsing / storage-disabled environments can throw on almost any
// localStorage access, not just writes — same guard pattern as
// game/stats/storage.ts, since season progress is written from
// GameProvider.finishDraft, not from a component.
let storageDisabled = false
let memoryActive: ActiveSeason | null = null
let memoryArchive: CompletedSeason[] = []

function emptyArchiveStore(): SeasonsStore {
  return { version: CURRENT_VERSION, seasons: [] }
}

// Pure — builds the 16-round schedule from whatever real courses currently
// exist. Majors go in their fixed positions; the remaining 12 slots are
// filled, in order, by every course that isn't a major, so this stays
// correct without change if courses.json's own order or length ever shifts
// (as long as there are still exactly 4 majors + 12 others).
export function buildSchedule(courses: Course[]): SeasonScheduleEntry[] {
  const regularCourseIds = courses.map((c) => c.id).filter((id) => !MAJOR_COURSE_IDS.includes(id))

  const schedule: SeasonScheduleEntry[] = []
  let regularIndex = 0
  for (let round = 1; round <= TOTAL_ROUNDS; round++) {
    const majorPosition = MAJOR_ROUND_NUMBERS.indexOf(round)
    if (majorPosition !== -1) {
      schedule.push({ roundNumber: round, courseId: MAJOR_COURSE_IDS[majorPosition], isMajor: true })
    } else {
      schedule.push({ roundNumber: round, courseId: regularCourseIds[regularIndex], isMajor: false })
      regularIndex++
    }
  }
  return schedule
}

export function createSeason(archive: CompletedSeason[], courses: Course[]): ActiveSeason {
  return {
    id: crypto.randomUUID(),
    seasonNumber: archive.length + 1,
    startedAt: new Date().toISOString(),
    schedule: buildSchedule(courses),
    results: [],
  }
}

export function recordSeasonRoundResult(season: ActiveSeason, result: SeasonRoundResult): ActiveSeason {
  return { ...season, results: [...season.results, result] }
}

export function isSeasonComplete(season: ActiveSeason): boolean {
  return season.results.length >= season.schedule.length
}

export function loadActiveSeason(): ActiveSeason | null {
  if (storageDisabled) return memoryActive

  let raw: string | null
  try {
    raw = window.localStorage.getItem(ACTIVE_KEY)
  } catch {
    storageDisabled = true
    return memoryActive
  }

  if (!raw) return null

  try {
    return JSON.parse(raw) as ActiveSeason
  } catch {
    return null
  }
}

export function saveActiveSeason(season: ActiveSeason): void {
  if (storageDisabled) {
    memoryActive = season
    return
  }
  try {
    window.localStorage.setItem(ACTIVE_KEY, JSON.stringify(season))
  } catch {
    storageDisabled = true
    memoryActive = season
  }
}

export function clearActiveSeason(): void {
  memoryActive = null
  if (storageDisabled) return
  try {
    window.localStorage.removeItem(ACTIVE_KEY)
  } catch {
    storageDisabled = true
  }
}

export function loadSeasonArchive(): CompletedSeason[] {
  if (storageDisabled) return memoryArchive

  let raw: string | null
  try {
    raw = window.localStorage.getItem(ARCHIVE_KEY)
  } catch {
    storageDisabled = true
    return memoryArchive
  }

  if (!raw) return emptyArchiveStore().seasons

  try {
    const parsed = JSON.parse(raw) as SeasonsStore
    if (parsed.version !== CURRENT_VERSION) return emptyArchiveStore().seasons
    return parsed.seasons
  } catch {
    return emptyArchiveStore().seasons
  }
}

// Appends the completed season to the archive and clears the active-season
// slot — a season is always either active or archived, never both.
export function archiveSeason(season: CompletedSeason): void {
  const updated = [...loadSeasonArchive(), season]
  clearActiveSeason()

  if (storageDisabled) {
    memoryArchive = updated
    return
  }
  try {
    window.localStorage.setItem(ARCHIVE_KEY, JSON.stringify({ version: CURRENT_VERSION, seasons: updated }))
  } catch {
    storageDisabled = true
    memoryArchive = updated
  }
}
