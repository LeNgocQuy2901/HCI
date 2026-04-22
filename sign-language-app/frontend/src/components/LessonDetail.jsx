import React, { useState, useEffect } from 'react'
import { learnService } from '../services/api'
import VocabularyView from './VocabularyView'
import QuizView from './QuizView'
import './LessonDetail.css'

// Utility functions for video URL detection and conversion
const getEmbeddableVideoUrl = (url) => {
  if (!url) return null
  
  // Google Drive
  if (url.includes('drive.google.com')) {
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
    if (fileIdMatch) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`
    }
  }
  
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    if (url.includes('embed')) return url
    const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/)
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`
    const shortMatch = url.match(/youtu\.be\/([^?]+)/)
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`
  }
  
  return url
}

const isGoogleDriveUrl = (url) => url?.includes('drive.google.com')
const isYouTubeUrl = (url) => url?.includes('youtube.com') || url?.includes('youtu.be')
const isEmbeddableUrl = (url) => isGoogleDriveUrl(url) || isYouTubeUrl(url)

const LessonDetail = ({ lessonId, onBack }) => {
  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('content') // content, vocabulary, quiz
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchLesson()
  }, [lessonId])

  const fetchLesson = async () => {
    try {
      setLoading(true)
      const response = await learnService.getLesson(lessonId)
      setLesson(response.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching lesson:', err)
      setError('Failed to load lesson')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="lesson-detail loading">Loading lesson...</div>
  }

  if (error) {
    return (
      <div className="lesson-detail error">
        <p>{error}</p>
        <button onClick={onBack}>Back to Lessons</button>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="lesson-detail not-found">
        <p>Lesson not found</p>
        <button onClick={onBack}>Back to Lessons</button>
      </div>
    )
  }

  return (
    <div className="lesson-detail-container">
      <button className="back-btn" onClick={onBack}>← Back</button>

      <div className="lesson-header">
        {lesson.thumbnail_url && (
          <img src={lesson.thumbnail_url} alt={lesson.title} className="lesson-banner" />
        )}
        <div className="lesson-title-section">
          <h1>{lesson.title}</h1>
          <p className="lesson-description">{lesson.description}</p>
          <span className={`level-badge ${lesson.level}`}>{lesson.level}</span>
        </div>
      </div>

      <div className="lesson-tabs">
        <button 
          className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          📖 Lesson Content
        </button>
        <button 
          className={`tab-btn ${activeTab === 'vocabulary' ? 'active' : ''}`}
          onClick={() => setActiveTab('vocabulary')}
        >
          📚 Vocabulary ({lesson.vocabularies?.length || 0})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
          onClick={() => setActiveTab('quiz')}
        >
          ✅ Quiz ({lesson.quiz?.length || 0})
        </button>
      </div>

      <div className="lesson-content-area">
        {activeTab === 'content' && (
          <div className="content-tab">
            {lesson.video_url && (
              <div className="video-container">
                {isGoogleDriveUrl(lesson.video_url) ? (
                  // Google Drive Video
                  <iframe
                    src={getEmbeddableVideoUrl(lesson.video_url)}
                    width="100%"
                    height="600"
                    allow="autoplay"
                    style={{ borderRadius: '8px', border: 'none' }}
                    title={lesson.title}
                  />
                ) : isYouTubeUrl(lesson.video_url) ? (
                  // YouTube Video
                  <iframe
                    width="100%"
                    height="600"
                    src={getEmbeddableVideoUrl(lesson.video_url)}
                    title={lesson.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ borderRadius: '8px' }}
                  />
                ) : (
                  // Regular MP4 or other video formats
                  <video width="100%" controls style={{ borderRadius: '8px' }}>
                    <source src={lesson.video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            )}
            {lesson.content && (
              <div className="lesson-text-content">
                {lesson.content}
              </div>
            )}
          </div>
        )}

        {activeTab === 'vocabulary' && (
          <VocabularyView 
            lessonId={lessonId}
            vocabularies={lesson.vocabularies}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizView 
            lessonId={lessonId}
            quiz={lesson.quiz?.[0]}
          />
        )}
      </div>
    </div>
  )
}

export default LessonDetail
