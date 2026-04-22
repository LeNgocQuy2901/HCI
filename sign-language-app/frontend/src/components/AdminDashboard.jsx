import React, { useState, useEffect } from 'react'
import AdminLessonManager from './AdminLessonManager'
import AdminQuizManager from './AdminQuizManager'
import AdminDashboardStats from './AdminDashboardStats'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard') // dashboard, lessons, quizzes, vocabulary
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch stats if needed
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="header-content">
          <h1>⚙️ Admin Panel</h1>
          <p>Manage lessons, vocabulary, quizzes, and analytics</p>
        </div>
      </div>

      <div className="admin-container">
        <nav className="admin-sidebar">
          <button
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="icon">📊</span>
            <span className="label">Dashboard</span>
          </button>
          <button
            className={`sidebar-item ${activeTab === 'lessons' ? 'active' : ''}`}
            onClick={() => setActiveTab('lessons')}
          >
            <span className="icon">📖</span>
            <span className="label">Lessons</span>
          </button>
          <button
            className={`sidebar-item ${activeTab === 'quizzes' ? 'active' : ''}`}
            onClick={() => setActiveTab('quizzes')}
          >
            <span className="icon">✅</span>
            <span className="label">Quizzes</span>
          </button>
          <button
            className={`sidebar-item ${activeTab === 'vocabulary' ? 'active' : ''}`}
            onClick={() => setActiveTab('vocabulary')}
          >
            <span className="icon">📚</span>
            <span className="label">Vocabulary</span>
          </button>
          <button
            className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <span className="icon">📈</span>
            <span className="label">Analytics</span>
          </button>
        </nav>

        <div className="admin-content">
          {activeTab === 'dashboard' && (
            <AdminDashboardStats />
          )}

          {activeTab === 'lessons' && (
            <AdminLessonManager />
          )}

          {activeTab === 'quizzes' && (
            <AdminQuizManager />
          )}

          {activeTab === 'vocabulary' && (
            <div className="admin-section">
              <h2>📚 Vocabulary Management</h2>
              <p className="coming-soon">Coming soon...</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="admin-section">
              <h2>📈 Analytics</h2>
              <p className="coming-soon">Coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
