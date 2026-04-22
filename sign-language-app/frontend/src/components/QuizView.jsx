import React, { useState, useEffect } from 'react'
import { learnService } from '../services/api'
import './QuizView.css'

const QuizView = ({ lessonId, quiz: initialQuiz }) => {
  const [quiz, setQuiz] = useState(initialQuiz)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(!initialQuiz)
  const [quizStarted, setQuizStarted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (initialQuiz) {
      setQuiz(initialQuiz)
      fetchQuestions(initialQuiz.id)
    }
  }, [initialQuiz, lessonId])

  // Timer effect
  useEffect(() => {
    if (!quizStarted || submitted || !timeLeft) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmitQuiz()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [quizStarted, submitted])

  const fetchQuestions = async (quizId) => {
    try {
      setLoading(true)
      const response = await learnService.getQuizQuestions(quizId)
      setQuestions(response.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching questions:', err)
      setError('Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleStartQuiz = () => {
    setQuizStarted(true)
    setTimeLeft(quiz.time_limit)
    setAnswers({})
    setCurrentQuestion(0)
    setSubmitted(false)
  }

  const handleAnswerSelect = (answer) => {
    setAnswers({
      ...answers,
      [questions[currentQuestion].id]: answer
    })
  }

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmitQuiz = async () => {
    try {
      setSubmitted(true)
      const userId = localStorage.getItem('userId') // You should store this
      
      // Calculate score
      let correctCount = 0
      questions.forEach(q => {
        if (answers[q.id] === q.correct_answer) {
          correctCount++
        }
      })

      const response = await learnService.submitQuiz(userId, {
        quiz_id: quiz.id,
        answers: answers,
        time_taken: quiz.time_limit - timeLeft
      })

      setResult(response.data)
    } catch (err) {
      console.error('Error submitting quiz:', err)
      setError('Failed to submit quiz')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return <div className="quiz-view loading">Loading quiz...</div>
  }

  if (error) {
    return <div className="quiz-view error">{error}</div>
  }

  if (!quiz) {
    return <div className="quiz-view empty">No quiz available for this lesson</div>
  }

  if (!quizStarted) {
    return (
      <div className="quiz-view start-screen">
        <div className="quiz-info">
          <h2>{quiz.title}</h2>
          <p>{quiz.description}</p>
          <div className="quiz-stats">
            <div className="stat">
              <span className="stat-label">Questions:</span>
              <span className="stat-value">{questions.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Time Limit:</span>
              <span className="stat-value">{formatTime(quiz.time_limit)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Passing Score:</span>
              <span className="stat-value">{quiz.passing_score}%</span>
            </div>
          </div>
          <button className="start-quiz-btn" onClick={handleStartQuiz}>
            Start Quiz
          </button>
        </div>
      </div>
    )
  }

  if (submitted && result) {
    const isPassed = result.is_passed
    return (
      <div className="quiz-view result-screen">
        <div className={`result-card ${isPassed ? 'passed' : 'failed'}`}>
          <h2>{isPassed ? '🎉 Congratulations!' : '📝 Try Again'}</h2>
          <div className="result-score">
            <span className="score">{result.score}%</span>
            <span className="status">{isPassed ? 'PASSED' : 'FAILED'}</span>
          </div>
          <div className="result-details">
            <p>Correct Answers: {result.correct_answers} / {result.total_questions}</p>
            <p>Time Taken: {formatTime(result.time_taken)}</p>
            <p>Passing Score: {quiz.passing_score}%</p>
          </div>
          <button className="retry-btn" onClick={() => {
            setQuizStarted(false)
            setSubmitted(false)
            setResult(null)
          }}>
            Retry Quiz
          </button>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]
  if (!question) return null

  return (
    <div className="quiz-view quiz-active">
      <div className="quiz-header">
        <div className="quiz-progress">
          Question {currentQuestion + 1} / {questions.length}
        </div>
        <div className={`quiz-timer ${timeLeft < 60 ? 'warning' : ''}`}>
          ⏱️ {formatTime(timeLeft)}
        </div>
      </div>

      <div className="quiz-question">
        <h3>{question.question_text}</h3>

        {question.image_url && (
          <img src={question.image_url} alt="Question" className="question-image" />
        )}

        {question.video_url && (
          <div className="question-video">
            <video controls width="100%">
              <source src={question.video_url} type="video/mp4" />
            </video>
          </div>
        )}

        <div className="question-options">
          {question.question_type === 'multiple_choice' && (
            <>
              {['option_a', 'option_b', 'option_c', 'option_d'].map((option, idx) => {
                const optionValue = question[option]
                if (!optionValue) return null

                const optionLetter = String.fromCharCode(65 + idx)
                return (
                  <label key={option} className="option">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={optionLetter}
                      checked={answers[question.id] === optionLetter}
                      onChange={() => handleAnswerSelect(optionLetter)}
                    />
                    <span>{optionLetter}. {optionValue}</span>
                  </label>
                )
              })}
            </>
          )}

          {question.question_type === 'true_false' && (
            <>
              <label className="option">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value="true"
                  checked={answers[question.id] === 'true'}
                  onChange={() => handleAnswerSelect('true')}
                />
                <span>True</span>
              </label>
              <label className="option">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value="false"
                  checked={answers[question.id] === 'false'}
                  onChange={() => handleAnswerSelect('false')}
                />
                <span>False</span>
              </label>
            </>
          )}
        </div>
      </div>

      <div className="quiz-navigation">
        <button 
          onClick={handlePreviousQuestion}
          disabled={currentQuestion === 0}
          className="nav-btn"
        >
          ← Previous
        </button>

        <div className="question-indicators">
          {questions.map((_, idx) => (
            <button
              key={idx}
              className={`indicator ${idx === currentQuestion ? 'current' : ''} ${answers[questions[idx].id] ? 'answered' : ''}`}
              onClick={() => setCurrentQuestion(idx)}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {currentQuestion === questions.length - 1 ? (
          <button 
            onClick={handleSubmitQuiz}
            className="submit-btn"
          >
            Submit Quiz ✓
          </button>
        ) : (
          <button 
            onClick={handleNextQuestion}
            className="nav-btn"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  )
}

export default QuizView
