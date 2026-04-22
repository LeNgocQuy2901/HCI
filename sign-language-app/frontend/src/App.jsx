import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

// Pages
import HomeDashboard from './pages/HomeDashboard'
import LearningPage from './pages/LearningPage'
import QuizPage from './pages/QuizPage'
import GestureRecognitionPage from './pages/GestureRecognitionPage'
import UserProfilePage from './pages/UserProfilePage'
import { LoginPage, RegisterPage, ForgotPasswordPage } from './pages/AuthPages'
import AdminDashboard from './pages/AdminDashboard'

// Layouts & Components
import Layout from './components/Layout'

// Styles
import './global.css'
import './App.css'

// Import auth service
import { authAPI } from './services/authService'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check if user is already logged in on mount
  useEffect(() => {
    const isAuth = authAPI.isAuthenticated()
    setIsAuthenticated(isAuth)
    
    // TODO: Check user role/admin status from user data
    const user = authAPI.getCurrentUser()
    if (user && user.is_admin) {
      setIsAdmin(true)
    }
    
    setLoading(false)
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
    const user = authAPI.getCurrentUser()
    if (user && user.is_admin) {
      setIsAdmin(true)
    }
  }

  const handleRegister = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    authAPI.logout()
    setIsAuthenticated(false)
    setIsAdmin(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, only show auth pages
  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage onRegister={handleRegister} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="*" element={<LoginPage onLogin={handleLogin} />} />
        </Routes>
      </Router>
    )
  }

  // After authentication, show all routes
  return (
    <Router>
      <Layout isAdmin={isAdmin} onLogout={handleLogout}>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Main App Routes */}
            <Route path="/" element={<HomeDashboard />} />
            <Route path="/learn" element={<LearningPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/gesture" element={<GestureRecognitionPage />} />
            <Route path="/profile" element={<UserProfilePage />} />

            {/* Admin Routes */}
            {isAdmin && <Route path="/admin" element={<AdminDashboard />} />}

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/register" element={<RegisterPage onRegister={handleRegister} />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Fallback */}
            <Route path="*" element={<HomeDashboard />} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </Router>
  )
}

export default App
