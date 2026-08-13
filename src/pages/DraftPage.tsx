import { useEffect, useLayoutEffect, useMemo } from 'react'
import { CountryPicker } from '../components/picker/CountryPicker'
import { GolferReels } from '../components/picker/GolferReels'
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

  useEffect(() => {
    if (state.status === 'complete') onComplete(state.picks)
  }, [state.status, state.picks, onComplete])

  // After a pick, auto-spin for the next hole rather than waiting for a
  // manual click — the only manual "Spin" is the very first one, before any
  // pick has been made. useLayoutEffect (not useEffect) so the transition to
  // 'spinning' happens before paint, avoiding a one-frame flash of the
  // "Spin" button between holes.
  useLayoutEffect(() => {
    if (state.status === 'ready_to_spin' && state.picks.length > 0) {
      spin()
    }
  }, [state.status, state.picks.length, spin])

  if (state.status === 'complete') return <p>Draft complete, simulating…</p>

  const hole = course.holes.find((h) => h.number === state.currentHole)
  if (!hole) return null

  return (
    <div>
      <HoleHeader courseName={course.name} hole={hole} totalHoles={course.holes.length} />

      {state.status === 'ready_to_spin' && (
        <div className={styles.spinPrompt}>
          <Button onClick={spin}>Let's go</Button>
        </div>
      )}

      {(state.status === 'spinning' || state.status === 'awaiting_pick') &&
        state.pendingSpinCountryId && (
          <div className={styles.pickerStack}>
            <CountryPicker
              countries={state.wheelCountryIds.map((id) => countryIndex.get(id)!)}
              targetCountryId={state.pendingSpinCountryId}
              spinToken={state.currentHole}
              onResolved={confirmSpin}
            />

            {state.status === 'awaiting_pick' && state.pendingGolferOptions && (
              <GolferReels
                key={state.currentHole}
                country={countryIndex.get(state.pendingSpinCountryId)!}
                targets={state.pendingGolferOptions.map((id) => golferIndex.get(id)!)}
                spinToken={state.currentHole}
                onPick={pick}
              />
            )}
          </div>
        )}

      <div className={styles.roster}>
        <DraftRoster
          picks={state.picks}
          countryIndex={countryIndex}
          golferIndex={golferIndex}
          totalHoles={course.holes.length}
        />
      </div>
    </div>
  )
}
