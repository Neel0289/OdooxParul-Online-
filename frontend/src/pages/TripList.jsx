import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Calendar, DollarSign, MapPin, MoreHorizontal, Trash2, Edit, Eye } from 'lucide-react'

const TripList = () => {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchTrips()
  }, [filter])

  const fetchTrips = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      const response = await fetch('http://localhost:8000/api/trips/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        let filteredTrips = data.results || data
        
        // Filter by date
        const now = new Date()
        if (filter === 'upcoming') {
          filteredTrips = filteredTrips.filter(trip => new Date(trip.start_date) > now)
        } else if (filter === 'past') {
          filteredTrips = filteredTrips.filter(trip => new Date(trip.end_date) < now)
        } else if (filter === 'current') {
          filteredTrips = filteredTrips.filter(trip => 
            new Date(trip.start_date) <= now && new Date(trip.end_date) >= now
          )
        }
        
        setTrips(filteredTrips)
      }
    } catch (err) {
      setError('Failed to load trips')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return
    
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`http://localhost:8000/api/trips/${tripId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        setTrips(trips.filter(t => t.id !== tripId))
      }
    } catch (err) {
      console.error('Error deleting trip:', err)
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
          <h1 className="page-title">My Trips</h1>
          <p className="page-subtitle">Manage and organize all your travel plans</p>
        </div>
        <Link
          to="/create-trip"
          className="flex items-center gap-2 brand-button px-6 py-3 rounded-xl font-medium transition"
        >
          <Plus className="w-5 h-5" />
          New Trip
        </Link>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-3 flex-wrap"
      >
        {['all', 'upcoming', 'current', 'past'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === f
                ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white'
                : 'premium-card text-slate-700 hover:border-blue-300'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="premium-card border border-red-200/50 bg-red-50/50 text-red-700 px-6 py-4 rounded-xl"
        >
          {error}
        </motion.div>
      )}

      {/* Trips Grid */}
      {loading ? (
        <div className="premium-card rounded-xl p-8 text-center">
          <p className="text-slate-600">Loading your trips...</p>
        </div>
      ) : trips.length === 0 ? (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="premium-card rounded-xl p-12 text-center backdrop-blur-md"
        >
          <MapPin className="w-16 h-16 text-slate-400 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No trips found</h2>
          <p className="text-slate-600 mb-6">
            {filter === 'all'
              ? "Start planning your first adventure!"
              : `No ${filter} trips yet.`}
          </p>
          <Link
            to="/create-trip"
            className="inline-block brand-button px-6 py-2 rounded-lg font-medium transition"
          >
            Create First Trip
          </Link>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {trips.map((trip) => (
            <motion.div
              key={trip.id}
              variants={itemVariants}
              className="premium-card interactive-lift rounded-xl overflow-hidden transition group backdrop-blur-md"
            >
              {/* Cover Image */}
              <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-400 relative overflow-hidden">
                {trip.cover_photo && (
                  <img src={trip.cover_photo} alt={trip.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition" />
                
                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(trip.id)}
                  className="absolute top-3 right-3 bg-white/80 hover:bg-red-50 text-red-600 p-2 rounded-lg transition"
                  title="Delete trip"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Trip Info */}
              <div className="p-6">
                <h3 className="font-bold text-lg text-slate-900 mb-3 line-clamp-1">{trip.title}</h3>
                
                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {new Date(trip.start_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })} - {new Date(trip.end_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 flex-shrink-0" />
                    <span>Budget: ${trip.total_budget}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{trip.stops?.length || 0} cities</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  {new Date(trip.start_date) > new Date() ? (
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      Upcoming
                    </span>
                  ) : new Date(trip.end_date) < new Date() ? (
                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                      Completed
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      In Progress
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link
                    to={`/trip/${trip.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                  <Link
                    to={`/trip/${trip.id}/itinerary`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

export default TripList
