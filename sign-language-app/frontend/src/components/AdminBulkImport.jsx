import React, { useState } from 'react'
import { adminService } from '../services/api'
import './AdminBulkImport.css'

const AdminBulkImport = ({ onImportComplete }) => {
  const [importType, setImportType] = useState('csv') // csv or json
  const [file, setFile] = useState(null)
  const [jsonData, setJsonData] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setError(null)
  }

  const handleJsonChange = (e) => {
    setJsonData(e.target.value)
    setError(null)
  }

  const downloadTemplate = () => {
    // Create CSV template
    const csvContent = `title,description,video_url,level,order,thumbnail_url,content
Chào buổi sáng,Cách chào vào buổi sáng,https://drive.google.com/file/d/VIDEO_ID_1/view,beginner,1,,Nội dung bài học
Chào buổi chiều,Cách chào vào buổi chiều,https://drive.google.com/file/d/VIDEO_ID_2/view,beginner,2,,Nội dung bài học`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'lessons_template.csv'
    link.click()
  }

  const handleUploadCSV = async () => {
    if (!file) {
      setError('Please select a CSV file')
      return
    }

    if (!file.name.endsWith('.csv')) {
      setError('File must be in CSV format')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/bulk-import/csv', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Upload failed')
      }

      const data = await response.json()
      setResult(data)

      // Reset form
      setFile(null)
      document.getElementById('fileInput').value = ''

      if (onImportComplete) {
        onImportComplete(data)
      }
    } catch (err) {
      setError(err.message || 'Error uploading file')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadJSON = async () => {
    if (!jsonData.trim()) {
      setError('Please enter JSON data')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = JSON.parse(jsonData)

      if (!Array.isArray(data)) {
        throw new Error('JSON must be an array of lesson objects')
      }

      const response = await fetch('/api/admin/bulk-import/json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Import failed')
      }

      const result = await response.json()
      setResult(result)

      // Reset form
      setJsonData('')

      if (onImportComplete) {
        onImportComplete(result)
      }
    } catch (err) {
      setError(err.message || 'Error processing data')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = () => {
    if (importType === 'csv') {
      handleUploadCSV()
    } else {
      handleUploadJSON()
    }
  }

  return (
    <div className="admin-bulk-import">
      <div className="import-header">
        <h2>📥 Bulk Import Lessons</h2>
        <p>Import multiple lessons at once from CSV or JSON</p>
      </div>

      {/* Toggle Form */}
      {!showForm && (
        <button className="toggle-btn" onClick={() => setShowForm(true)}>
          + Show Import Form
        </button>
      )}

      {/* Import Form */}
      {showForm && (
        <div className="import-form">
          {/* Type Selection */}
          <div className="type-selector">
            <label>
              <input
                type="radio"
                value="csv"
                checked={importType === 'csv'}
                onChange={(e) => {
                  setImportType(e.target.value)
                  setError(null)
                  setResult(null)
                }}
              />
              📄 CSV File
            </label>
            <label>
              <input
                type="radio"
                value="json"
                checked={importType === 'json'}
                onChange={(e) => {
                  setImportType(e.target.value)
                  setError(null)
                  setResult(null)
                }}
              />
              {} JSON Data
            </label>
          </div>

          {/* CSV Upload */}
          {importType === 'csv' && (
            <div className="import-section">
              <div className="section-title">
                <h3>CSV File Upload</h3>
                <button className="help-btn" onClick={downloadTemplate}>
                  📥 Download Template
                </button>
              </div>

              <div className="csv-format">
                <strong>CSV Format:</strong>
                <code>title,description,video_url,level,order,thumbnail_url,content</code>
                <p>
                  <strong>Required:</strong> title, video_url
                  <br />
                  <strong>Optional:</strong> description, level, order, thumbnail_url, content
                </p>
              </div>

              <input
                id="fileInput"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="file-input"
              />

              {file && <p className="file-info">Selected: {file.name}</p>}
            </div>
          )}

          {/* JSON Input */}
          {importType === 'json' && (
            <div className="import-section">
              <div className="section-title">
                <h3>JSON Data Input</h3>
              </div>

              <div className="json-format">
                <strong>JSON Format Example:</strong>
                <pre>{`[
  {
    "title": "Chào buổi sáng",
    "description": "Cách chào sáng",
    "video_url": "https://drive.google.com/file/d/ABC123/view",
    "level": "beginner",
    "order": 1,
    "content": "Nội dung bài học"
  }
]`}</pre>
              </div>

              <textarea
                value={jsonData}
                onChange={handleJsonChange}
                placeholder="Paste JSON array here..."
                className="json-input"
                rows="8"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          {/* Import Button */}
          <button
            className="import-btn"
            onClick={handleImport}
            disabled={loading || (!file && importType === 'csv') || (!jsonData && importType === 'json')}
          >
            {loading ? '⏳ Importing...' : '📥 Import Now'}
          </button>

          <button className="cancel-btn" onClick={() => setShowForm(false)}>
            ✕ Cancel
          </button>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="success-result">
          <div className="result-header">
            <h3>✅ Import Successful</h3>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{result.stats.created}</div>
              <div className="stat-label">✓ Created</div>
            </div>
            <div className="stat-card skipped">
              <div className="stat-number">{result.stats.skipped}</div>
              <div className="stat-label">⚠ Skipped</div>
            </div>
            <div className="stat-card error">
              <div className="stat-number">{result.stats.errors}</div>
              <div className="stat-label">✗ Errors</div>
            </div>
          </div>

          {result.stats.errors > 0 && (
            <div className="error-details">
              <h4>❌ Error Details:</h4>
              <ul>
                {result.stats.error_details.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            className="new-import-btn"
            onClick={() => {
              setResult(null)
              setFile(null)
              setJsonData('')
              document.getElementById('fileInput').value = ''
            }}
          >
            + Import More Lessons
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminBulkImport
