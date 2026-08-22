import { isoToFlagEmoji } from './flag'
import nirFlagUrl from './nir-flag.png'
import styles from './CountryFlag.module.css'

const NORTHERN_IRELAND_ISO = 'GB-NIR'

interface CountryFlagProps {
  isoCode: string
  className?: string
  ariaHidden?: boolean
}

// Northern Ireland has no officially recognized Unicode flag emoji sequence
// (see isoToFlagEmoji) and renders as a plain black flag glyph on most
// platforms — swapped in a real image of the Ulster Banner for that one
// country specifically. `className` is expected to set font-size the way
// the emoji span always did; the image sizes itself to match (1em square)
// so it drops into the same slot with no other layout changes.
export function CountryFlag({ isoCode, className, ariaHidden }: CountryFlagProps) {
  if (isoCode === NORTHERN_IRELAND_ISO) {
    return (
      <img
        src={nirFlagUrl}
        alt="Northern Ireland flag"
        aria-hidden={ariaHidden}
        className={className ? `${styles.image} ${className}` : styles.image}
      />
    )
  }

  return (
    <span className={className} aria-hidden={ariaHidden}>
      {isoToFlagEmoji(isoCode)}
    </span>
  )
}
