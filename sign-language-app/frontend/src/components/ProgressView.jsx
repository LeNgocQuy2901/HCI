import React, { useState, useEffect } from 'react'
import { learnService } from '../services/api'
import './ProgressView.css'

const ProgressView = ({ userId }) => {
  const [progress, setProgress] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProgress()
  }, [userId])

  const fetchProgress = async () => {
    try {
      setLoading(true)
      const [progressRes, summaryRes] = await Promise.all([
        learnService.getUserProgress(userId),
        learnService.getProgressSummary(userId)
      ])
      
      setProgress(progressRes.data)
      setSummary(summaryRes.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching progress:', err)
      setError('Failed to load progress')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (loading) {
    return <div className="progress-view loading">Loading progress...</div>
  }

  if (error) {
    return <div className="progress-view error">{error}</div>
  }

  return (
    <div className="progress-view">
      {summary && (
        <div className="progress-summary">
          <h2>Your Learning Progress</h2>
          
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <h4>Completed Lessons</h4>
                <p className="card-value">
                  {summary.completed_lessons} / {summary.total_lessons}
                </p>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{width: `${(summary.completed_lessons / summary.total_lessons * 100) || 0}%`}}
                  ></div>
                </div>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">✅</div>
              <div className="card-content">
                <h4>Quiz Attempts</h4>
                <p className="card-value">{summary.total_quiz_attempts}</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">📈</div>
              <div className="card-content">
                <h4>Average Quiz Score</h4>
                <p className="card-value">{summary.average_quiz_score.toFixed(1)}%</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">⏱️</div>
              <div className="card-content">
                <h4>Total Study Time</h4>
                <p className="card-value">{formatTime(summary.total_time_spent)}</p>
              </div>
            </div>
          </div>

          <div className="current-level">
            <h4>Current Level</h4>
            <span className={`level-badge ${summary.current_level}`}>
              {summary.current_level.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      <div className="lesson-progress">
        <h3>Lesson Progress</h3>
        
        {progress.length === 0 ? (
          <p className="empty-state">Start learning to track your progress!</p>
        ) : (
          <div className="lesson-list">
            {progress.map((item) => (
              <div key={item.id} className="lesson-progress-item">
                <div className="lesson-info">
                  <h4>{item.lesson.title}</h4>
                  <p className="lesson-level">{item.lesson.level}</p>
                </div>
                
                <div className="lesson-stats">
                  <span className="study-time">
                    ⏱️ {formatTime(item.time_spent)}
                  </span>
                  <span className={`status ${item.is_completed ? 'completed' : 'in-progress'}`}>
                    {item.is_completed ? '✓ Completed' : '📖 In Progress'}
                  </span>
                </div>

                {item.completed_at && (
                  <p className="completion-date">
                    Completed on {new Date(item.completed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProgressView
