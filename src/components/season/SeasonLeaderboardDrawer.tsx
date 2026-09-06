import { useMemo } from 'react'
import { PlayerLeaderboard } from '../stats/PlayerLeaderboard'
import { Drawer } from '../ui/Drawer'
import { deriveSeasonStats } from '../../game/season/deriveSeasonStats'
import { loadStats } from '../../game/stats/storage'
import { useGame } from '../../state/useGame'
import { useSeasonLeaderboard } from '../../state/useSeasonLeaderboard'

// Rendered exactly once (from App.tsx), same "shared chrome" pattern as
// RoundDetailDrawer — the tappable "Top performer" stat on both the Season
// Hub hero card and each Seasons History card just calls
// useSeasonLeaderboard().open(seasonId, seasonNumber) and this renders
// whichever season that was. Reuses PlayerLeaderboard wholesale (same
// row/tier-chip styling as the Stats page's Top players leaderboard),
// showing every golfer who played that season rather than just the top 5
// — a season's roster is small enough that there's no need for a
// "show all" toggle here the way the career-wide Stats page needs one.
export function SeasonLeaderboardDrawer() {
  const { seasonId, seasonNumber, close } = useSeasonLeaderboard()
  const { content } = useGame()
  // Unlike the per-page snapshots in SeasonHubPage/SeasonHistoryPage (which
  // remount fresh every time the user navigates to them), this drawer is
  // mounted once for the app's entire lifetime — so re-reading loadStats()
  // only on mount would freeze the leaderboard at whatever it was when the
  // app first loaded, never picking up rounds played afterward. Re-reading
  // it fresh every time a season is opened (seasonId changes) fixes that
  // without re-parsing localStorage on every unrelated re-render.
  // seasonId is a deliberate re-fetch trigger here, not a value the
  // callback body reads — exhaustive-deps doesn't know that distinction.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rounds = useMemo(() => loadStats().rounds, [seasonId])

  const stats =
    content.status === 'ready' && seasonId ? deriveSeasonStats(seasonId, rounds, content.countries) : null

  return (
    <Drawer
      isOpen={seasonId !== null}
      onClose={close}
      titleId="season-leaderboard-heading"
      title={`Season ${seasonNumber} Leaderboard`}
    >
      {stats && content.status === 'ready' && (
        <PlayerLeaderboard
          ranking={stats.ranking}
          countries={content.countries}
          limit={stats.ranking.length}
          showToggle={false}
        />
      )}
    </Drawer>
  )
}
