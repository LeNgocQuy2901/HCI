import React, { useState, useEffect } from 'react'
import { adminService, learnService } from '../services/api'
import './AdminLessonManager.css'

const AdminLessonManager = () => {
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('all') // all, active, inactive
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    content: '',
    level: 'beginner',
    order: 0,
    is_active: true
  })

  useEffect(() => {
    fetchLessons()
  }, [filter])

  const fetchLessons = async () => {
    try {
      setLoading(true)
      const isActive = filter === 'active' ? true : filter === 'inactive' ? false : null
      const response = await adminService.getAllLessonsAdmin(null, isActive)
      setLessons(response.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching lessons:', err)
      setError('Failed to load lessons')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await adminService.updateLessonAdmin(editingId, formData)
        setError(null)
        alert('Lesson updated successfully')
      } else {
        await adminService.createLessonAdmin(formData)
        setError(null)
        alert('Lesson created successfully')
      }
      resetForm()
      fetchLessons()
    } catch (err) {
      console.error('Error saving lesson:', err)
      setError('Failed to save lesson')
    }
  }

  const handleEdit = (lesson) => {
    setFormData(lesson)
    setEditingId(lesson.id)
    setShowForm(true)
  }

  const handleDelete = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return
    
    try {
      await adminService.deleteLessonAdmin(lessonId)
      alert('Lesson deleted successfully')
      fetchLessons()
    } catch (err) {
      console.error('Error deleting lesson:', err)
      setError('Failed to delete lesson')
    }
  }

  const handlePublish = async (lessonId) => {
    try {
      await adminService.publishLesson(lessonId)
      fetchLessons()
    } catch (err) {
      console.error('Error publishing lesson:', err)
    }
  }

  const handleUnpublish = async (lessonId) => {
    try {
      await adminService.unpublishLesson(lessonId)
      fetchLessons()
    } catch (err) {
      console.error('Error unpublishing lesson:', err)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      video_url: '',
      thumbnail_url: '',
      content: '',
      level: 'beginner',
      order: 0,
      is_active: true
    })
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) {
    return <div className="lesson-manager loading">Loading lessons...</div>
  }

  return (
    <div className="admin-lesson-manager">
      <div className="manager-header">
        <h2>📖 Lesson Management</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Close' : '+ New Lesson'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="lesson-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Lesson title"
                required
              />
            </div>
            <div className="form-group">
              <label>Level</label>
              <select name="level" value={formData.level} onChange={handleInputChange}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="form-group">
              <label>Order</label>
              <input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Video URL</label>
              <input
                type="url"
                name="video_url"
                value={formData.video_url}
                onChange={handleInputChange}
                placeholder="https://example.com/video.mp4"
              />
            </div>
            <div className="form-group">
              <label>Thumbnail URL</label>
              <input
                type="url"
                name="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={handleInputChange}
                placeholder="https://example.com/thumb.jpg"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Content (Lesson Text)</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Lesson content"
              rows="5"
            />
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              id="is_active"
            />
            <label htmlFor="is_active">Active (Published)</label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingId ? 'Update Lesson' : 'Create Lesson'}
            </button>
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="lessons-filter">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({lessons.length})
        </button>
        <button 
          className={filter === 'active' ? 'active' : ''}
          onClick={() => setFilter('active')}
        >
          Active ({lessons.filter(l => l.is_active).length})
        </button>
        <button 
          className={filter === 'inactive' ? 'active' : ''}
          onClick={() => setFilter('inactive')}
        >
          Inactive ({lessons.filter(l => !l.is_active).length})
        </button>
      </div>

      <div className="lessons-table">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Level</th>
              <th>Status</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((lesson) => (
              <tr key={lesson.id}>
                <td>
                  <strong>{lesson.title}</strong>
                  <p className="description">{lesson.description?.substring(0, 50)}...</p>
                </td>
                <td>
                  <span className={`badge ${lesson.level}`}>
                    {lesson.level}
                  </span>
                </td>
                <td>
                  <span className={`status ${lesson.is_active ? 'active' : 'inactive'}`}>
                    {lesson.is_active ? '✓ Active' : '✕ Inactive'}
                  </span>
                </td>
                <td>{lesson.order}</td>
                <td className="actions">
                  <button
                    className="btn-small btn-edit"
                    onClick={() => handleEdit(lesson)}
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    className={`btn-small ${lesson.is_active ? 'btn-unpublish' : 'btn-publish'}`}
                    onClick={() => lesson.is_active ? handleUnpublish(lesson.id) : handlePublish(lesson.id)}
                    title={lesson.is_active ? 'Unpublish' : 'Publish'}
                  >
                    {lesson.is_active ? '↓' : '↑'}
                  </button>
                  <button
                    className="btn-small btn-delete"
                    onClick={() => handleDelete(lesson.id)}
                    title="Delete"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {lessons.length === 0 && (
          <div className="empty-state">
            <p>No lessons found. Create your first lesson!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminLessonManager
