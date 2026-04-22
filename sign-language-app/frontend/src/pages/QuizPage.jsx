import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight } from 'lucide-react'

const QuizPage = () => {
  return (
    <motion.div
      className="py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div className="text-center mb-12" initial={{ y: 20 }} animate={{ y: 0 }}>
        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-white" />
        </div>
        <h1 className="section-title mb-4">Interactive Quizzes</h1>
        <p className="section-subtitle max-w-2xl mx-auto">
          Test your knowledge with interactive quizzes and get detailed feedback on your progress.
        </p>
      </motion.div>

      <motion.div
        className="card text-center py-16"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-muted-foreground mb-4">
          Quizzes coming soon! Start with our learning modules to prepare.
        </p>
        <button className="btn-primary rounded-full px-6 py-2 inline-flex gap-2">
          Take a Quiz
          <ArrowRight size={18} />
        </button>
      </motion.div>
    </motion.div>
  )
}

export default QuizPage
