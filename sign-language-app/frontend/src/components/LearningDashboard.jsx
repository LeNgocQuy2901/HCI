import React, { useState, useEffect } from 'react'
import LessonList from './LessonList'
import LessonDetail from './LessonDetail'
import ProgressView from './ProgressView'
import './LearningDashboard.css'

const LearningDashboard = ({ userId }) => {
  const [view, setView] = useState('lessons') // lessons, detail, progress
  const [selectedLessonId, setSelectedLessonId] = useState(null)
  const [userLoaded, setUserLoaded] = useState(false)

  useEffect(() => {
    // Get userId from localStorage or context
    if (!userId) {
      const storedUserId = localStorage.getItem('userId')
      if (storedUserId) {
        setUserLoaded(true)
      }
    } else {
      setUserLoaded(true)
    }
  }, [userId])

  const handleSelectLesson = (lessonId) => {
    setSelectedLessonId(lessonId)
    setView('detail')
  }

  const handleBackToLessons = () => {
    setView('lessons')
    setSelectedLessonId(null)
  }

  const handleViewProgress = () => {
    setView('progress')
  }

  const handleBackToAllViews = () => {
    setView('lessons')
  }

  const currentUserId = userId || localStorage.getItem('userId')

  return (
    <div className="learning-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>📚 Sign Language Learning Platform</h1>
          <p>Master sign language through interactive lessons, vocabulary, and quizzes</p>
        </div>

        <nav className="dashboard-nav">
          <button 
            className={`nav-item ${view === 'lessons' ? 'active' : ''}`}
            onClick={handleBackToAllViews}
          >
            <span className="nav-icon">📖</span>
            <span className="nav-label">Lessons</span>
          </button>
          <button 
            className={`nav-item ${view === 'progress' ? 'active' : ''}`}
            onClick={handleViewProgress}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">My Progress</span>
          </button>
        </nav>
      </div>

      <div className="dashboard-content">
        {view === 'lessons' && (
          <section className="view-section">
            <LessonList onSelectLesson={handleSelectLesson} />
          </section>
        )}

        {view === 'detail' && selectedLessonId && (
          <section className="view-section">
            <LessonDetail 
              lessonId={selectedLessonId}
              onBack={handleBackToLessons}
            />
          </section>
        )}

        {view === 'progress' && currentUserId && (
          <section className="view-section">
            <ProgressView userId={currentUserId} />
          </section>
        )}

        {view === 'progress' && !currentUserId && (
          <div className="login-prompt">
            <p>📝 Please login to view your progress</p>
            <button onClick={() => setView('lessons')}>Back to Lessons</button>
          </div>
        )}
      </div>

      <footer className="dashboard-footer">
        <p>© 2024 SmartSign - Sign Language Learning Platform</p>
      </footer>
    </div>
  )
}

export default LearningDashboard
