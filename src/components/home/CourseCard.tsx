import { CountryFlag } from '../picker/CountryFlag'
import styles from './CourseCard.module.css'

interface CourseCardProps {
  name: string
  location?: string
  par: number
  countryIsoCode?: string
  onClick: () => void
}

export function CourseCard({ name, location, par, countryIsoCode, onClick }: CourseCardProps) {
  return (
    <button type="button" className={styles.card} onClick={onClick}>
      {countryIsoCode && (
        <CountryFlag isoCode={countryIsoCode} className={styles.flag} ariaHidden />
      )}
      <span className={styles.par}>Par {par}</span>
      <span className={styles.spacer} />
      <h2 className={styles.name}>{name}</h2>
      {location && <span className={styles.location}>{location}</span>}
    </button>
  )
}
