import { useEffect } from 'react'
import { HowToPlayDrawer } from './components/nav/HowToPlayDrawer'
import { MobileNavDrawer } from './components/nav/MobileNavDrawer'
import { NavBar } from './components/nav/NavBar'
import { SettingsDrawer } from './components/nav/SettingsDrawer'
import { RoundDetailDrawer } from './components/stats/RoundDetailDrawer'
import { Footer } from './components/ui/Footer'
import { AchievementsPage } from './pages/AchievementsPage'
import { CoursePreviewPage } from './pages/CoursePreviewPage'
import { DraftPage } from './pages/DraftPage'
import { HomePage } from './pages/HomePage'
import { ResultsPage } from './pages/ResultsPage'
import { SharedRoundPage } from './pages/SharedRoundPage'
import { StatsPage } from './pages/StatsPage'
import { GameProvider } from './state/GameProvider'
import { OverlayProvider } from './state/OverlayProvider'
import { RoundDetailProvider } from './state/RoundDetailProvider'
import { useGame } from './state/useGame'
import styles from './App.module.css'

function GameView() {
  const { view } = useGame()

  // Every real navigation (course card -> preview, "Build My Bag" -> draft,
  // "Play again" -> home, etc.) goes through a `view` change, so scrolling
  // here on every change is a single fix for all of them — a course card
  // near the bottom of the home grid, or a "Play again" click from the
  // bottom of a long scorecard, would otherwise land on the next page
  // already scrolled halfway down. The in-page reveal skip (which doesn't
  // change `view`) needs its own explicit scroll — see RevealSequence.tsx.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [view])

  switch (view) {
    case 'home':
      return <HomePage />
    case 'course-info':
      return <CoursePreviewPage />
    case 'draft':
      return <DraftPage />
    case 'results':
      return <ResultsPage />
    case 'stats':
      return <StatsPage />
    case 'shared-round':
      return <SharedRoundPage />
    case 'achievements':
      return <AchievementsPage />
  }
}

function App() {
  return (
    <OverlayProvider>
      <GameProvider>
        <RoundDetailProvider>
          <NavBar />
          <div className={styles.page}>
            <GameView />
          </div>
          <Footer />
          <HowToPlayDrawer />
          <SettingsDrawer />
          <RoundDetailDrawer />
          <MobileNavDrawer />
        </RoundDetailProvider>
      </GameProvider>
    </OverlayProvider>
  )
}

export default App
