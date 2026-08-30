import { describe, expect, it } from 'vitest'
import type { CountriesContent, OutcomeTier } from '../../content/types'
import type { HoleResult } from '../simulation/types'
import { findTopPerformer } from './topPerformer'

function hole(holeNumber: number, golferId: string, outcomeTier: OutcomeTier): HoleResult {
  return { holeNumber, golferId, countryId: 'country', outcomeTier, archetypeMatched: true, relativeScore: 0 }
}

function content(golfers: { id: string; skill?: 'legend' | 'elite' | 'solid' | 'journeyman' }[]): CountriesContent {
  return {
    version: 1,
    countries: [
      {
        id: 'country',
        name: 'Country',
        isoCode: 'XX',
        golfers: golfers.map((g) => ({ id: g.id, name: g.id, archetypes: ['closer'], skill: g.skill })),
      },
    ],
  }
}

describe('findTopPerformer', () => {
  it('returns null for an empty round', () => {
    expect(findTopPerformer('course', [], content([]))).toBeNull()
  })

  it('a hole-in-one always wins, regardless of other tiers present', () => {
    const holes = [hole(1, 'a', 'eagle'), hole(2, 'b', 'hole_in_one'), hole(3, 'c', 'birdie')]
    const result = findTopPerformer('course', holes, content([{ id: 'a' }, { id: 'b' }, { id: 'c' }]))
    expect(result?.hole.holeNumber).toBe(2)
    expect(result?.isHighlight).toBe(true)
  })

  it('falls back to eagle when there is no hole-in-one, preferring a legend eagle over an earlier non-legend one', () => {
    const holes = [hole(1, 'nonlegend', 'eagle'), hole(5, 'legend', 'eagle')]
    const result = findTopPerformer(
      'course',
      holes,
      content([{ id: 'nonlegend', skill: 'solid' }, { id: 'legend', skill: 'legend' }]),
    )
    expect(result?.hole.golferId).toBe('legend')
    expect(result?.isHighlight).toBe(true)
  })

  it('falls back to the first eagle when no eagle is by a legend', () => {
    const holes = [hole(3, 'a', 'eagle'), hole(9, 'b', 'eagle')]
    const result = findTopPerformer(
      'course',
      holes,
      content([{ id: 'a', skill: 'solid' }, { id: 'b', skill: 'elite' }]),
    )
    expect(result?.hole.holeNumber).toBe(3)
  })

  it('falls back to birdie (with the same legend preference) when there is no eagle either', () => {
    const holes = [hole(1, 'nonlegend', 'birdie'), hole(2, 'legend', 'birdie'), hole(3, 'x', 'par')]
    const result = findTopPerformer(
      'course',
      holes,
      content([{ id: 'nonlegend', skill: 'solid' }, { id: 'legend', skill: 'legend' }, { id: 'x' }]),
    )
    expect(result?.hole.golferId).toBe('legend')
    expect(result?.isHighlight).toBe(true)
  })

  it('falls back to a non-highlight par hole when nobody beat par', () => {
    const holes = [hole(1, 'a', 'par'), hole(2, 'b', 'bogey_plus'), hole(3, 'c', 'par')]
    const result = findTopPerformer('course', holes, content([{ id: 'a' }, { id: 'b' }, { id: 'c' }]))
    expect(result?.hole.outcomeTier).toBe('par')
    expect(result?.isHighlight).toBe(false)
  })

  it('is deterministic — the same round always picks the same fallback hole', () => {
    const holes = [hole(1, 'a', 'par'), hole(2, 'b', 'par'), hole(3, 'c', 'par')]
    const c = content([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
    const first = findTopPerformer('course', holes, c)
    const second = findTopPerformer('course', holes, c)
    expect(first?.hole.holeNumber).toBe(second?.hole.holeNumber)
  })

  it('falls back to any hole (not just par) on an all-bogey round rather than returning null', () => {
    const holes = [hole(1, 'a', 'bogey_plus'), hole(2, 'b', 'bogey_plus')]
    const result = findTopPerformer('course', holes, content([{ id: 'a' }, { id: 'b' }]))
    expect(result).not.toBeNull()
    expect(result?.isHighlight).toBe(false)
  })
})
