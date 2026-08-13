// Builds the scrollable strip content for a Reel: several decoy loops of the
// full pool, ending on the real, predetermined result as the last item.

export function buildLoopingStrip<T>(pool: T[], target: T, loops: number): T[] {
  const strip: T[] = []
  for (let i = 0; i < loops; i++) strip.push(...pool)
  strip.push(target)
  return strip
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
