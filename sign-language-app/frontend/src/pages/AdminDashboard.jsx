import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AdminDashboardStats from '../components/AdminDashboardStats'
import AdminLessonManager from '../components/AdminLessonManager'
import AdminQuizManager from '../components/AdminQuizManager'
import AdminBulkImport from '../components/AdminBulkImport'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch stats if needed
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.h1 className="section-title mb-8" initial={{ y: 20 }} animate={{ y: 0 }}>
        Admin Dashboard
      </motion.h1>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
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
              className={`card bg-gradient-to-br ${stat.color} bg-opacity-5 border-2 border-${stat.color}`}
              variants={{ hidden: { y: 20 }, visible: { y: 0 } }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
                  <div className="text-4xl font-bold text-foreground mt-2">{stat.value}</div>
                </div>
                <Icon size={32} className="text-primary" />
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Admin Actions */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 },
          },
        }}
        initial="hidden"
        animate="visible"
      >
        {adminActions.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.div
              key={index}
              className="card cursor-pointer hover:shadow-lg hover:border-primary transition-all"
              variants={{ hidden: { y: 20 }, visible: { y: 0 } }}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon size={24} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{action.label}</h3>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Info Box */}
      <motion.div
        className="card bg-accent/10 border border-accent/30 mt-8 text-center"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-muted-foreground">
          Admin features are being developed. Full administrative controls coming soon.
        </p>
      </motion.div>
    </motion.div>
  )
}

export default AdminDashboard
