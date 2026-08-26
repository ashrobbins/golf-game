import { Scorecard } from '../scorecard/Scorecard'
import { Drawer } from '../ui/Drawer'
import { useGame } from '../../state/useGame'
import { useRoundDetail } from '../../state/useRoundDetail'

// Rendered exactly once (from App.tsx), same "shared chrome" pattern as
// HowToPlayDrawer — any trigger on the stats page (a history row, a "Best
// round" stat) just calls useRoundDetail().open(round) and this renders
// whichever round that was. Reuses the real Scorecard component wholesale
// (results hero + hole-by-hole grid + per-hole commentary rows) rather than
// re-implementing any of it, so a past round looks exactly like it did the
// day it was played.
export function RoundDetailDrawer() {
  const { round, close } = useRoundDetail()
  const { content } = useGame()

  const course =
    content.status === 'ready' && round
      ? content.courses.courses.find((c) => c.id === round.courseId)
      : undefined

  return (
    <Drawer isOpen={round !== null} onClose={close} titleId="round-detail-heading" title="Round Details">
      {round && course && content.status === 'ready' && (
        <Scorecard course={course} countries={content.countries} result={round} />
      )}
    </Drawer>
  )
}
