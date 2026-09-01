import { describe, expect, it } from 'vitest'
import type { ArchetypeTag, CountriesContent, Course, Golfer } from '../../content/types'
import { mulberry32 } from '../rng'
import { createInitialDraftState } from './engine'
import { autoCompleteDraft, chooseAutoPick, isAdjacentArchetype } from './autoPick'
import { TOTAL_HOLES } from './types'

function golfer(id: string, archetypes: ArchetypeTag[], skill?: Golfer['skill']): Golfer {
  return { id, name: id, archetypes: archetypes as Golfer['archetypes'], skill }
}

function indexOf(candidates: Golfer[]): Map<string, Golfer> {
  return new Map(candidates.map((g) => [g.id, g]))
}

const ARCHETYPE_CYCLE: ArchetypeTag[] = [
  'long_hitter',
  'precision_iron',
  'short_game_specialist',
  'scrambler',
  'closer',
]

function makeCourseWithHoles(): Course {
  return {
    id: 'test-course',
    name: 'Test Course',
    par: 72,
    holes: Array.from({ length: TOTAL_HOLES }, (_, i) => ({
      number: i + 1,
      par: 4 as const,
      yardage: 400,
      archetype: ARCHETYPE_CYCLE[i % ARCHETYPE_CYCLE.length],
    })),
  }
}

function makeCountry(id: string, benchSize: number) {
  return {
    id,
    name: id,
    isoCode: 'XX',
    golfers: Array.from({ length: benchSize }, (_, i) =>
      golfer(`${id}-g${i}`, [ARCHETYPE_CYCLE[i % ARCHETYPE_CYCLE.length]], i % 5 === 0 ? 'legend' : undefined),
    ),
  }
}

function makeCountriesContent(): CountriesContent {
  return {
    version: 1,
    countries: Array.from({ length: 8 }, (_, i) => makeCountry(String.fromCharCode(97 + i), 8)),
  }
}

describe('isAdjacentArchetype', () => {
  it('treats neighbors in the long_hitter -> precision_iron -> short_game_specialist -> scrambler -> closer order as adjacent', () => {
    expect(isAdjacentArchetype('long_hitter', 'precision_iron')).toBe(true)
    expect(isAdjacentArchetype('precision_iron', 'short_game_specialist')).toBe(true)
    expect(isAdjacentArchetype('short_game_specialist', 'scrambler')).toBe(true)
    expect(isAdjacentArchetype('scrambler', 'closer')).toBe(true)
    expect(isAdjacentArchetype('precision_iron', 'long_hitter')).toBe(true)
  })

  it('the two end tags (long_hitter, closer) have exactly one neighbor each', () => {
    expect(isAdjacentArchetype('long_hitter', 'short_game_specialist')).toBe(false)
    expect(isAdjacentArchetype('long_hitter', 'scrambler')).toBe(false)
    expect(isAdjacentArchetype('long_hitter', 'closer')).toBe(false)
    expect(isAdjacentArchetype('closer', 'long_hitter')).toBe(false)
    expect(isAdjacentArchetype('closer', 'precision_iron')).toBe(false)
    expect(isAdjacentArchetype('closer', 'short_game_specialist')).toBe(false)
  })

  it('the three middle tags each have two neighbors', () => {
    expect(isAdjacentArchetype('short_game_specialist', 'precision_iron')).toBe(true)
    expect(isAdjacentArchetype('short_game_specialist', 'scrambler')).toBe(true)
    expect(isAdjacentArchetype('short_game_specialist', 'long_hitter')).toBe(false)
    expect(isAdjacentArchetype('short_game_specialist', 'closer')).toBe(false)
  })

  it('is not adjacent to itself', () => {
    expect(isAdjacentArchetype('scrambler', 'scrambler')).toBe(false)
  })
})

describe('chooseAutoPick', () => {
  const holeArchetype: ArchetypeTag = 'scrambler'

  it('tier 1 (legend, matching archetype) beats everything else', () => {
    const golfers = [
      golfer('a', ['scrambler'], 'legend'),
      golfer('b', ['scrambler'], 'elite'),
      golfer('c', ['closer'], 'legend'), // adjacent, not matching
    ]
    const choice = chooseAutoPick(['a', 'b', 'c'], holeArchetype, indexOf(golfers), mulberry32(1))
    expect(choice).toBe('a')
  })

  it('tier 2 (non-legend, matching archetype) beats tier 3 (legend, adjacent archetype)', () => {
    const golfers = [
      golfer('a', ['scrambler'], 'elite'),
      golfer('b', ['closer'], 'legend'), // adjacent to scrambler
      golfer('c', ['long_hitter'], 'legend'), // not adjacent, not matching
    ]
    const choice = chooseAutoPick(['a', 'b', 'c'], holeArchetype, indexOf(golfers), mulberry32(1))
    expect(choice).toBe('a')
  })

  it('tier 3 (legend, adjacent archetype) beats tier 4 (non-legend, adjacent archetype)', () => {
    const golfers = [
      golfer('a', ['closer'], 'legend'), // adjacent
      golfer('b', ['short_game_specialist'], 'elite'), // adjacent
      golfer('c', ['long_hitter'], undefined), // not adjacent
    ]
    const choice = chooseAutoPick(['a', 'b', 'c'], holeArchetype, indexOf(golfers), mulberry32(1))
    expect(choice).toBe('a')
  })

  it('tier 5 (any legend) beats tier 6 (no signal) even with no archetype fit', () => {
    const golfers = [
      golfer('a', ['long_hitter'], 'legend'), // no match, no adjacency, but a legend
      golfer('b', ['long_hitter'], undefined),
      golfer('c', ['long_hitter'], 'journeyman'),
    ]
    const choice = chooseAutoPick(['a', 'b', 'c'], holeArchetype, indexOf(golfers), mulberry32(1))
    expect(choice).toBe('a')
  })

  it('falls through to tier 6 and picks randomly among non-legends when nothing else applies', () => {
    const golfers = [
      golfer('a', ['long_hitter'], undefined),
      golfer('b', ['long_hitter'], 'elite'),
      golfer('c', ['long_hitter'], 'journeyman'),
    ]
    const map = indexOf(golfers)
    const results = new Set<string>()
    for (let seed = 1; seed <= 30; seed++) {
      results.add(chooseAutoPick(['a', 'b', 'c'], holeArchetype, map, mulberry32(seed)))
    }
    // Randomness across many seeds should surface more than one candidate.
    expect(results.size).toBeGreaterThan(1)
    for (const id of results) expect(['a', 'b', 'c']).toContain(id)
  })

  it('a golfer\'s second archetype tag counts toward matching and adjacency', () => {
    const golfers = [
      golfer('a', ['long_hitter', 'scrambler'], 'elite'), // matches via 2nd tag
      golfer('b', ['long_hitter'], 'legend'), // no match, no adjacency
    ]
    const choice = chooseAutoPick(['a', 'b'], holeArchetype, indexOf(golfers), mulberry32(1))
    expect(choice).toBe('a')
  })
})

describe('autoCompleteDraft', () => {
  function buildGolferIndex(content: CountriesContent): Map<string, Golfer> {
    const index = new Map<string, Golfer>()
    for (const country of content.countries) {
      for (const g of country.golfers) index.set(g.id, g)
    }
    return index
  }

  it('resolves an entire draft synchronously, ending in "complete" with a full 18-hole bag', () => {
    const course = makeCourseWithHoles()
    const content = makeCountriesContent()
    const golferIndex = buildGolferIndex(content)
    const initial = createInitialDraftState(course, content)

    const final = autoCompleteDraft(initial, course, golferIndex, mulberry32(1))

    expect(final.status).toBe('complete')
    expect(final.picks).toHaveLength(TOTAL_HOLES)
    expect(final.picks.map((p) => p.holeNumber)).toEqual(
      Array.from({ length: TOTAL_HOLES }, (_, i) => i + 1),
    )
  })

  it('never drafts the same golfer twice', () => {
    const course = makeCourseWithHoles()
    const content = makeCountriesContent()
    const golferIndex = buildGolferIndex(content)
    const initial = createInitialDraftState(course, content)

    const final = autoCompleteDraft(initial, course, golferIndex, mulberry32(2))

    const ids = final.picks.map((p) => p.golferId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('is deterministic for a given seed', () => {
    const course = makeCourseWithHoles()
    const content = makeCountriesContent()
    const golferIndex = buildGolferIndex(content)

    const runOnce = () =>
      autoCompleteDraft(createInitialDraftState(course, content), course, golferIndex, mulberry32(7))

    const first = runOnce()
    const second = runOnce()
    expect(first.picks).toEqual(second.picks)
  })

  it('completes across many seeds without stalling', () => {
    const course = makeCourseWithHoles()
    const content = makeCountriesContent()
    const golferIndex = buildGolferIndex(content)

    for (let seed = 0; seed < 50; seed++) {
      const final = autoCompleteDraft(
        createInitialDraftState(course, content),
        course,
        golferIndex,
        mulberry32(seed * 7919 + 13),
      )
      expect(final.status).toBe('complete')
      expect(final.picks).toHaveLength(TOTAL_HOLES)
    }
  })
})
