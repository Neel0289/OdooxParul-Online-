import React, { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, MapPin, DollarSign, Share2, Copy, MoreHorizontal } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default icon issue with React-Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom numbered icon generator
const createNumberedIcon = (index) => {
  return L.divIcon({
    className: 'custom-numbered-marker',
    html: `<div style="
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -2px rgba(0,0,0,0.1);
      transform: translateY(-50%);
    ">${index}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

// Component to handle auto-fitting map to bounds
const MapBoundsComponent = ({ stops }) => {
  const map = useMap()
  useEffect(() => {
    if (stops && stops.length > 0) {
      const validStops = stops.filter(s => s.latitude !== null && s.latitude !== undefined && s.longitude !== null && s.longitude !== undefined)
      if (validStops.length > 0) {
        const bounds = L.latLngBounds(validStops.map(s => [parseFloat(s.latitude), parseFloat(s.longitude)]))
        // Pad the bounds slightly so markers aren't cut off
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
      }
    }
  }, [map, stops])
  return null
}

const TripDetail = () => {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shareLoading, setShareLoading] = useState(false)
  const [shareError, setShareError] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)

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
        
        // Dynamically geocode any stops that are missing coordinates
        if (data.stops && data.stops.length > 0) {
          data.stops = await Promise.all(data.stops.map(async (stop) => {
            if (stop.latitude === null || stop.longitude === null || stop.latitude === undefined || stop.longitude === undefined) {
              try {
                const query = `${stop.city_name}, ${stop.country}`
                const geocodeRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
                const geocodeData = await geocodeRes.json()
                if (geocodeData && geocodeData.length > 0) {
                  return { 
                    ...stop, 
                    latitude: parseFloat(geocodeData[0].lat), 
                    longitude: parseFloat(geocodeData[0].lon) 
                  }
                }
              } catch (e) {
                console.error('Geocoding failed for', stop.city_name)
              }
            }
            return stop
          }))
        }

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

  const handleShareTrip = async () => {
    setShareLoading(true)
    setShareError('')
    setCopied(false)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`http://localhost:8000/api/trips/${id}/share/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_public: true })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create share link')
      }

      const data = await response.json()
      const generatedLink = `${window.location.origin}/shared/${data.share_token}`
      setShareLink(generatedLink)

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(generatedLink)
        setCopied(true)
      }
    } catch (shareErr) {
      setShareError(shareErr.message || 'Could not create share link')
    } finally {
      setShareLoading(false)
    }
  }

  const handleCopyShareLink = async () => {
    if (!shareLink) return
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
    } catch {
      setShareError('Copy failed. Please copy the link manually.')
    }
  }

  // Derive sorted stops for the map flow
  const sortedStops = useMemo(() => {
    if (!trip || !trip.stops) return []
    return [...trip.stops].sort((a, b) => {
      const dateA = new Date(a.arrival_date || 0)
      const dateB = new Date(b.arrival_date || 0)
      if (dateA.getTime() !== dateB.getTime()) return dateA - dateB
      return (a.arrival_time || '00:00').localeCompare(b.arrival_time || '00:00')
    })
  }, [trip])

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
    <div className="space-y-8 pb-12">
      {/* Cover Image */}
      <div className="relative h-80 bg-gradient-to-br from-blue-400 to-purple-400">
        {trip.cover_photo && (
          <img src={trip.cover_photo} alt={trip.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        
        <div className="absolute inset-0 flex flex-col justify-end p-8">
          <div className="max-w-[1400px] mx-auto w-full">
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

      {/* Main Content Area - Split Layout */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Map View */}
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="premium-card rounded-2xl overflow-hidden h-[800px] sticky top-6 z-10 border border-slate-200 shadow-xl"
          >
            <MapContainer 
              center={[20, 0]} 
              zoom={2} 
              className="w-full h-full"
              scrollWheelZoom={true}
            >
              <TileLayer 
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              
              {/* Draw Route Line */}
              {sortedStops.filter(s => s.latitude !== null && s.latitude !== undefined && s.longitude !== null && s.longitude !== undefined).length > 1 && (
                <Polyline 
                  positions={sortedStops.filter(s => s.latitude !== null && s.latitude !== undefined && s.longitude !== null && s.longitude !== undefined).map(s => [parseFloat(s.latitude), parseFloat(s.longitude)])} 
                  color="#6366f1" 
                  weight={4} 
                  dashArray="10, 10" 
                  opacity={0.8}
                />
              )}

              {/* Draw Markers */}
              {sortedStops.filter(s => s.latitude !== null && s.latitude !== undefined && s.longitude !== null && s.longitude !== undefined).map((s, index) => (
                <Marker 
                  key={s.id} 
                  position={[parseFloat(s.latitude), parseFloat(s.longitude)]}
                  icon={createNumberedIcon(index + 1)}
                >
                  <Popup className="rounded-xl overflow-hidden">
                    <div className="text-center min-w-[120px]">
                      <div className="bg-indigo-50 text-indigo-700 font-bold text-xs py-1 px-2 rounded-t-lg mb-1">
                        Stop {index + 1}
                      </div>
                      <p className="font-bold text-slate-800 text-sm mb-1">{s.city_name}</p>
                      <p className="text-xs text-slate-500 mb-1">
                        {new Date(s.arrival_date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                      </p>
                      {s.activities && s.activities.length > 0 && (
                        <p className="text-xs font-medium text-slate-600 bg-slate-100 rounded-full px-2 py-0.5 inline-block">
                          {s.activities.length} activities
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}

              <MapBoundsComponent stops={sortedStops} />
            </MapContainer>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: Trip Details and Stats */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Quick Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="premium-card interactive-lift rounded-xl p-5 border border-slate-100 shadow-sm bg-white/60 backdrop-blur-sm">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Duration</p>
              <h3 className="text-xl font-bold text-slate-900">{tripDays} <span className="text-sm font-normal text-slate-500">days</span></h3>
            </div>
            <div className="premium-card interactive-lift rounded-xl p-5 border border-slate-100 shadow-sm bg-white/60 backdrop-blur-sm">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Budget</p>
              <h3 className="text-xl font-bold text-green-700">${trip.total_budget}</h3>
            </div>
            <div className="premium-card interactive-lift rounded-xl p-5 border border-slate-100 shadow-sm bg-white/60 backdrop-blur-sm">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Cities</p>
              <h3 className="text-xl font-bold text-slate-900">{trip.stops?.length || 0}</h3>
            </div>
            <div className="premium-card interactive-lift rounded-xl p-5 border border-slate-100 shadow-sm bg-white/60 backdrop-blur-sm">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Activities</p>
              <h3 className="text-xl font-bold text-slate-900">
                {trip.stops?.reduce((sum, stop) => sum + (stop.activities?.length || 0), 0) || 0}
              </h3>
            </div>
          </motion.div>

          {/* Dates & Budget Detailed */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="premium-card rounded-xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-blue-600" />
                Travel Dates
              </h3>
              <div className="space-y-2 text-slate-600 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                <p className="text-sm flex justify-between">
                  <span className="text-slate-500">Departure</span> 
                  <span className="font-medium text-slate-900">{new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </p>
                <div className="h-px bg-slate-200 my-1 w-full"></div>
                <p className="text-sm flex justify-between">
                  <span className="text-slate-500">Return</span> 
                  <span className="font-medium text-slate-900">{new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </p>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="premium-card rounded-xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">Manage Trip</h3>
              <div className="space-y-3">
                <button
                  onClick={handleShareTrip}
                  disabled={shareLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition text-sm font-semibold disabled:opacity-60 border border-blue-100"
                >
                  <Share2 className="w-4 h-4" />
                  {shareLoading ? 'Generating Link...' : 'Share with Friends'}
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition text-sm font-semibold border border-purple-100">
                  <Copy className="w-4 h-4" />
                  Duplicate Trip
                </button>
              </div>

              {shareError && (
                <p className="text-xs text-red-600 mt-3 bg-red-50 p-2 rounded">{shareError}</p>
              )}

              {shareLink && (
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-xs font-medium text-slate-500">Your Share Link</p>
                  <p className="text-xs text-slate-700 break-all bg-white p-2 border border-slate-100 rounded font-mono">{shareLink}</p>
                  <button
                    onClick={handleCopyShareLink}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition shadow-sm"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied to Clipboard!' : 'Copy Link'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Stops List (Chronological Flow) */}
          {sortedStops && sortedStops.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="premium-card rounded-xl p-6 border border-slate-100 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-500" />
                Itinerary Flow
              </h2>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-indigo-200 before:to-transparent">
                {sortedStops.map((stop, idx) => (
                  <div key={stop.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-white bg-indigo-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 text-xs font-bold z-10">
                      {idx + 1}
                    </div>
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-sm group-hover:border-indigo-200 transition">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 text-sm">{stop.city_name}</h3>
                        <span className="text-[10px] uppercase font-bold text-slate-400">{stop.duration_days}d</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(stop.arrival_date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Action Navigation Buttons */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3 pt-2">
            <Link
              to={`/trip/${id}/itinerary`}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-6 py-3.5 rounded-xl font-bold transition shadow-md hover:shadow-lg"
            >
              Open Itinerary Builder
            </Link>
            <div className="flex gap-3">
              <Link
                to={`/trip/${id}/budget`}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-3 rounded-xl font-semibold hover:bg-emerald-100 transition"
              >
                View Budget
              </Link>
              <Link
                to={`/trip/${id}/packing`}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-50 text-orange-700 border border-orange-200 px-4 py-3 rounded-xl font-semibold hover:bg-orange-100 transition"
              >
                Packing List
              </Link>
            </div>
          </motion.div>
          
        </div>
      </div>
    </div>
  )
}

export default TripDetail
