import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Zap, Tv, Users, Video, MessageCircle, Star, ArrowRight, CheckCircle2, Flame, Trophy, Target } from 'lucide-react'
import { authAPI } from '../services/authService'

const HomeDashboard = () => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
    }
  }, [])

  const features = [
    {
      icon: BookOpen,
      title: "Learn Vocabulary",
      description:
        "Build your sign language skills with our comprehensive vocabulary library. Learn at your own pace with interactive lessons.",
      href: "/learn",
      color: "from-blue-500/10 to-blue-600/10",
      borderColor: "border-blue-500/20",
    },
    {
      icon: Zap,
      title: "Real-time Recognition",
      description:
        "Our AI-powered camera recognizes sign language in real-time. See your signs translated instantly.",
      href: "/gesture",
      color: "from-purple-500/10 to-purple-600/10",
      borderColor: "border-purple-500/20",
    },
    {
      icon: Video,
      title: "Interactive Quizzes",
      description:
        "Test your knowledge with interactive quizzes and get detailed feedback on your progress.",
      href: "/quiz",
      color: "from-pink-500/10 to-pink-600/10",
      borderColor: "border-pink-500/20",
    },
    {
      icon: Users,
      title: "Community Support",
      description:
        "Connect with other sign language learners and get help from experienced community members.",
      href: "/profile",
      color: "from-green-500/10 to-green-600/10",
      borderColor: "border-green-500/20",
    },
  ]

  const stats = [
    { number: "10K+", label: "Words & Phrases" },
    { number: "50K+", label: "Active Users" },
    { number: "99%", label: "Accuracy Rate" },
  ]

  const benefits = [
    "Free and accessible to everyone",
    "Works on any device",
    "Offline learning modes",
    "Progress tracking and achievements",
    "Community support",
    "Regular updates and new content",
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <div className="w-full bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent py-16 md:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid md:grid-cols-2 gap-12 items-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Left: Text Content */}
            <motion.div className="space-y-8" variants={itemVariants}>
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold leading-tight text-foreground">
                  Learn and Communicate with
                  <span className="text-gradient">
                    {" "}
                    Sign Language
                  </span>
                  using AI
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {user 
                    ? `Welcome back, ${user.username}! Continue your sign language journey and unlock new skills every day.`
                    : "Break down communication barriers with our AI-powered sign language platform. Learn vocabulary, translate in real-time, and connect with a supportive community."
                  }
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/learn"
                    className="btn-primary inline-flex gap-2 w-full sm:w-auto justify-center rounded-full px-8 py-3 text-lg"
                  >
                    Start Learning
                    <ArrowRight size={20} />
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button
                    className="btn-outline inline-flex gap-2 w-full sm:w-auto justify-center rounded-full px-8 py-3 text-lg"
                  >
                    Learn More
                  </button>
                </motion.div>
              </div>
            </motion.div>

            {/* Right: Stats Card */}
            <motion.div
              variants={itemVariants}
              className="hidden md:grid grid-cols-1 gap-6"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="card bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20"
                >
                  <div className="text-4xl font-bold text-primary mb-2">
                    {stat.number}
                  </div>
                  <p className="text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="section-title mb-4">Powerful Features</h2>
            <p className="section-subtitle max-w-2xl mx-auto">
              Everything you need to master sign language and communicate effectively
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className={`card border ${feature.borderColor} ${feature.color} hover:shadow-lg transition-all`}
                >
                  <div className="mb-4 w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground mb-4 text-sm">{feature.description}</p>
                  <Link
                    to={feature.href}
                    className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
                  >
                    Get Started
                    <ArrowRight size={16} />
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid md:grid-cols-2 gap-12 items-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div
              variants={itemVariants}
              className="space-y-8"
            >
              <div>
                <h2 className="section-title mb-4">Why Choose Sign Language AI?</h2>
                <p className="section-subtitle">
                  We're committed to making sign language learning accessible, effective, and enjoyable for everyone.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 size={20} className="text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-2 gap-4"
            >
              <motion.div variants={itemVariants} className="card text-center">
                <Trophy size={32} className="mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold text-primary">500+</div>
                <p className="text-sm text-muted-foreground">Lessons</p>
              </motion.div>
              <motion.div variants={itemVariants} className="card text-center">
                <Star size={32} className="mx-auto mb-2 text-accent" />
                <div className="text-2xl font-bold text-accent">4.9/5</div>
                <p className="text-sm text-muted-foreground">Rating</p>
              </motion.div>
              <motion.div variants={itemVariants} className="card text-center">
                <Target size={32} className="mx-auto mb-2 text-secondary" />
                <div className="text-2xl font-bold text-secondary">10K+</div>
                <p className="text-sm text-muted-foreground">Words</p>
              </motion.div>
              <motion.div variants={itemVariants} className="card text-center">
                <Flame size={32} className="mx-auto mb-2 text-destructive" />
                <div className="text-2xl font-bold text-destructive">50K+</div>
                <p className="text-sm text-muted-foreground">Users</p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="card bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="section-title mb-4">Ready to Start Learning?</h2>
              <p className="section-subtitle mb-8 max-w-2xl mx-auto">
                Join thousands of learners who are breaking communication barriers with sign language.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/login"
                  className="btn-primary rounded-full px-8 py-3"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-secondary rounded-full px-8 py-3"
                >
                  Sign Up for Free
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  )
}

export default HomeDashboard
