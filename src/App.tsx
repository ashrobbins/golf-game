import { HowToPlayDrawer } from './components/nav/HowToPlayDrawer'
import { NavBar } from './components/nav/NavBar'
import { Footer } from './components/ui/Footer'
import { CoursePreviewPage } from './pages/CoursePreviewPage'
import { DraftPage } from './pages/DraftPage'
import { HomePage } from './pages/HomePage'
import { ResultsPage } from './pages/ResultsPage'
import { StatsPage } from './pages/StatsPage'
import { GameProvider } from './state/GameProvider'
import { HowToPlayProvider } from './state/HowToPlayProvider'
import { useGame } from './state/useGame'
import styles from './App.module.css'

function GameView() {
  const { view } = useGame()

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
  }
}

function App() {
  return (
    <HowToPlayProvider>
      <GameProvider>
        <NavBar />
        <div className={styles.page}>
          <GameView />
        </div>
        <Footer />
        <HowToPlayDrawer />
      </GameProvider>
    </HowToPlayProvider>
  )
}

export default App
