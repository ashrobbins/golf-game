import styles from './CourseCard.module.css'

// Placeholder gradient "photography" per course, standing in for real course
// imagery until that's sourced — swapping to a real background-image later
// is a one-line change in this lookup, no structural change needed.
const COURSE_GRADIENT: Record<string, string> = {
  'augusta-national': 'linear-gradient(135deg, #0b3d24 0%, #1f6b3a 55%, #4a9c5b 100%)',
  carnoustie: 'linear-gradient(135deg, #2c3b3a 0%, #51655a 55%, #94a184 100%)',
}
const DEFAULT_GRADIENT = 'linear-gradient(135deg, #2a2a2a 0%, #4a4a4a 100%)'

interface CourseCardProps {
  courseId: string
  name: string
  location?: string
  par: number
  onClick: () => void
}

export function CourseCard({ courseId, name, location, par, onClick }: CourseCardProps) {
  const gradient = COURSE_GRADIENT[courseId] ?? DEFAULT_GRADIENT

  return (
    <button
      type="button"
      className={styles.card}
      style={{ backgroundImage: gradient }}
      onClick={onClick}
    >
      <span className={styles.par}>Par {par}</span>
      <span className={styles.spacer} />
      <h2 className={styles.name}>{name}</h2>
      {location && <span className={styles.location}>{location}</span>}
    </button>
  )
}
