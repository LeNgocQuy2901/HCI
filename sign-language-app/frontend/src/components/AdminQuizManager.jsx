import React, { useState, useEffect } from 'react'
import { adminService, learnService } from '../services/api'
import './AdminQuizManager.css'

const AdminQuizManager = () => {
  const [quizzes, setQuizzes] = useState([])
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [showQuestionForm, setShowQuestionForm] = useState(false)

  const [quizFormData, setQuizFormData] = useState({
    lesson_id: '',
    title: '',
    description: '',
    passing_score: 70,
    time_limit: 300,
    is_active: true
  })

  const [questionFormData, setQuestionFormData] = useState({
    quiz_id: '',
    question_text: '',
    question_type: 'multiple_choice',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    order: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [quizzesRes, lessonsRes] = await Promise.all([
        adminService.getAllQuizzesAdmin(),
        learnService.getLessons()
      ])
      setQuizzes(quizzesRes.data)
      setLessons(lessonsRes.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleQuizInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setQuizFormData({
      ...quizFormData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleQuestionInputChange = (e) => {
    const { name, value } = e.target
    setQuestionFormData({
      ...questionFormData,
      [name]: value
    })
  }

  const handleCreateQuiz = async (e) => {
    e.preventDefault()
    try {
      await adminService.createQuizAdmin(quizFormData)
      alert('Quiz created successfully')
      resetQuizForm()
      fetchData()
    } catch (err) {
      console.error('Error creating quiz:', err)
      setError('Failed to create quiz')
    }
  }

  const handleUpdateQuiz = async (e) => {
    e.preventDefault()
    try {
      await adminService.updateQuizAdmin(editingId, quizFormData)
      alert('Quiz updated successfully')
      resetQuizForm()
      fetchData()
    } catch (err) {
      console.error('Error updating quiz:', err)
      setError('Failed to update quiz')
    }
  }

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return
    
    try {
      await adminService.deleteQuizAdmin(quizId)
      alert('Quiz deleted successfully')
      fetchData()
    } catch (err) {
      console.error('Error deleting quiz:', err)
    }
  }

  const handleAddQuestion = async (e) => {
    e.preventDefault()
    try {
      await adminService.createQuestionAdmin({
        ...questionFormData,
        quiz_id: selectedQuiz.id
      })
      alert('Question added successfully')
      setQuestionFormData({
        quiz_id: '',
        question_text: '',
        question_type: 'multiple_choice',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A',
        order: 0
      })
      setShowQuestionForm(false)
      // Refresh selected quiz
      if (selectedQuiz) {
        const res = await learnService.getQuiz(selectedQuiz.lesson_id)
        setSelectedQuiz(res.data)
      }
    } catch (err) {
      console.error('Error adding question:', err)
    }
  }

  const handleSelectQuiz = async (quiz) => {
    try {
      const res = await learnService.getQuizById(quiz.id)
      setSelectedQuiz(res.data)
    } catch (err) {
      console.error('Error fetching quiz details:', err)
    }
  }

  const handleEditQuiz = (quiz) => {
    setQuizFormData(quiz)
    setEditingId(quiz.id)
    setShowForm(true)
  }

  const resetQuizForm = () => {
    setQuizFormData({
      lesson_id: '',
      title: '',
      description: '',
      passing_score: 70,
      time_limit: 300,
      is_active: true
    })
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) {
    return <div className="quiz-manager loading">Loading quizzes...</div>
  }

  return (
    <div className="admin-quiz-manager">
      <div className="manager-header">
        <h2>✅ Quiz Management</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Close' : '+ New Quiz'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="quiz-form" onSubmit={editingId ? handleUpdateQuiz : handleCreateQuiz}>
          <div className="form-row">
            <div className="form-group">
              <label>Lesson *</label>
              <select
                name="lesson_id"
                value={quizFormData.lesson_id}
                onChange={handleQuizInputChange}
                required
              >
                <option value="">Select a lesson</option>
                {lessons.map(lesson => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Quiz Title *</label>
              <input
                type="text"
                name="title"
                value={quizFormData.title}
                onChange={handleQuizInputChange}
                placeholder="Quiz title"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={quizFormData.description}
              onChange={handleQuizInputChange}
              placeholder="Quiz description"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Passing Score (%)</label>
              <input
                type="number"
                name="passing_score"
                value={quizFormData.passing_score}
                onChange={handleQuizInputChange}
                min="0"
                max="100"
              />
            </div>
            <div className="form-group">
              <label>Time Limit (seconds)</label>
              <input
                type="number"
                name="time_limit"
                value={quizFormData.time_limit}
                onChange={handleQuizInputChange}
                min="60"
              />
            </div>
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              name="is_active"
              checked={quizFormData.is_active}
              onChange={handleQuizInputChange}
              id="is_active_quiz"
            />
            <label htmlFor="is_active_quiz">Active (Published)</label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingId ? 'Update Quiz' : 'Create Quiz'}
            </button>
            <button type="button" className="btn-secondary" onClick={resetQuizForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="quiz-grid">
        <div className="quizzes-list">
          <h3>Quizzes</h3>
          <div className="quiz-items">
            {quizzes.map(quiz => (
              <div
                key={quiz.id}
                className={`quiz-item ${selectedQuiz?.id === quiz.id ? 'active' : ''}`}
                onClick={() => handleSelectQuiz(quiz)}
              >
                <div className="quiz-item-header">
                  <strong>{quiz.title}</strong>
                  <span className={`status ${quiz.is_active ? 'active' : 'inactive'}`}>
                    {quiz.is_active ? '✓' : '✕'}
                  </span>
                </div>
                <p className="quiz-item-lesson">Lesson: {quiz.lesson_id}</p>
                <div className="quiz-item-actions">
                  <button
                    className="btn-small btn-edit"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditQuiz(quiz)
                    }}
                  >
                    ✎
                  </button>
                  <button
                    className="btn-small btn-delete"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteQuiz(quiz.id)
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedQuiz && (
          <div className="quiz-detail">
            <h3>{selectedQuiz.title}</h3>
            <p>{selectedQuiz.description}</p>

            <div className="quiz-info">
              <div className="info-item">
                <span>Passing Score:</span>
                <strong>{selectedQuiz.passing_score}%</strong>
              </div>
              <div className="info-item">
                <span>Time Limit:</span>
                <strong>{Math.floor(selectedQuiz.time_limit / 60)}m</strong>
              </div>
            </div>

            <div className="questions-section">
              <div className="questions-header">
                <h4>Questions ({selectedQuiz.questions?.length || 0})</h4>
                <button
                  className="btn-small btn-primary"
                  onClick={() => setShowQuestionForm(!showQuestionForm)}
                >
                  {showQuestionForm ? '✕' : '+ Add Question'}
                </button>
              </div>

              {showQuestionForm && (
                <form className="question-form" onSubmit={handleAddQuestion}>
                  <div className="form-group">
                    <label>Question Text *</label>
                    <textarea
                      name="question_text"
                      value={questionFormData.question_text}
                      onChange={handleQuestionInputChange}
                      placeholder="Enter question"
                      required
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label>Question Type</label>
                    <select
                      name="question_type"
                      value={questionFormData.question_type}
                      onChange={handleQuestionInputChange}
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="true_false">True/False</option>
                    </select>
                  </div>

                  {questionFormData.question_type === 'multiple_choice' && (
                    <>
                      {['a', 'b', 'c', 'd'].map(letter => (
                        <div key={letter} className="form-group">
                          <label>Option {letter.toUpperCase()} *</label>
                          <input
                            type="text"
                            name={`option_${letter}`}
                            value={questionFormData[`option_${letter}`]}
                            onChange={handleQuestionInputChange}
                            placeholder={`Option ${letter.toUpperCase()}`}
                            required
                          />
                        </div>
                      ))}

                      <div className="form-group">
                        <label>Correct Answer *</label>
                        <select
                          name="correct_answer"
                          value={questionFormData.correct_answer}
                          onChange={handleQuestionInputChange}
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div className="form-actions">
                    <button type="submit" className="btn-primary btn-sm">
                      Add Question
                    </button>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => setShowQuestionForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="questions-list">
                {selectedQuiz.questions && selectedQuiz.questions.map((q, idx) => (
                  <div key={q.id} className="question-item">
                    <div className="question-number">{idx + 1}</div>
                    <div className="question-content">
                      <p>{q.question_text}</p>
                      <p className="correct-answer">Correct: {q.correct_answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminQuizManager
