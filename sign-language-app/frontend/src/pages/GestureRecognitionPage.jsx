import React from 'react'
import { motion } from 'framer-motion'
import { Zap, ArrowRight } from 'lucide-react'

const GestureRecognitionPage = () => {
  return (
    <motion.div
      className="py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div className="text-center mb-12" initial={{ y: 20 }} animate={{ y: 0 }}>
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Zap size={32} className="text-white" />
        </div>
        <h1 className="section-title mb-4">Real-time Recognition</h1>
        <p className="section-subtitle max-w-2xl mx-auto">
          Our AI-powered camera recognizes sign language in real-time. See your signs translated instantly using advanced machine learning.
        </p>
      </motion.div>

      <motion.div
        className="card text-center py-16"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-muted-foreground mb-4">
          Real-time gesture recognition is coming soon! We're training our AI models to recognize signs accurately.
        </p>
        <button className="btn-primary rounded-full px-6 py-2 inline-flex gap-2">
          Try Recognition
          <ArrowRight size={18} />
        </button>
      </motion.div>
    </motion.div>
  )
}

export default GestureRecognitionPage
