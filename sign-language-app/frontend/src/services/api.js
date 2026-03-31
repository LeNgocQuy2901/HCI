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
  return config
})

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
}

export const gestureService = {
  recognizeGesture: (imageData) => api.post('/gesture/recognize', imageData),
  listGestures: () => api.get('/gesture/list'),
}

export const chatService = {
  getMessages: (userId) => api.get(`/chat/messages/${userId}`),
  sendMessage: (data) => api.post('/chat/send', data),
  getChatRooms: () => api.get('/chat/rooms'),
}

export const learnService = {
  getLessons: () => api.get('/learn/lessons'),
  getLesson: (lessonId) => api.get(`/learn/lesson/${lessonId}`),
  submitQuiz: (data) => api.post('/learn/quiz', data),
  getVocabulary: () => api.get('/learn/vocabulary'),
}

export const profileService = {
  getProfile: () => api.get('/profile/me'),
  updateProfile: (data) => api.put('/profile/update', data),
  getSavedWords: () => api.get('/profile/saved-words'),
}

export default api
