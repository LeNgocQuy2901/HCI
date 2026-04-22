import React, { useState, useEffect } from 'react'
import { learnService } from '../services/api'
import './LessonList.css'

const LessonList = ({ onSelectLesson }) => {
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchLessons()
  }, [filter])

  const fetchLessons = async () => {
    try {
      setLoading(true)
      const response = await learnService.getLessons(filter)
      setLessons(response.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching lessons:', err)
      setError('Failed to load lessons')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="lesson-list loading">Loading lessons...</div>
  }

  if (error) {
    return <div className="lesson-list error">{error}</div>
  }

  return (
    <div className="lesson-list-container">
      <div className="lesson-filters">
        <button 
          className={!filter ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter(null)}
        >
          All Levels
        </button>
        <button 
          className={filter === 'beginner' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('beginner')}
        >
          Beginner
        </button>
        <button 
          className={filter === 'intermediate' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('intermediate')}
        >
          Intermediate
        </button>
        <button 
          className={filter === 'advanced' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('advanced')}
        >
          Advanced
        </button>
      </div>

      <div className="lessons-grid">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="lesson-card">
            <div className="lesson-thumbnail">
              {lesson.thumbnail_url ? (
                <img src={lesson.thumbnail_url} alt={lesson.title} />
              ) : (
                <div className="placeholder-thumbnail">
                  📚 {lesson.title.substring(0, 3)}
                </div>
              )}
            </div>
            <div className="lesson-content">
              <span className={`level-badge ${lesson.level}`}>
                {lesson.level}
              </span>
              <h3>{lesson.title}</h3>
              <p>{lesson.description}</p>
              <button 
                className="view-lesson-btn"
                onClick={() => onSelectLesson(lesson.id)}
              >
                Learn Now →
              </button>
            </div>
          </div>
        ))}
      </div>

      {lessons.length === 0 && (
        <div className="no-lessons">No lessons found</div>
      )}
    </div>
  )
}

export default LessonList
