import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogOut, User, Home, BookOpen, CheckCircle, Zap, BarChart3 } from 'lucide-react'

const Layout = ({ children, isAdmin = false, onLogout = () => {} }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/learn', label: 'Learn', icon: BookOpen },
    { href: '/quiz', label: 'Quizzes', icon: CheckCircle },
    { href: '/gesture', label: 'Recognition', icon: Zap },
  ]

  const adminLinks = isAdmin ? [
    { href: '/admin', label: 'Admin', icon: BarChart3 },
  ] : []

  const allNavLinks = [...navLinks, ...adminLinks]

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navigation Bar */}
      <nav className="border-b border-border bg-white dark:bg-slate-950 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SL</span>
              </div>
              <span className="hidden sm:inline font-bold text-lg text-foreground">
                Sign Language AI
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              {allNavLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon size={16} />
                    {link.label}
                  </Link>
                )
              })}
            </div>

            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/profile"
                className={`p-2 rounded-lg transition-colors ${
                  isActive('/profile')
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <User size={20} />
              </Link>
              <button
                onClick={onLogout}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-muted"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border bg-card"
            >
              <div className="px-4 py-3 space-y-2">
                {allNavLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive(link.href)
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon size={18} />
                      {link.label}
                    </Link>
                  )
                })}
                <div className="pt-2 border-t border-border space-y-2">
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive('/profile')
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <User size={18} />
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      onLogout()
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card text-muted-foreground py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            © 2024 Sign Language AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
