import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, LogOut, Settings, Trophy, Flame, Target } from 'lucide-react'
import { authAPI } from '../services/authService'

const UserProfilePage = () => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser()
    setUser(currentUser)
  }, [])

  const stats = [
    { label: 'Lessons Completed', value: 0, icon: Trophy },
    { label: 'Current Streak', value: 0, icon: Flame },
    { label: 'Words Learned', value: 0, icon: Target },
  ]

  if (!user) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  return (
    <motion.div
      className="py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Profile Header */}
      <motion.div
        className="card bg-gradient-to-r from-primary/10 to-secondary/10 mb-8 overflow-hidden"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
      >
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl">
            <User size={48} className="text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-foreground">{user.username}</h1>
            <p className="text-muted-foreground flex items-center gap-2 justify-center md:justify-start">
              <Mail size={16} />
              {user.email}
            </p>
            {user.full_name && (
              <p className="text-foreground">{user.full_name}</p>
            )}
          </div>
          <button className="btn-secondary rounded-lg px-6 py-2 inline-flex gap-2">
            <Settings size={18} />
            Settings
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
          },
        }}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={index}
              className="card text-center"
              variants={{ hidden: { y: 20 }, visible: { y: 0 } }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Icon size={24} className="text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Settings */}
      <motion.div
        className="card"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-6">Profile Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Username
            </label>
            <input
              type="text"
              value={user.username}
              disabled
              className="input-field w-full bg-muted"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="input-field w-full bg-muted"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button className="btn-primary rounded-lg px-6 py-2">
              Save Changes
            </button>
            <button className="btn-outline rounded-lg px-6 py-2 inline-flex gap-2 text-destructive">
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default UserProfilePage
