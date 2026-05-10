import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Route, MapPin, CalendarDays, ArrowRight, Clock3, Plus, X, DollarSign, Pencil, Maximize2, Minimize2, Trash2 } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default icon issue with React-Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Component to handle map clicks
const LocationSelector = ({ position, onLocationSelect }) => {
	useMapEvents({
		click(e) {
			onLocationSelect(e.latlng.lat, e.latlng.lng)
		},
	})
	return position ? (
		<Marker
			position={position}
			draggable={true}
			eventHandlers={{
				dragend: (e) => {
					const marker = e.target
					const latLng = marker.getLatLng()
					onLocationSelect(latLng.lat, latLng.lng)
				}
			}}
		/>
	) : null
}

const ItineraryBuilder = () => {
	const { id } = useParams()
	const [trip, setTrip] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	// Modal State
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [editingStopId, setEditingStopId] = useState(null)
	const [isMapMaximized, setIsMapMaximized] = useState(false)
	const [weatherPreview, setWeatherPreview] = useState([])
	const [weatherLoading, setWeatherLoading] = useState(false)
	const [weatherError, setWeatherError] = useState('')
	const [formData, setFormData] = useState({
		city_name: '',
		country: '',
		arrival_date: '',
		arrival_time: '',
		departure_date: '',
		departure_time: '',
		duration_days: 1,
		estimated_budget: 0,
		cost_index: 'medium',
		description: '',
		latitude: null,
		longitude: null,
		activities: []
	})

	const fetchTrip = async () => {
		if (!id) {
			setLoading(false)
			return
		}

		try {
			const token = localStorage.getItem('authToken')
			const response = await fetch(`http://localhost:8000/api/trips/${id}/`, {
				headers: token ? { Authorization: `Bearer ${token}` } : {}
			})

			if (!response.ok) {
				throw new Error('Could not load itinerary')
			}

			const data = await response.json()
			setTrip(data)
		} catch (fetchError) {
			setError(fetchError.message || 'Unable to load itinerary')
		} finally {
			setLoading(false)
		}
	}

	const buildDateRange = (startDate, endDate) => {
		const dates = []
		const start = new Date(startDate)
		const end = new Date(endDate)
		if (isNaN(start) || isNaN(end) || end < start) return dates

		const current = new Date(start)
		let guard = 0
		while (current <= end && guard < 14) {
			dates.push(current.toISOString().split('T')[0])
			current.setDate(current.getDate() + 1)
			guard += 1
		}
		return dates
	}

	const fetchWeatherPreview = async () => {
		if (!formData.latitude || !formData.longitude || !formData.arrival_date || !formData.departure_date) {
			setWeatherPreview([])
			setWeatherError('')
			return
		}

		setWeatherLoading(true)
		setWeatherError('')
		try {
			const token = localStorage.getItem('authToken')
			const dates = buildDateRange(formData.arrival_date, formData.departure_date)
			const results = await Promise.all(dates.map(async (date) => {
				try {
					const response = await fetch(
						`http://localhost:8000/api/weather/forecast/?lat=${formData.latitude}&lon=${formData.longitude}&date=${date}`,
						{ headers: token ? { Authorization: `Bearer ${token}` } : {} }
					)
					if (!response.ok) return { date, error: 'Weather unavailable' }
					const data = await response.json()
					return { date, ...data }
				} catch {
					return { date, error: 'Weather unavailable' }
				}
			}))
			setWeatherPreview(results)
		} catch (err) {
			setWeatherError(err.message || 'Could not load weather preview')
			setWeatherPreview([])
		} finally {
			setWeatherLoading(false)
		}
	}

	const geocodeCityCountry = async (city, country) => {
		const query = [city, country].filter(Boolean).join(', ')
		if (!query) return null

		try {
			const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
			const data = await response.json()
			if (data && data.length > 0) {
				return {
					latitude: parseFloat(data[0].lat),
					longitude: parseFloat(data[0].lon)
				}
			}
		} catch (err) {
			console.error('City geocoding failed', err)
		}
		return null
	}

	useEffect(() => {
		fetchTrip()
	}, [id])

	useEffect(() => {
		if (!isModalOpen) return
		if (!formData.latitude || !formData.longitude || !formData.arrival_date || !formData.departure_date) {
			setWeatherPreview([])
			setWeatherError('')
			return
		}
		const timeout = setTimeout(() => {
			fetchWeatherPreview()
		}, 350)
		return () => clearTimeout(timeout)
	}, [isModalOpen, formData.latitude, formData.longitude, formData.arrival_date, formData.departure_date])

	useEffect(() => {
		if (!isModalOpen) return
		if (!formData.city_name.trim() || !formData.country.trim()) return

		const timeout = setTimeout(async () => {
			const coords = await geocodeCityCountry(formData.city_name.trim(), formData.country.trim())
			if (coords) {
				setFormData(prev => {
					if (prev.city_name.trim() !== formData.city_name.trim() || prev.country.trim() !== formData.country.trim()) {
						return prev
					}
					return {
						...prev,
						latitude: coords.latitude,
						longitude: coords.longitude
					}
				})
			}
		}, 600)

		return () => clearTimeout(timeout)
	}, [isModalOpen, formData.city_name, formData.country])

	// Force leaflet to recalculate size when the container animates
	useEffect(() => {
		if (isModalOpen) {
			const timeout = setTimeout(() => {
				window.dispatchEvent(new Event('resize'))
			}, 300)
			return () => clearTimeout(timeout)
		}
	}, [isMapMaximized, isModalOpen])

	const handleInputChange = (e) => {
		const { name, value } = e.target
		setFormData(prev => {
			const newData = { ...prev, [name]: value }
			
			// Auto-calculate duration if dates change
			if (name === 'arrival_date' || name === 'departure_date') {
				if (newData.arrival_date && newData.departure_date) {
					const start = new Date(newData.arrival_date)
					const end = new Date(newData.departure_date)
					if (!isNaN(start) && !isNaN(end)) {
						const diffTime = end - start
						const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
						newData.duration_days = Math.max(1, diffDays)
					}
				}
			}
			
			return newData
		})
	}

	const handleAddActivity = () => {
		setFormData(prev => ({
			...prev,
			activities: [...prev.activities, { title: '', cost: 0, category: 'sightseeing' }]
		}))
	}

	const handleActivityChange = (index, field, value) => {
		setFormData(prev => {
			const newActs = [...prev.activities]
			newActs[index] = { ...newActs[index], [field]: value }
			return { ...prev, activities: newActs }
		})
	}

	const handleRemoveActivity = (index) => {
		setFormData(prev => {
			const newActs = [...prev.activities]
			newActs.splice(index, 1)
			return { ...prev, activities: newActs }
		})
	}

	const handleMapLocationSelect = async (lat, lng) => {
		setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))
		setIsMapMaximized(false) // Auto-minimize when location is selected
		try {
			const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
			const data = await res.json()
			if (data && data.address) {
				const city = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state || ''
				const country = data.address.country || ''
				setFormData(prev => ({ 
					...prev, 
					city_name: city || prev.city_name, 
					country: country || prev.country 
				}))
			}
		} catch (err) {
			console.error("Geocoding failed", err)
		}
		setWeatherPreview([])
	}

	const openAddModal = () => {
		setEditingStopId(null)
		setIsMapMaximized(false)
		setFormData({
			city_name: '', country: '', arrival_date: '', arrival_time: '',
			departure_date: '', departure_time: '', duration_days: 1, estimated_budget: 0,
			cost_index: 'medium', description: '', latitude: null, longitude: null,
			activities: []
		})
		setIsModalOpen(true)
	}

	const openEditModal = (stop) => {
		setEditingStopId(stop.id)
		setIsMapMaximized(false)
		setFormData({
			city_name: stop.city_name || '',
			country: stop.country || '',
			arrival_date: stop.arrival_date || '',
			arrival_time: stop.arrival_time || '',
			departure_date: stop.departure_date || '',
			departure_time: stop.departure_time || '',
			duration_days: stop.duration_days || 1,
			estimated_budget: stop.estimated_budget || 0,
			cost_index: stop.cost_index || 'medium',
			description: stop.description || '',
			latitude: stop.latitude || null,
			longitude: stop.longitude || null,
			activities: stop.activities ? stop.activities.map(a => ({ title: a.title, cost: a.cost, category: a.category })) : []
		})
		setIsModalOpen(true)
	}

	const handleSaveStop = async (e) => {
		e.preventDefault()
		setIsSubmitting(true)
		
		const payload = { ...formData }
		if (!payload.arrival_time) payload.arrival_time = null
		if (!payload.departure_time) payload.departure_time = null

		try {
			const token = localStorage.getItem('authToken')
			const url = editingStopId 
				? `http://localhost:8000/api/trips/${id}/stops/${editingStopId}/`
				: `http://localhost:8000/api/trips/${id}/stops/`
			const method = editingStopId ? 'PATCH' : 'POST'

			const response = await fetch(url, {
				method,
				headers: { 
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}` 
				},
				body: JSON.stringify(payload)
			})
			if (!response.ok) {
				const errorData = await response.json()
				const errorMessage = errorData.error || (typeof errorData === 'object' ? Object.values(errorData).flat().join(', ') : 'Failed to save stop')
				throw new Error(errorMessage)
			}

			const savedStop = await response.json().catch(() => null)
			const weatherLat = savedStop?.latitude ?? payload.latitude
			const weatherLon = savedStop?.longitude ?? payload.longitude
			const weatherDate = savedStop?.arrival_date ?? payload.arrival_date

			if (weatherLat != null && weatherLon != null && weatherDate) {
				try {
					const weatherResponse = await fetch(
						`http://localhost:8000/api/weather/forecast/?lat=${weatherLat}&lon=${weatherLon}&date=${weatherDate}`,
						{
							headers: { 'Authorization': `Bearer ${token}` }
						}
					)
					if (weatherResponse.ok) {
						const weatherData = await weatherResponse.json()
						if (weatherData?.warning) {
							const warningText = weatherData.warnings?.length > 0
								? weatherData.warnings.join('; ')
								: 'Weather may be bad on the selected date.'
							alert(`Weather warning for ${payload.city_name}: ${warningText}`)
							} else if (weatherData?.forecast) {
								alert(
									`Weather for ${payload.city_name}: ${weatherData.forecast.condition} (${weatherData.forecast.min_temp_c}°C - ${weatherData.forecast.max_temp_c}°C)`
								)
						}
					}
				} catch (weatherErr) {
					console.error('Weather lookup failed:', weatherErr)
				}
			}

			await fetchTrip() // Refresh trip data
			setIsModalOpen(false)
			setEditingStopId(null)
			setFormData({
				city_name: '', country: '', arrival_date: '', arrival_time: '',
				departure_date: '', departure_time: '', duration_days: 1, estimated_budget: 0,
				cost_index: 'medium', description: '', latitude: null, longitude: null,
				activities: []
			})
		} catch (err) {
			alert(err.message)
		} finally {
			setIsSubmitting(false)
		}
	}

	const stops = useMemo(() => {
		return (trip?.stops || []).slice().sort((a, b) => {
			const dateA = new Date(a.arrival_date || 0)
			const dateB = new Date(b.arrival_date || 0)
			
			if (dateA.getTime() !== dateB.getTime()) {
				return dateA - dateB
			}
			
			const timeA = a.arrival_time || '00:00'
			const timeB = b.arrival_time || '00:00'
			
			return timeA.localeCompare(timeB)
		})
	}, [trip])
	const totalActivities = useMemo(() => stops.reduce((sum, stop) => sum + (stop.activities?.length || 0), 0), [stops])

	if (loading) return <div className="page-shell"><div className="premium-card p-6">Loading itinerary...</div></div>

	return (
		<div className="page-shell">
			<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="page-header">
				<div>
					<h1 className="page-title">Itinerary Builder</h1>
					<p className="page-subtitle">
						{trip ? `Route plan for ${trip.title}` : 'Pick a trip to shape your route and timeline'}
					</p>
				</div>
				{!id ? (
					<Link to="/trips" className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-white/70 transition">
						Choose Trip
					</Link>
				) : (
					<button 
						onClick={openAddModal}
						className="flex items-center gap-2 brand-button px-4 py-2 rounded-xl font-medium transition"
					>
						<Plus className="w-4 h-4" /> Add Stop
					</button>
				)}
			</motion.div>

			{error && <div className="premium-card border border-red-200 text-red-700 p-4">{error}</div>}

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<motion.div whileHover={{ y: -4 }} className="premium-card p-5">
					<p className="text-sm text-slate-500 flex items-center gap-2"><MapPin className="w-4 h-4" />Stops</p>
					<p className="text-3xl font-bold text-slate-900 mt-2">{stops.length}</p>
				</motion.div>
				<motion.div whileHover={{ y: -4 }} className="premium-card p-5">
					<p className="text-sm text-slate-500 flex items-center gap-2"><Route className="w-4 h-4" />Activities</p>
					<p className="text-3xl font-bold text-slate-900 mt-2">{totalActivities}</p>
				</motion.div>
				<motion.div whileHover={{ y: -4 }} className="premium-card p-5">
					<p className="text-sm text-slate-500 flex items-center gap-2"><CalendarDays className="w-4 h-4" />Trip Window</p>
					<p className="text-lg font-semibold text-slate-900 mt-2">
						{trip ? `${new Date(trip.start_date).toLocaleDateString()} - ${new Date(trip.end_date).toLocaleDateString()}` : 'No trip selected'}
					</p>
				</motion.div>
			</div>

			<div className="premium-card p-6 space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold text-slate-900">Stops Timeline</h2>
				</div>
				{stops.length === 0 ? (
					<p className="text-slate-600">No stops added yet. Start by adding your first destination.</p>
				) : (
					<div className="space-y-3">
						{stops.map((stop, index) => (
							<motion.div
								key={stop.id}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.05 }}
								className="bg-white/70 border border-slate-200 rounded-xl p-4 flex items-center justify-between"
							>
								<div>
									<p className="font-semibold text-slate-900">{index + 1}. {stop.city_name}, {stop.country}</p>
									<div className="text-sm text-slate-600 mt-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
										<span className="flex items-center gap-1">
											<Clock3 className="w-4 h-4" />
											{new Date(stop.arrival_date).toLocaleDateString()} {stop.arrival_time?.substring(0,5)} to {new Date(stop.departure_date).toLocaleDateString()} {stop.departure_time?.substring(0,5)} ({stop.duration_days} days)
										</span>
										{stop.estimated_budget > 0 && (
											<span className="flex items-center gap-1 text-green-700 font-medium bg-green-50 px-2 py-0.5 rounded">
												<DollarSign className="w-3 h-3" />
												{stop.estimated_budget}
											</span>
										)}
									</div>
									{stop.description && (
										<p className="text-sm text-slate-500 mt-2 italic border-l-2 border-slate-200 pl-2">
											{stop.description}
										</p>
									)}
								</div>
								<div className="flex flex-col items-end justify-center">
									<div className="flex items-center">
										<span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium mr-2">
											{stop.activities?.length || 0} activities
										</span>
										<button 
											onClick={() => openEditModal(stop)}
											className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
											title="Edit Stop"
										>
											<Pencil className="w-4 h-4" />
										</button>
									</div>
									{stop.activities && stop.activities.length > 0 && (
										<div className="mt-2 flex flex-col items-end gap-1">
											{stop.activities.map((act, i) => (
												<span key={i} className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
													{act.title}
												</span>
											))}
										</div>
									)}
								</div>
							</motion.div>
						))}
					</div>
				)}
			</div>

			{id && (
				<div className="grid md:grid-cols-3 gap-4">
					<Link to={`/trip/${id}/budget`} className="premium-card interactive-lift p-5 flex items-center justify-between">
						<span className="font-semibold text-slate-900">Budget View</span>
						<ArrowRight className="w-4 h-4 text-slate-500" />
					</Link>
					<Link to={`/trip/${id}/packing`} className="premium-card interactive-lift p-5 flex items-center justify-between">
						<span className="font-semibold text-slate-900">Packing View</span>
						<ArrowRight className="w-4 h-4 text-slate-500" />
					</Link>
					<Link to={`/trip/${id}/notes`} className="premium-card interactive-lift p-5 flex items-center justify-between">
						<span className="font-semibold text-slate-900">Notes View</span>
						<ArrowRight className="w-4 h-4 text-slate-500" />
					</Link>
				</div>
			)}

			{/* Add/Edit Stop Modal */}
			<AnimatePresence>
				{isModalOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto"
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							className={`bg-white rounded-2xl w-full p-6 shadow-xl relative my-8 transition-all duration-300 ${isMapMaximized ? 'max-w-4xl' : 'max-w-lg'}`}
						>
							<button 
								onClick={() => setIsModalOpen(false)}
								className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1 transition z-[1000]"
							>
								<X className="w-5 h-5" />
							</button>
							<h3 className="text-xl font-bold text-slate-900 mb-4">
								{editingStopId ? 'Edit Stop' : 'Add New Stop'}
							</h3>

							<div className={`relative mb-4 rounded-xl overflow-hidden border border-slate-200 transition-all duration-300 ${isMapMaximized ? 'h-[500px]' : 'h-56'}`}>
								<button
									type="button"
									onClick={() => setIsMapMaximized(!isMapMaximized)}
									className="absolute top-2 right-2 z-[1000] p-1.5 bg-slate-900 rounded-lg shadow hover:bg-black text-white transition"
									title={isMapMaximized ? "Minimize Map" : "Maximize Map"}
								>
									{isMapMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
								</button>
								<MapContainer 
									center={formData.latitude ? [formData.latitude, formData.longitude] : [20, 0]} 
									zoom={formData.latitude ? 10 : 2} 
									style={{ height: '100%', width: '100%' }}
								>
									<TileLayer 
										url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
										attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
									/>
									<LocationSelector 
										position={formData.latitude ? [formData.latitude, formData.longitude] : null} 
										onLocationSelect={handleMapLocationSelect} 
									/>
								</MapContainer>
							</div>

							{!isMapMaximized && (
								<motion.form 
									initial={{ opacity: 0, height: 0 }} 
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									onSubmit={handleSaveStop} 
									className="space-y-4"
								>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-slate-700 mb-1">City Name</label>
											<input type="text" name="city_name" required value={formData.city_name} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="e.g. Paris" />
										</div>
										<div>
											<label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
											<input type="text" name="country" required value={formData.country} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="e.g. France" />
										</div>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-slate-700 mb-1">Arrival Date</label>
											<input type="date" name="arrival_date" required value={formData.arrival_date} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
										</div>
										<div>
											<label className="block text-sm font-medium text-slate-700 mb-1">Arrival Time</label>
											<input type="time" name="arrival_time" value={formData.arrival_time} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
										</div>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-slate-700 mb-1">Departure Date</label>
											<input type="date" name="departure_date" required value={formData.departure_date} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
										</div>
										<div>
											<label className="block text-sm font-medium text-slate-700 mb-1">Departure Time</label>
											<input type="time" name="departure_time" value={formData.departure_time} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
										</div>
									</div>

									<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
										<div className="flex items-center justify-between mb-2">
											<p className="text-sm font-semibold text-slate-900">Weather for selected days</p>
											{weatherLoading && <span className="text-xs text-slate-500">Loading...</span>}
										</div>
										{weatherError && <p className="text-sm text-red-600">{weatherError}</p>}
										{!weatherLoading && weatherPreview.length === 0 && !weatherError && (
											<p className="text-sm text-slate-500">Pick a city, coordinates, and dates to preview the weather.</p>
										)}
										<div className="space-y-2">
											{weatherPreview.map((entry) => (
												<div key={entry.date} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-slate-200">
													<div>
														<p className="text-sm font-medium text-slate-800">{new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
														<p className="text-xs text-slate-500">{entry.forecast?.condition || entry.error || 'Weather unavailable'}</p>
													</div>
													<div className="text-right">
														<p className="text-sm font-semibold text-slate-900">
															{entry.forecast ? `${entry.forecast.min_temp_c}°C - ${entry.forecast.max_temp_c}°C` : '--'}
														</p>
														{entry.warning ? (
															<p className="text-xs font-semibold text-red-600">Warning: {entry.warnings?.join('; ') || 'Bad weather expected'}</p>
														) : (
															<p className="text-xs text-emerald-700">No alert</p>
														)}
													</div>
												</div>
											))}
										</div>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-slate-700 mb-1">Duration (Days)</label>
											<input type="number" min="1" name="duration_days" required value={formData.duration_days} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
										</div>
										<div>
											<label className="block text-sm font-medium text-slate-700 mb-1">Estimated Budget</label>
											<input type="number" min="0" step="0.01" name="estimated_budget" value={formData.estimated_budget} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="e.g. 500" />
										</div>
									</div>
									<div>
										<label className="block text-sm font-medium text-slate-700 mb-1">Description / Notes</label>
										<textarea name="description" rows="2" value={formData.description} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none" placeholder="Add some notes or details about this stop..." />
									</div>

									{/* Nested Activities UI */}
									<div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
										<div className="flex items-center justify-between mb-3">
											<label className="block text-sm font-bold text-slate-800">Planned Activities</label>
											<button type="button" onClick={handleAddActivity} className="text-xs text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded flex items-center gap-1 transition">
												<Plus className="w-3 h-3" /> Add Activity
											</button>
										</div>
										
										{formData.activities.length === 0 ? (
											<p className="text-xs text-slate-500 italic">No activities planned yet. Add some fun things to do!</p>
										) : (
											<div className="space-y-2">
												{formData.activities.map((act, index) => (
													<div key={index} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
														<input 
															type="text" 
															required
															value={act.title} 
															onChange={(e) => handleActivityChange(index, 'title', e.target.value)} 
															placeholder="E.g. Visit Museum" 
															className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded outline-none focus:border-blue-500" 
														/>
														<div className="relative">
															<span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
															<input 
																type="number" 
																min="0" step="0.01"
																value={act.cost} 
																onChange={(e) => handleActivityChange(index, 'cost', e.target.value)} 
																placeholder="Cost" 
																className="w-20 pl-5 pr-2 py-1.5 text-sm border border-slate-200 rounded outline-none focus:border-blue-500" 
															/>
														</div>
														<button 
															type="button" 
															onClick={() => handleRemoveActivity(index)} 
															className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition shrink-0"
															title="Remove Activity"
														>
															<Trash2 className="w-4 h-4" />
														</button>
													</div>
												))}
											</div>
										)}
									</div>

									<button type="submit" disabled={isSubmitting} className="w-full brand-button py-2.5 rounded-lg font-semibold mt-4">
										{isSubmitting ? 'Saving...' : 'Save Stop & Activities'}
									</button>
								</motion.form>
							)}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

export default ItineraryBuilder
