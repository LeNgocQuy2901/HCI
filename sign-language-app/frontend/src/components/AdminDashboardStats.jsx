import React, { useState, useEffect } from 'react'
import { adminService } from '../services/api'
import './AdminDashboardStats.css'

const AdminDashboardStats = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await adminService.getDashboardStats()
      setStats(response.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Failed to load dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="stats-loading">Loading statistics...</div>
  }

  if (error) {
    return <div className="stats-error">{error}</div>
  }

  return (
    <div className="admin-dashboard-stats">
      <h2>📊 Dashboard Overview</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📖</div>
          <div className="stat-content">
            <h3>Total Lessons</h3>
            <p className="stat-number">{stats?.total_lessons || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Total Quizzes</h3>
            <p className="stat-number">{stats?.total_quiz || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">❓</div>
          <div className="stat-content">
            <h3>Total Questions</h3>
            <p className="stat-number">{stats?.total_questions || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>Total Vocabulary</h3>
            <p className="stat-number">{stats?.total_vocabularies || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Users Learning</h3>
            <p className="stat-number">{stats?.total_users_learning || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Avg Quiz Score</h3>
            <p className="stat-number">{stats?.average_quiz_score?.toFixed(1) || 0}%</p>
          </div>
        </div>
      </div>

      <div className="recent-activities">
        <h3>📋 Recent Activities</h3>
        <p className="coming-soon">Activity log coming soon</p>
      </div>

      <button onClick={fetchStats} className="refresh-btn">
        🔄 Refresh Stats
      </button>
    </div>
  )
}

export default AdminDashboardStats
