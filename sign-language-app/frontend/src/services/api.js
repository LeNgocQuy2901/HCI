import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Remove Content-Type for FormData so browser sets it correctly
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
}

export const gestureService = {
  recognizeGesture: (imageData) => {
    // imageData should be FormData with 'image' field
    return api.post('/gesture/recognize', imageData)
  },
  listGestures: () => api.get('/gesture/list'),
}

export const chatService = {
  getMessages: (userId) => api.get(`/chat/messages/${userId}`),
  sendMessage: (data) => api.post('/chat/send', data),
  getChatRooms: () => api.get('/chat/rooms'),
}

export const learnService = {
  // ========== LESSONS ==========
  getLessons: (level = null) => {
    const params = level ? `?level=${level}` : ''
    return api.get(`/learn/lessons${params}`)
  },
  getLesson: (lessonId) => api.get(`/learn/lessons/${lessonId}`),
  createLesson: (data) => api.post('/learn/lessons', data),
  updateLesson: (lessonId, data) => api.put(`/learn/lessons/${lessonId}`, data),
  deleteLesson: (lessonId) => api.delete(`/learn/lessons/${lessonId}`),
  
  // ========== VOCABULARY ==========
  getVocabularies: (lessonId) => api.get(`/learn/lessons/${lessonId}/vocabularies`),
  createVocabulary: (data) => api.post('/learn/vocabularies', data),
  updateVocabulary: (vocabId, data) => api.put(`/learn/vocabularies/${vocabId}`, data),
  deleteVocabulary: (vocabId) => api.delete(`/learn/vocabularies/${vocabId}`),
  
  // ========== QUIZ ==========
  getQuiz: (lessonId) => api.get(`/learn/lessons/${lessonId}/quiz`),
  getQuizById: (quizId) => api.get(`/learn/quizzes/${quizId}`),
  createQuiz: (data) => api.post('/learn/quizzes', data),
  updateQuiz: (quizId, data) => api.put(`/learn/quizzes/${quizId}`, data),
  deleteQuiz: (quizId) => api.delete(`/learn/quizzes/${quizId}`),
  
  // ========== QUIZ QUESTIONS ==========
  getQuizQuestions: (quizId) => api.get(`/learn/quizzes/${quizId}/questions`),
  createQuestion: (data) => api.post('/learn/questions', data),
  updateQuestion: (questionId, data) => api.put(`/learn/questions/${questionId}`, data),
  
  // ========== USER PROGRESS ==========
  getUserProgress: (userId) => api.get(`/learn/users/${userId}/progress`),
  getProgressSummary: (userId) => api.get(`/learn/users/${userId}/progress/summary`),
  createProgress: (data) => api.post('/learn/progress', data),
  updateProgress: (userId, lessonId, data) => api.put(`/learn/users/${userId}/lessons/${lessonId}/progress`, data),
  
  // ========== QUIZ RESULTS ==========
  submitQuiz: (userId, data) => api.post(`/learn/quiz/submit?user_id=${userId}`, data),
  getQuizResults: (userId, quizId) => api.get(`/learn/users/${userId}/quiz/${quizId}/results`),
  getLatestQuizResult: (userId, quizId) => api.get(`/learn/users/${userId}/quiz/${quizId}/latest-result`),
}

export const adminService = {
  // ========== DASHBOARD ==========
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  
  // ========== LESSONS (ADMIN) ==========
  getAllLessonsAdmin: (level = null, isActive = null) => {
    const params = new URLSearchParams()
    if (level) params.append('level', level)
    if (isActive !== null) params.append('is_active', isActive)
    return api.get(`/admin/lessons?${params.toString()}`)
  },
  createLessonAdmin: (data) => api.post('/admin/lessons', data),
  updateLessonAdmin: (lessonId, data) => api.put(`/admin/lessons/${lessonId}`, data),
  deleteLessonAdmin: (lessonId) => api.delete(`/admin/lessons/${lessonId}`),
  publishLesson: (lessonId) => api.post(`/admin/lessons/${lessonId}/publish`),
  unpublishLesson: (lessonId) => api.post(`/admin/lessons/${lessonId}/unpublish`),
  bulkPublishLessons: (lessonIds) => api.post('/admin/lessons/bulk-publish', lessonIds),
  bulkDeleteLessons: (lessonIds) => api.post('/admin/lessons/bulk-delete', lessonIds),
  
  // ========== VOCABULARY (ADMIN) ==========
  getVocabulariesAdmin: (lessonId) => api.get(`/admin/lessons/${lessonId}/vocabularies`),
  createVocabularyAdmin: (data) => api.post('/admin/vocabularies', data),
  updateVocabularyAdmin: (vocabId, data) => api.put(`/admin/vocabularies/${vocabId}`, data),
  deleteVocabularyAdmin: (vocabId) => api.delete(`/admin/vocabularies/${vocabId}`),
  
  // ========== QUIZ (ADMIN) ==========
  getAllQuizzesAdmin: (isActive = null) => {
    const params = isActive !== null ? `?is_active=${isActive}` : ''
    return api.get(`/admin/quizzes${params}`)
  },
  createQuizAdmin: (data) => api.post('/admin/quizzes', data),
  updateQuizAdmin: (quizId, data) => api.put(`/admin/quizzes/${quizId}`, data),
  deleteQuizAdmin: (quizId) => api.delete(`/admin/quizzes/${quizId}`),
  
  // ========== QUESTIONS (ADMIN) ==========
  getQuestionsAdmin: (quizId) => api.get(`/admin/quizzes/${quizId}/questions`),
  createQuestionAdmin: (data) => api.post('/admin/questions', data),
  updateQuestionAdmin: (questionId, data) => api.put(`/admin/questions/${questionId}`, data),
  deleteQuestionAdmin: (questionId) => api.delete(`/admin/questions/${questionId}`),
  
  // ========== ANALYTICS ==========
  getLessonAnalytics: (lessonId) => api.get(`/admin/analytics/lesson/${lessonId}`),
  getQuizAnalytics: (quizId) => api.get(`/admin/analytics/quiz/${quizId}`),
  
  // ========== EXPORT ==========
  exportLessons: () => api.get('/admin/export/lessons'),
}
