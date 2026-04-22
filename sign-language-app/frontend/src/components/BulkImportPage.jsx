import React, { useState } from 'react'
import AdminBulkImport from './AdminBulkImport'
import './BulkImportPage.css'

const BulkImportPage = () => {
  const [lastImport, setLastImport] = useState(null)
  const [importHistory, setImportHistory] = useState([])

  const handleImportComplete = (result) => {
    const importRecord = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('vi-VN'),
      stats: result.stats,
      status: result.status
    }
    setLastImport(importRecord)
    setImportHistory([importRecord, ...importHistory.slice(0, 9)]) // Keep last 10 imports
  }

  return (
    <div className="bulk-import-page">
      <div className="page-header">
        <h1>📥 Bulk Import Lessons</h1>
        <p>Quickly add multiple lessons to your course from Google Drive</p>
      </div>

      <div className="page-content">
        <div className="import-section">
          <AdminBulkImport onImportComplete={handleImportComplete} />
        </div>

        {lastImport && (
          <div className="last-import-info">
            <h3>📌 Latest Import</h3>
            <div className="import-card">
              <div className="import-time">
                <strong>Time:</strong> {lastImport.timestamp}
              </div>
              <div className="import-stats">
                <div className="stat-item">
                  <span className="stat-icon">✅</span>
                  <span className="stat-text">Created: <strong>{lastImport.stats.created}</strong></span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">⚠️</span>
                  <span className="stat-text">Skipped: <strong>{lastImport.stats.skipped}</strong></span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">❌</span>
                  <span className="stat-text">Errors: <strong>{lastImport.stats.errors}</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {importHistory.length > 0 && (
          <div className="import-history">
            <h3>📋 Import History</h3>
            <div className="history-table">
              <div className="table-header">
                <div className="col-time">Time</div>
                <div className="col-created">Created</div>
                <div className="col-skipped">Skipped</div>
                <div className="col-errors">Errors</div>
                <div className="col-status">Status</div>
              </div>
              {importHistory.map((record) => (
                <div key={record.id} className="table-row">
                  <div className="col-time">{record.timestamp}</div>
                  <div className="col-created">{record.stats.created}</div>
                  <div className="col-skipped">{record.stats.skipped}</div>
                  <div className="col-errors">{record.stats.errors}</div>
                  <div className="col-status">
                    <span className="status-badge success">
                      {record.status === 'success' ? '✓ Success' : '✗ Failed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="help-section">
          <h3>💡 Quick Tips</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-icon">📄</div>
              <div className="tip-content">
                <strong>CSV Format</strong>
                <p>Use: title, description, video_url, level, order</p>
              </div>
            </div>
            <div className="tip-card">
              <div className="tip-icon">🎥</div>
              <div className="tip-content">
                <strong>Video Sources</strong>
                <p>Google Drive, YouTube, or direct MP4 URLs</p>
              </div>
            </div>
            <div className="tip-card">
              <div className="tip-icon">🔗</div>
              <div className="tip-content">
                <strong>Google Drive URL</strong>
                <p>Share videos publicly first, then copy link</p>
              </div>
            </div>
            <div className="tip-card">
              <div className="tip-icon">✅</div>
              <div className="tip-content">
                <strong>Validation</strong>
                <p>Required: title, video_url. Others optional</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkImportPage
