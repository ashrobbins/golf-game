import styles from './CourseCard.module.css'

interface CourseCardProps {
  name: string
  location?: string
  par: number
  onClick: () => void
}

export function CourseCard({ name, location, par, onClick }: CourseCardProps) {
  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <span className={styles.par}>Par {par}</span>
      <span className={styles.spacer} />
      <h2 className={styles.name}>{name}</h2>
      {location && <span className={styles.location}>{location}</span>}
    </button>
  )
}
