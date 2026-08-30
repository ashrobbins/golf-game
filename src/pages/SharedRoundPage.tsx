import { useMemo } from 'react'
import { decodeRoundCode } from '../game/share/roundCode'
import { Scorecard } from '../components/scorecard/Scorecard'
import { Button } from '../components/ui/Button'
import { useGame } from '../state/useGame'
import styles from './SharedRoundPage.module.css'

// Lands here from a shared /round/[code] link — same content a results
// page shows for the round that generated it, plus a CTA back to a fresh
// round of your own. The round itself is decoded client-side straight out
// of the URL (see game/share/roundCode.ts); there's no server involved, so
// this works for anyone with the link, on any device, forever.
export function SharedRoundPage() {
  const { content, sharedRoundCode, playAgain } = useGame()

  const decoded = useMemo(() => {
    if (content.status !== 'ready' || !sharedRoundCode) return undefined
    return decodeRoundCode(sharedRoundCode, content.countries, content.courses)
  }, [content, sharedRoundCode])

  if (content.status !== 'ready') return null

  const course = decoded ? content.courses.courses.find((c) => c.id === decoded.courseId) : undefined

  if (!decoded || !course) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.subtitle}>This link doesn't look right — it may be incomplete or out of date.</p>
        <div className={styles.cta}>
          <Button onClick={playAgain}>Let's Go</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <p className={styles.prompt}>Think you can do better?</p>
      <div className={styles.cta}>
        <Button onClick={playAgain}>Let's Go</Button>
      </div>
      <Scorecard course={course} countries={content.countries} result={decoded} />
    </div>
  )
}
