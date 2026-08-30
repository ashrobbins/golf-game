import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { CountriesContent, CoursesContent, OddsConfig } from '../../content/types'
import type { DraftPick } from '../draft/types'
import { simulateRound } from '../simulation/engine'
import { mulberry32 } from '../rng'
import { decodeRoundCode, encodeRoundCode } from './roundCode'

function loadFixture<T>(path: string): T {
  return JSON.parse(readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8'))
}

const countries: CountriesContent = loadFixture('../../../public/content/countries.json')
const courses: CoursesContent = loadFixture('../../../public/content/courses.json')
const odds: OddsConfig = loadFixture('../../../public/content/odds-config.json')

function realPicksFor(courseId: string): DraftPick[] {
  const course = courses.courses.find((c) => c.id === courseId)!
  const golfers = countries.countries.flatMap((c) => c.golfers.map((g) => ({ ...g, countryId: c.id })))
  return course.holes.map((hole, i) => ({
    holeNumber: hole.number,
    countryId: golfers[i].countryId,
    golferId: golfers[i].id,
  }))
}

describe('encodeRoundCode / decodeRoundCode', () => {
  it('round-trips a real simulated round exactly', () => {
    const course = courses.courses.find((c) => c.id === 'augusta-national')!
    const picks = realPicksFor('augusta-national')
    const result = simulateRound(picks, course, countries, odds, mulberry32(42))

    const code = encodeRoundCode(result.courseId, result.holeResults)
    const decoded = decodeRoundCode(code, countries, courses)

    expect(decoded).toEqual(result)
  })

  it('round-trips every real course, not just the first', () => {
    for (const course of courses.courses) {
      const picks = realPicksFor(course.id)
      const result = simulateRound(picks, course, countries, odds, mulberry32(7))
      const code = encodeRoundCode(result.courseId, result.holeResults)
      expect(decodeRoundCode(code, countries, courses)).toEqual(result)
    }
  })

  it('produces a URL-safe code with no padding characters', () => {
    const course = courses.courses[0]
    const picks = realPicksFor(course.id)
    const result = simulateRound(picks, course, countries, odds, mulberry32(1))
    const code = encodeRoundCode(result.courseId, result.holeResults)
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('returns null for garbage input rather than throwing', () => {
    expect(decodeRoundCode('not-a-real-code', countries, courses)).toBeNull()
    expect(decodeRoundCode('', countries, courses)).toBeNull()
    expect(decodeRoundCode('!!!not-base64url!!!', countries, courses)).toBeNull()
  })

  it('returns null when the payload length is wrong (truncated/tampered code)', () => {
    const course = courses.courses[0]
    const picks = realPicksFor(course.id)
    const result = simulateRound(picks, course, countries, odds, mulberry32(1))
    const code = encodeRoundCode(result.courseId, result.holeResults)
    expect(decodeRoundCode(code.slice(0, 10), countries, courses)).toBeNull()
  })

  it('throws when asked to encode a course/golfer outside the registry', () => {
    const course = courses.courses[0]
    const picks = realPicksFor(course.id)
    const result = simulateRound(picks, course, countries, odds, mulberry32(1))
    expect(() => encodeRoundCode('not-a-real-course', result.holeResults)).toThrow()
  })
})
