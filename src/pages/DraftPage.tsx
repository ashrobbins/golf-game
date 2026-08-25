import { useLayoutEffect, useMemo } from 'react'
import { CountryPicker } from '../components/picker/CountryPicker'
import { GolferReels } from '../components/picker/GolferReels'
import { GolferReelsSkeleton } from '../components/picker/GolferReelsSkeleton'
import { DraftRoster } from '../components/draft/DraftRoster'
import { HoleHeader } from '../components/draft/HoleHeader'
import { Button } from '../components/ui/Button'
import type { CountriesContent, Country, Course, Golfer } from '../content/types'
import type { DraftPick } from '../game/draft/types'
import { useDraftGame } from '../hooks/useDraftGame'
import { useGame } from '../state/useGame'
import styles from './DraftPage.module.css'

export function DraftPage() {
  const { content, course, finishDraft } = useGame()

  if (content.status !== 'ready' || !course) return null

  return <DraftPageInner countries={content.countries} course={course} onComplete={finishDraft} />
}

function DraftPageInner({
  countries,
  course,
  onComplete,
}: {
  countries: CountriesContent
  course: Course
  onComplete: (picks: DraftPick[]) => void
}) {
  const { state, spin, confirmSpin, pick } = useDraftGame(course, countries)

  const countryIndex = useMemo(() => {
    const map = new Map<string, Country>()
    for (const country of countries.countries) map.set(country.id, country)
    return map
  }, [countries])

  const golferIndex = useMemo(() => {
    const map = new Map<string, Golfer>()
    for (const country of countries.countries) {
      for (const golfer of country.golfers) map.set(golfer.id, golfer)
    }
    return map
  }, [countries])

  // Auto-spin every hole, including the first — the course preview page's
  // own "Let's Go" button is the user's one manual kick-off, so the draft
  // itself never waits for another click. useLayoutEffect (not useEffect) so
  // the transition to 'spinning' happens before paint, avoiding a one-frame
  // flash of a "ready to spin" state between holes.
  useLayoutEffect(() => {
    if (state.status === 'ready_to_spin') {
      spin()
    }
  }, [state.status, spin])

  if (state.status === 'complete') {
    return (
      <div>
        <div className={styles.completeHeader}>
          <h2 className={styles.completeTitle}>Your bag is set</h2>
          <p className={styles.completeSubtitle}>All 18 golfers drafted. Ready to play?</p>
          <Button onClick={() => onComplete(state.picks)}>Tee off</Button>
        </div>

        <div className={styles.roster}>
          <DraftRoster
            picks={state.picks}
            holes={course.holes}
            countryIndex={countryIndex}
            golferIndex={golferIndex}
            totalHoles={course.holes.length}
          />
        </div>
      </div>
    )
  }

  const hole = course.holes.find((h) => h.number === state.currentHole)
  if (!hole) return null

  return (
    <div>
      <HoleHeader courseName={course.name} hole={hole} totalHoles={course.holes.length} />

      {(state.status === 'spinning' || state.status === 'awaiting_pick') &&
        state.pendingSpinCountryId && (
          <div className={styles.pickerStack}>
            <CountryPicker
              countries={state.wheelCountryIds.map((id) => countryIndex.get(id)!)}
              targetCountryId={state.pendingSpinCountryId}
              spinToken={state.currentHole}
              onResolved={confirmSpin}
            />

            {state.status === 'awaiting_pick' && state.pendingGolferOptions ? (
              <GolferReels
                key={state.currentHole}
                country={countryIndex.get(state.pendingSpinCountryId)!}
                targets={state.pendingGolferOptions.map((id) => golferIndex.get(id)!)}
                spinToken={state.currentHole}
                onPick={pick}
              />
            ) : (
              // The country's still spinning, so the offered golfers aren't
              // known yet — reserve the same space GolferReels will occupy
              // rather than leaving a gap that appears once it resolves.
              <GolferReelsSkeleton />
            )}
          </div>
        )}

      <div className={styles.roster}>
        <DraftRoster
          picks={state.picks}
          holes={course.holes}
          countryIndex={countryIndex}
          golferIndex={golferIndex}
          totalHoles={course.holes.length}
        />
      </div>
    </div>
  )
}
