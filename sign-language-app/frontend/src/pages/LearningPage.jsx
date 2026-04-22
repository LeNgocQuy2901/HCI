import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, ArrowRight } from 'lucide-react'

const LearningPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      className="py-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="text-center mb-12">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
          <BookOpen size={32} className="text-white" />
        </div>
        <h1 className="section-title mb-4">Learn Vocabulary</h1>
        <p className="section-subtitle max-w-2xl mx-auto">
          Master sign language with our interactive vocabulary lessons. Learn at your own pace with video demonstrations and interactive quizzes.
        </p>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="card text-center py-16"
      >
        <p className="text-muted-foreground mb-4">
          Learning modules coming soon! Check back later for comprehensive vocabulary lessons.
        </p>
        <button className="btn-primary rounded-full px-6 py-2 inline-flex gap-2">
          View Lessons
          <ArrowRight size={18} />
        </button>
      </motion.div>
    </motion.div>
  )
}

export default LearningPage
