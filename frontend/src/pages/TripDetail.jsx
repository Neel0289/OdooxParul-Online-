import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, MapPin, DollarSign, Share2, Copy, MoreHorizontal } from 'lucide-react'

const TripDetail = () => {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTripDetail()
  }, [id])

  const fetchTripDetail = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`http://localhost:8000/api/trips/${id}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setTrip(data)
      } else {
        setError('Trip not found')
      }
    } catch (err) {
      setError('Failed to load trip details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <div className="premium-card rounded-xl p-8 text-center">
          <p className="text-slate-600">Loading trip details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-shell">
        <Link to="/trips" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700">
          <ArrowLeft className="w-4 h-4" />
          Back to Trips
        </Link>
        <div className="premium-card border border-red-200/50 bg-red-50/50 text-red-700 px-6 py-4 rounded-xl">
          {error}
        </div>
      </div>
    )
  }

  if (!trip) return null

  const tripDays = Math.ceil(
    (new Date(trip.end_date) - new Date(trip.start_date)) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="space-y-8">
      {/* Cover Image */}
      <div className="relative h-80 bg-gradient-to-br from-blue-400 to-purple-400">
        {trip.cover_photo && (
          <img src={trip.cover_photo} alt={trip.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        
        <div className="absolute inset-0 flex flex-col justify-end p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Link to="/trips" className="inline-flex items-center gap-2 text-white hover:text-white/80 transition mb-4">
              <ArrowLeft className="w-5 h-5" />
              Back to Trips
            </Link>
            <h1 className="text-5xl font-bold text-white mb-4">{trip.title}</h1>
            {trip.description && (
              <p className="text-white/90 text-lg max-w-2xl">{trip.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 space-y-8">
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div className="premium-card interactive-lift rounded-xl p-6">
            <p className="text-slate-600 text-sm font-medium">Duration</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">{tripDays} days</h3>
          </div>
          <div className="premium-card interactive-lift rounded-xl p-6">
            <p className="text-slate-600 text-sm font-medium">Total Budget</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">${trip.total_budget}</h3>
          </div>
          <div className="premium-card interactive-lift rounded-xl p-6">
            <p className="text-slate-600 text-sm font-medium">Cities</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">{trip.stops?.length || 0}</h3>
          </div>
          <div className="premium-card interactive-lift rounded-xl p-6">
            <p className="text-slate-600 text-sm font-medium">Activities</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">
              {trip.stops?.reduce((sum, stop) => sum + (stop.activities?.length || 0), 0) || 0}
            </h3>
          </div>
        </motion.div>

        {/* Trip Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Dates */}
          <div className="premium-card rounded-xl p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Travel Dates
            </h3>
            <div className="space-y-2 text-slate-600">
              <p className="text-sm">
                <span className="font-medium">From:</span> {new Date(trip.start_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-sm">
                <span className="font-medium">To:</span> {new Date(trip.end_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Budget */}
          <div className="premium-card rounded-xl p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Budget
            </h3>
            <p className="text-3xl font-bold text-slate-900 mb-2">${trip.total_budget}</p>
            <p className="text-sm text-slate-600">
              ${(trip.total_budget / tripDays).toFixed(2)} per day
            </p>
          </div>

          {/* Actions */}
          <div className="premium-card rounded-xl p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition text-sm font-medium">
                <Share2 className="w-4 h-4" />
                Share Trip
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition text-sm font-medium">
                <Copy className="w-4 h-4" />
                Copy Trip
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stops */}
        {trip.stops && trip.stops.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-slate-900">Stops ({trip.stops.length})</h2>
            <div className="space-y-3">
              {trip.stops.map((stop, idx) => (
                <div key={stop.id} className="premium-card rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-sm">
                          {idx + 1}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900">{stop.city_name}, {stop.country}</h3>
                      </div>
                      <div className="text-sm text-slate-600 space-y-1 ml-11">
                        <p>📅 {new Date(stop.arrival_date).toLocaleDateString()} - {new Date(stop.departure_date).toLocaleDateString()}</p>
                        <p>⏱️ {stop.duration_days} days</p>
                        {stop.activities && stop.activities.length > 0 && (
                          <p>🎯 {stop.activities.length} activities</p>
                        )}
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                      Cost: {stop.cost_index}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex gap-4 pb-8"
        >
          <Link
            to={`/trip/${id}/itinerary`}
            className="flex-1 flex items-center justify-center gap-2 brand-button px-6 py-3 rounded-lg font-medium transition"
          >
            Edit Itinerary
          </Link>
          <Link
            to={`/trip/${id}/budget`}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition"
          >
            View Budget
          </Link>
          <Link
            to={`/trip/${id}/packing`}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition"
          >
            Packing List
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

export default TripDetail
