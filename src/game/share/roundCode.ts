import type { CountriesContent, CoursesContent, OutcomeTier } from '../../content/types'
import { COURSE_REGISTRY, GOLFER_REGISTRY } from '../../content/shareRegistry'
import { relativeScoreFor, deriveRoundSummary } from '../simulation/engine'
import type { HoleResult, SimulationResult } from '../simulation/types'

// Encodes an entire round into a compact, self-contained code that decodes
// back into a full SimulationResult with no server lookup — the app has no
// backend, so a shared /round/[code] link has to carry its own data. Only
// the course + each hole's golfer/outcome/archetype-fit get stored;
// everything else (countryId, relativeScore, totals) is cheap to
// recompute from those on decode, same as the real engine already does.
//
// Layout: 1 byte course index, then 2 bytes per hole (18 holes) —
// golferIndex (12 bits) | tierCode (3 bits) | archetypeMatched (1 bit) —
// base64url-encoded. See shareRegistry.ts for why the golfer/course
// indexes have to stay stable forever.
const TOTAL_HOLES = 18
const PAYLOAD_BYTES = 1 + TOTAL_HOLES * 2

// Fixed forever, same reason as the registries — a tier's code is baked
// into every already-generated link.
const TIER_CODES: Record<OutcomeTier, number> = {
  hole_in_one: 0,
  eagle: 1,
  birdie: 2,
  par: 3,
  bogey_plus: 4,
}
const TIER_BY_CODE: OutcomeTier[] = ['hole_in_one', 'eagle', 'birdie', 'par', 'bogey_plus']

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(code: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(code)) return null
  const base64 = code.replace(/-/g, '+').replace(/_/g, '/')
  try {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  } catch {
    return null
  }
}

export function encodeRoundCode(courseId: string, holeResults: HoleResult[]): string {
  const courseIndex = COURSE_REGISTRY.indexOf(courseId)
  if (courseIndex === -1) {
    throw new Error(`Course ${courseId} is not in COURSE_REGISTRY — add it before sharing`)
  }
  if (holeResults.length !== TOTAL_HOLES) {
    throw new Error(`Expected ${TOTAL_HOLES} hole results, got ${holeResults.length}`)
  }

  const sorted = [...holeResults].sort((a, b) => a.holeNumber - b.holeNumber)
  const bytes = new Uint8Array(PAYLOAD_BYTES)
  bytes[0] = courseIndex

  sorted.forEach((hole, i) => {
    const golferIndex = GOLFER_REGISTRY.indexOf(hole.golferId)
    if (golferIndex === -1) {
      throw new Error(`Golfer ${hole.golferId} is not in GOLFER_REGISTRY — add it before sharing`)
    }
    const value = (golferIndex << 4) | (TIER_CODES[hole.outcomeTier] << 1) | (hole.archetypeMatched ? 1 : 0)
    bytes[1 + i * 2] = (value >> 8) & 0xff
    bytes[1 + i * 2 + 1] = value & 0xff
  })

  return bytesToBase64Url(bytes)
}

// Returns null for any malformed/corrupted code rather than throwing —
// this always runs against untrusted input (a URL someone could hand-edit
// or a stale link to since-removed content), so the caller (SharedRoundPage)
// just needs a clean yes/no to decide whether to show a "link's no good"
// state.
export function decodeRoundCode(
  code: string,
  content: CountriesContent,
  courses: CoursesContent,
): SimulationResult | null {
  const bytes = base64UrlToBytes(code)
  if (!bytes || bytes.length !== PAYLOAD_BYTES) return null

  const courseId = COURSE_REGISTRY[bytes[0]]
  if (!courseId) return null
  const course = courses.courses.find((c) => c.id === courseId)
  if (!course || course.holes.length !== TOTAL_HOLES) return null

  const golferCountry = new Map<string, string>()
  for (const country of content.countries) {
    for (const golfer of country.golfers) golferCountry.set(golfer.id, country.id)
  }

  const holeResults: HoleResult[] = []
  for (let i = 0; i < TOTAL_HOLES; i++) {
    const value = (bytes[1 + i * 2] << 8) | bytes[1 + i * 2 + 1]
    const golferId = GOLFER_REGISTRY[value >> 4]
    const outcomeTier = TIER_BY_CODE[(value >> 1) & 0b111]
    const archetypeMatched = (value & 1) === 1
    const countryId = golferId ? golferCountry.get(golferId) : undefined
    const hole = course.holes[i]
    if (!golferId || !outcomeTier || !countryId || !hole) return null

    holeResults.push({
      holeNumber: hole.number,
      golferId,
      countryId,
      outcomeTier,
      archetypeMatched,
      relativeScore: relativeScoreFor(outcomeTier, hole.par),
    })
  }

  return { ...deriveRoundSummary(courseId, holeResults), holeResults }
}
