import { NavBar } from './components/nav/NavBar'
import { CoursePreviewPage } from './pages/CoursePreviewPage'
import { DraftPage } from './pages/DraftPage'
import { HomePage } from './pages/HomePage'
import { ResultsPage } from './pages/ResultsPage'
import { GameProvider } from './state/GameProvider'
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
  }
}

function App() {
  return (
    <GameProvider>
      <NavBar />
      <div className={styles.page}>
        <GameView />
      </div>
    </GameProvider>
  )
}

export default App
