import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Calendar, DollarSign, MapPin, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

const Dashboard = () => {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalBudget: 0,
    upcomingTrips: 0
  })

  useEffect(() => {
    fetchTrips()
  }, [])

  const fetchTrips = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('http://localhost:8000/api/trips/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setTrips(data.results || data || [])
        
        // Calculate stats
        setStats({
          totalTrips: data.length,
          totalBudget: data.reduce((sum, trip) => sum + parseFloat(trip.total_budget || 0), 0),
          upcomingTrips: data.filter(trip => new Date(trip.start_date) > new Date()).length
        })
      }
    } catch (error) {
      console.error('Error fetching trips:', error)
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="page-shell">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header"
      >
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's your travel overview</p>
        </div>
        <Link
          to="/create-trip"
          className="flex items-center gap-2 brand-button px-6 py-3 rounded-xl font-medium transition"
        >
          <Plus className="w-5 h-5" />
          New Trip
        </Link>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div variants={itemVariants} className="premium-card interactive-lift rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Trips</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.totalTrips}</h3>
            </div>
            <MapPin className="w-10 h-10 text-blue-500 opacity-20" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="premium-card interactive-lift rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Budget</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">${stats.totalBudget.toFixed(2)}</h3>
            </div>
            <DollarSign className="w-10 h-10 text-green-500 opacity-20" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="premium-card interactive-lift rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Upcoming</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.upcomingTrips}</h3>
            </div>
            <Calendar className="w-10 h-10 text-purple-500 opacity-20" />
          </div>
        </motion.div>
      </motion.div>

      {/* Recent Trips */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold text-slate-900">Recent Trips</h2>
        
        {loading ? (
          <div className="premium-card rounded-xl p-8 text-center">
            <p className="text-slate-600">Loading your trips...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="premium-card rounded-xl p-8 text-center">
            <p className="text-slate-600 mb-4">No trips yet. Create your first trip!</p>
            <Link
              to="/create-trip"
                className="inline-block brand-button px-6 py-2 rounded-lg font-medium transition"
            >
              Create Trip
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.slice(0, 5).map((trip) => (
              <Link
                key={trip.id}
                to={`/trip/${trip.id}`}
                className="glass border border-white/20 rounded-xl overflow-hidden hover:border-purple-400/50 transition group"
              >
                <div className="h-40 bg-gradient-to-br from-blue-400 to-purple-400 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition" />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-slate-900 mb-2">{trip.title}</h3>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Budget: ${trip.total_budget}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {trip.stops?.length || 0} cities
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default Dashboard
