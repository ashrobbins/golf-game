// Small, fast, non-cryptographic string hash — used to derive a
// deterministic seed from a piece of round data (which hole, which golfer,
// which outcome) so anything randomized from it (commentary text, the
// no-standout-hole fallback pick) comes out the same every time for the
// same round, rather than re-rolling on every render/instance.
export function hashSeed(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}
