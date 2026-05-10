import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, DollarSign, MapPin, Globe } from 'lucide-react'

const PublicTrip = () => {
  const { shareToken } = useParams()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSharedTrip = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/shared/${shareToken}/`)
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Unable to load shared trip')
        }

        const data = await response.json()
        setTrip(data.trip)
      } catch (fetchError) {
        setError(fetchError.message || 'Unable to load shared trip')
      } finally {
        setLoading(false)
      }
    }

    fetchSharedTrip()
  }, [shareToken])

  if (loading) {
    return <div className="page-shell"><div className="premium-card rounded-xl p-8">Loading shared trip...</div></div>
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="premium-card border border-red-200 bg-red-50/60 text-red-700 rounded-xl px-6 py-4">{error}</div>
        <Link to="/" className="text-blue-600 hover:text-blue-700">Back to Traveloop</Link>
      </div>
    )
  }

  if (!trip) {
    return null
  }

  return (
    <div className="page-shell max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="premium-card rounded-2xl overflow-hidden">
        <div className="h-56 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 relative">
          {trip.cover_photo && <img src={trip.cover_photo} alt={trip.title} className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
            <p className="text-sm uppercase tracking-[0.2em] opacity-90">Shared with Traveloop</p>
            <h1 className="text-4xl font-bold mt-2">{trip.title}</h1>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {trip.description && <p className="text-slate-700 text-lg">{trip.description}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="premium-card rounded-xl p-4">
              <p className="text-sm text-slate-500 flex items-center gap-2"><Calendar className="w-4 h-4" />Dates</p>
              <p className="font-semibold text-slate-900 mt-2">{new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}</p>
            </div>
            <div className="premium-card rounded-xl p-4">
              <p className="text-sm text-slate-500 flex items-center gap-2"><DollarSign className="w-4 h-4" />Budget</p>
              <p className="font-semibold text-slate-900 mt-2">${trip.total_budget}</p>
            </div>
            <div className="premium-card rounded-xl p-4">
              <p className="text-sm text-slate-500 flex items-center gap-2"><MapPin className="w-4 h-4" />Stops</p>
              <p className="font-semibold text-slate-900 mt-2">{trip.stops?.length || 0} cities</p>
            </div>
          </div>

          <div className="premium-card rounded-xl p-5">
            <h2 className="text-xl font-bold text-slate-900 mb-3">Route Overview</h2>
            {trip.stops?.length ? (
              <div className="space-y-2">
                {trip.stops.map((stop, index) => (
                  <div key={stop.id} className="flex items-center justify-between bg-white/70 border border-slate-200 rounded-lg px-3 py-2">
                    <p className="font-medium text-slate-900">{index + 1}. {stop.city_name}, {stop.country}</p>
                    <span className="text-xs text-slate-500">{stop.duration_days} days</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600">No stops added yet.</p>
            )}
          </div>
        </div>
      </motion.div>

      <div className="text-center py-2">
        <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          <Globe className="w-4 h-4" />
          Create your own trip on Traveloop
        </Link>
      </div>
    </div>
  )
}

export default PublicTrip
