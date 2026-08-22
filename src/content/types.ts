export type ArchetypeTag =
  | 'long_hitter'
  | 'precision_iron'
  | 'short_game_specialist'
  | 'scrambler'
  | 'closer'

// Overall quality, independent of archetype fit. Nudges odds within
// whichever archetype-fit distribution already applies — it never replaces
// the fit system. Omit for an ordinary tour pro (the 'solid' baseline).
export type SkillTier = 'legend' | 'elite' | 'solid' | 'journeyman'

export interface Golfer {
  id: string
  name: string
  era?: string
  archetypes: [ArchetypeTag] | [ArchetypeTag, ArchetypeTag]
  skill?: SkillTier
}

export interface Country {
  id: string
  name: string
  isoCode: string
  golfers: Golfer[]
  // Max times this country can be drafted into a single 18-hole bag. Omit
  // for the ordinary cap (REPEAT_CAP in game/draft/types.ts) — only used to
  // raise the limit for countries with an unusually deep bench of marquee
  // names (e.g. USA, England), so those names can show up more than once
  // without needing a bigger bench-exhaustion floor.
  repeatCap?: number
}

export interface CountriesContent {
  version: number
  countries: Country[]
}

export type ParType = 3 | 4 | 5

export interface Hole {
  number: number
  par: ParType
  yardage: number
  archetype: ArchetypeTag
  name?: string
}

export interface Course {
  id: string
  name: string
  location?: string
  par: number
  holes: Hole[]
}

export interface CoursesContent {
  version: number
  courses: Course[]
}

export type OutcomeTier = 'hole_in_one' | 'eagle' | 'birdie' | 'par' | 'bogey_plus'

export type OutcomeDistribution = Record<OutcomeTier, number>

export interface OddsConfig {
  version: number
  outcomeTiers: OutcomeTier[]
  byParType: Record<
    '3' | '4' | '5',
    {
      matched: OutcomeDistribution
      unmatched: OutcomeDistribution
    }
  >
}
