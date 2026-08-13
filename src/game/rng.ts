export type Rng = () => number

// Small, fast, deterministic PRNG for reproducible tests. Production code
// should default to Math.random.
export function mulberry32(seed: number): Rng {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Uniform random integer in [0, max).
export function randomIndex(rng: Rng, max: number): number {
  return Math.floor(rng() * max)
}
