import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Globe, Users, Zap, MapPin, DollarSign, CheckSquare, Compass, Sparkles } from 'lucide-react'

const Home = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.08 }
    }
  }

  const itemVariants = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }

  const features = [
    {
      icon: MapPin,
      title: 'Smart Itinerary',
      description: 'Create personalized multi-city itineraries with interactive maps'
    },
    {
      icon: DollarSign,
      title: 'Budget Tracking',
      description: 'Track expenses and manage your travel budget efficiently'
    },
    {
      icon: Users,
      title: 'Share & Collaborate',
      description: 'Share your trips with friends and get feedback'
    },
    {
      icon: Zap,
      title: 'Smart Recommendations',
      description: 'Get personalized activity and destination suggestions'
    },
    {
      icon: Globe,
      title: 'Global Coverage',
      description: 'Discover activities in 195+ countries worldwide'
    },
    {
      icon: CheckSquare,
      title: 'Packing Checklist',
      description: 'Never forget important items with smart checklists'
    }
  ]

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-300/35 blur-3xl rounded-full" />
        <div className="absolute top-32 right-6 w-80 h-80 bg-emerald-300/30 blur-3xl rounded-full" />
        <div className="absolute bottom-16 left-1/3 w-72 h-72 bg-amber-300/20 blur-3xl rounded-full" />
      </div>

      <nav className="sticky top-0 z-50 glass border-b border-white/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent tracking-tight">
            ✈️ Traveloop
          </div>
          <div className="flex gap-4">
            <Link to="/login" className="px-6 py-2 text-slate-600 font-medium hover:text-slate-900 transition rounded-lg hover:bg-white/60">
              Login
            </Link>
            <Link to="/signup" className="px-6 py-2 brand-button rounded-lg font-medium transition">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 py-20 relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          <motion.div variants={itemVariants} className="space-y-7">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/75 border border-white/70 text-sm text-slate-700">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              Intelligent trip planning for modern travelers
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
              Plan Your Perfect <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">Journey</span>
            </h1>
            <p className="text-xl text-slate-600">
              Traveloop helps you create detailed itineraries, manage budgets, discover amazing activities, and share your travel plans with friends—all in one beautiful platform.
            </p>
            <div className="flex gap-4">
              <Link to="/signup" className="px-8 py-3 brand-button rounded-xl font-medium transition flex items-center gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login" className="px-8 py-3 border border-slate-300 text-slate-600 rounded-xl font-medium hover:bg-white/70 transition">
                Learn More
              </Link>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="relative">
            <div className="premium-card rounded-3xl p-8 border border-white/40 backdrop-blur-md interactive-lift">
              <div className="aspect-square rounded-2xl p-6 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-800 text-white relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-cyan-300/25" />
                <div className="absolute -left-8 bottom-6 w-32 h-32 rounded-full bg-amber-200/20" />
                <div className="relative z-10 space-y-5">
                  <p className="text-sm text-cyan-100">Next Adventure</p>
                  <h3 className="text-2xl font-semibold">Lisbon + Porto Escape</h3>
                  <div className="space-y-2 text-sm text-cyan-50/90">
                    <p className="flex items-center gap-2"><Compass className="w-4 h-4" />5 Stops Curated</p>
                    <p className="flex items-center gap-2"><DollarSign className="w-4 h-4" />Budget Smart Tracking</p>
                    <p className="flex items-center gap-2"><CheckSquare className="w-4 h-4" />Packing Synced</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          variants={itemVariants}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Everything You Need
          </h2>
          <p className="text-xl text-slate-600">
            Powerful features to plan, organize, and share your adventures
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="premium-card interactive-lift rounded-xl p-6"
              >
                <Icon className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          variants={itemVariants}
          className="premium-card rounded-2xl p-12 text-center backdrop-blur-md"
        >
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Join thousands of travelers planning their perfect trips
          </p>
          <Link
            to="/signup"
            className="inline-block px-8 py-3 brand-button rounded-lg font-medium transition"
          >
            Create Free Account
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/20 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-600">
          <p>&copy; 2024 Traveloop. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Home
