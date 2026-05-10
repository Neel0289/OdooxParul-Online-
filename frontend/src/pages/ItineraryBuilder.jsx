import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Route, MapPin, CalendarDays, ArrowRight, Clock3 } from 'lucide-react'

const ItineraryBuilder = () => {
	const { id } = useParams()
	const [trip, setTrip] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
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

		fetchTrip()
	}, [id])

	const stops = useMemo(() => (trip?.stops || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0)), [trip])
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
				{!id && (
					<Link to="/trips" className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-white/70 transition">
						Choose Trip
					</Link>
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
				<h2 className="text-2xl font-bold text-slate-900">Stops Timeline</h2>
				{stops.length === 0 ? (
					<p className="text-slate-600">No stops added yet. Start by adding your first destination from the trip management flow.</p>
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
									<p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
										<Clock3 className="w-4 h-4" />
										{new Date(stop.arrival_date).toLocaleDateString()} to {new Date(stop.departure_date).toLocaleDateString()} ({stop.duration_days} days)
									</p>
								</div>
								<span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
									{stop.activities?.length || 0} activities
								</span>
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
		</div>
	)
}

export default ItineraryBuilder
