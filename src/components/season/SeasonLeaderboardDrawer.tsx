import { useState } from 'react'
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
// pinned to the top 5 with no "show all" toggle.
export function SeasonLeaderboardDrawer() {
  const { seasonId, seasonNumber, close } = useSeasonLeaderboard()
  const { content } = useGame()
  const [rounds] = useState(() => loadStats().rounds)

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
        <PlayerLeaderboard ranking={stats.ranking} countries={content.countries} limit={5} showToggle={false} />
      )}
    </Drawer>
  )
}
