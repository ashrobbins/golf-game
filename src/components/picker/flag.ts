const REGIONAL_INDICATOR_BASE = 127397
const TAG_BASE = 0xe0000
const TAG_CANCEL = 0xe007f
const BLACK_FLAG = 0x1f3f4

// Plain ISO 3166-1 alpha-2 code ("US", "FR") via Unicode regional indicator
// symbols — the standard "country flag" emoji mechanism.
function countryFlagEmoji(isoCode: string): string {
  const codePoints = isoCode
    .toUpperCase()
    .split('')
    .map((c) => REGIONAL_INDICATOR_BASE + c.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

// ISO 3166-2 subdivision code ("GB-SCT", "GB-ENG", "GB-WLS") via the Unicode
// "tag sequence" mechanism: a black flag base character followed by the
// code's letters spelled out in invisible tag characters. This is how
// England/Scotland/Wales actually get their own flag emoji, since they
// aren't ISO 3166-1 countries and can't use regional indicator symbols.
// Note: Northern Ireland (GB-NIR) has no officially recognized Unicode flag
// sequence — that's a real gap in the standard, not a bug here — so it
// typically renders as a plain black flag placeholder on platforms that
// support this mechanism.
function subdivisionFlagEmoji(isoCode: string): string {
  const tagChars = isoCode
    .toLowerCase()
    .replace('-', '')
    .split('')
    .map((c) => String.fromCodePoint(TAG_BASE + c.charCodeAt(0)))
  return String.fromCodePoint(BLACK_FLAG) + tagChars.join('') + String.fromCodePoint(TAG_CANCEL)
}

export function isoToFlagEmoji(isoCode: string): string {
  if (/^[A-Za-z]{2}$/.test(isoCode)) return countryFlagEmoji(isoCode)
  if (/^[A-Za-z]{2}-[A-Za-z]{2,3}$/.test(isoCode)) return subdivisionFlagEmoji(isoCode)
  return '🏳️'
}
