import { useMemo } from 'react'
import type { Country } from '../../content/types'
import { CountryFlag } from './CountryFlag'
import { Reel } from './Reel'
import { buildLoopingStrip } from './stripBuilders'
import styles from './CountryPicker.module.css'

const SPIN_DURATION_MS = 1300
const LOOPS = 4
// Trimmed down from the Reel default (56px) now that the wrapper is
// narrower — the old height left a lot of empty space above/below the
// smaller text.
const ITEM_HEIGHT = 44

interface CountryPickerProps {
  // Countries currently on the wheel, in a stable order.
  countries: Country[]
  targetCountryId: string
  spinToken: number | string
  onResolved: () => void
}

export function CountryPicker({
  countries,
  targetCountryId,
  spinToken,
  onResolved,
}: CountryPickerProps) {
  const target = countries.find((c) => c.id === targetCountryId) ?? countries[0]

  const strip = useMemo(
    () => buildLoopingStrip(countries, target, LOOPS),
    // Rebuild only when the spin target changes, not on every countries-array
    // identity change from unrelated re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spinToken],
  )

  return (
    <div className={styles.wrapper}>
      <Reel
        items={strip}
        durationMs={SPIN_DURATION_MS}
        spinToken={spinToken}
        itemHeight={ITEM_HEIGHT}
        getKey={(country, i) => `${country.id}-${i}`}
        onSettled={onResolved}
        renderItem={(country) => (
          <span className={styles.row}>
            <CountryFlag isoCode={country.isoCode} className={styles.flag} />
            <span className={styles.name}>{country.name}</span>
          </span>
        )}
      />
    </div>
  )
}
