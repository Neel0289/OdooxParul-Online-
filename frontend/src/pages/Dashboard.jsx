import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Calendar, DollarSign, MapPin, TrendingUp, Compass, Star, Search, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

const Dashboard = () => {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showAddToTripModal, setShowAddToTripModal] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [selectedTrip, setSelectedTrip] = useState(null)

  useEffect(() => {
    fetchTrips()
    
    // Set up polling to keep stats live
    const interval = setInterval(fetchTrips, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Calculate stats live from trips data
  const stats = useMemo(() => ({
    totalTrips: trips.length,
    totalBudget: trips.reduce((sum, trip) => sum + parseFloat(trip.total_budget || 0), 0),
    upcomingTrips: trips.filter(trip => new Date(trip.start_date) > new Date()).length,
    completedTrips: trips.filter(trip => trip.is_completed).length,
    totalActualSpending: trips.filter(trip => trip.is_completed).reduce((sum, trip) => sum + parseFloat(trip.actual_spending || 0), 0)
  }), [trips])

  const fetchTrips = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('http://localhost:8000/api/trips/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setTrips(data.results || data || [])
      }
    } catch (error) {
      console.error('Error fetching trips:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`)
      const data = await response.json()
      setSearchResults(data.map(item => ({
        name: item.display_name.split(',')[0],
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        fullName: item.display_name
      })))
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  const addToTrip = async () => {
    if (!selectedTrip || !selectedPlace) return
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`http://localhost:8000/api/trips/${selectedTrip.id}/stops/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          city_name: selectedPlace.name,
          country: selectedPlace.fullName.split(',')[1]?.trim() || '',
          latitude: selectedPlace.lat,
          longitude: selectedPlace.lng,
          arrival_date: new Date().toISOString().split('T')[0],
          departure_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          duration_days: 1,
          cost_index: 'medium',
          description: ''
        })
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        // If backend returned weather warning, surface it to the user
        if (data.weather && data.weather.warning) {
          const msg = data.weather.warnings && data.weather.warnings.length > 0 ? data.weather.warnings.join('; ') : 'Potential bad weather at the chosen date.'
          alert('Warning: ' + msg)
        } else {
          alert('Added to trip!')
        }
        setShowAddToTripModal(false)
        setSelectedPlace(null)
        setSelectedTrip(null)
      } else {
        const err = data.error || 'Error adding to trip'
        alert(err)
      }
    } catch (error) {
      console.error('Error:', error)
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
          Plan New Trip
        </Link>
      </motion.div>

      {/* Place Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="premium-card rounded-xl p-6 mb-8"
      >
        <h2 className="text-xl font-bold text-slate-900 mb-4">Explore Places</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for cities or places..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="brand-button px-4 py-2 rounded-lg">
            <Search className="w-4 h-4" />
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="h-96 rounded-xl overflow-hidden">
            <MapContainer center={[searchResults[0].lat, searchResults[0].lng]} zoom={10} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {searchResults.map((place, index) => (
                <Marker key={index} position={[place.lat, place.lng]}>
                  <Popup>
                    <div className="text-center">
                      <h3 className="font-bold">{place.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{place.fullName}</p>
                      <div className="flex flex-col gap-1">
                        <Link to="/create-trip" state={{ initialLocation: place }} className="text-blue-600 text-sm hover:underline">Create Trip</Link>
                        <button onClick={() => { setSelectedPlace(place); setShowAddToTripModal(true) }} className="text-green-600 text-sm hover:underline">Add to Trip</button>
                        <a href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`} target="_blank" rel="noopener noreferrer" className="text-purple-600 text-sm hover:underline flex items-center justify-center gap-1">
                          <ExternalLink className="w-3 h-3" /> View in Maps
                        </a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
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
              <p className="text-slate-600 text-sm font-medium">Completed</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.completedTrips}</h3>
            </div>
            <Star className="w-10 h-10 text-yellow-500 opacity-20" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="premium-card interactive-lift rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Actual Spending</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">${stats.totalActualSpending.toFixed(2)}</h3>
            </div>
            <TrendingUp className="w-10 h-10 text-indigo-500 opacity-20" />
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
      {/* Recommended Destinations */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="space-y-4 mt-12"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Compass className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Recommended Destinations</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { id: 1, name: 'Paris, France', image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80', description: 'City of Light', rating: 4.9 },
            { id: 2, name: 'Tokyo, Japan', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=800', description: 'Modern Meets Tradition', rating: 4.8 },
            { id: 3, name: 'Santorini, Greece', image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&q=80&w=800', description: 'Breathtaking Views', rating: 4.9 },
            { id: 4, name: 'Bali, Indonesia', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800', description: 'Tropical Paradise', rating: 4.7 },
          ].map((dest) => (
            <motion.div
              key={dest.id}
              whileHover={{ y: -5 }}
              className="premium-card rounded-2xl overflow-hidden group cursor-pointer"
            >
              <div className="h-48 relative overflow-hidden">
                <img 
                  src={dest.image} 
                  alt={dest.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 text-white text-sm font-medium border border-white/20">
                  <Star className="w-3 h-3 fill-current text-yellow-400" />
                  {dest.rating}
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors">{dest.name}</h3>
                <p className="text-slate-500 text-sm mt-1">{dest.description}</p>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest.name)}`} target="_blank" rel="noopener noreferrer" className="mt-4 w-full py-2 bg-slate-50 hover:bg-purple-50 text-purple-600 font-medium rounded-xl text-sm transition-colors border border-slate-100 hover:border-purple-200 block text-center">
                  Explore
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Add to Trip Modal */}
      {showAddToTripModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Add {selectedPlace?.name} to Trip</h3>
            <select 
              value={selectedTrip?.id || ''} 
              onChange={(e) => setSelectedTrip(trips.find(t => t.id === e.target.value))} 
              className="w-full p-2 border border-slate-300 rounded-lg mb-4"
            >
              <option value="">Select a trip</option>
              {trips.map(trip => <option key={trip.id} value={trip.id}>{trip.title}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={addToTrip} className="flex-1 brand-button py-2 rounded-lg">Add</button>
              <button onClick={() => { setShowAddToTripModal(false); setSelectedPlace(null); setSelectedTrip(null) }} className="flex-1 bg-gray-300 py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
