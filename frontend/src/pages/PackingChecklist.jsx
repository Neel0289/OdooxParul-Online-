import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckSquare, Backpack, ArrowRight } from 'lucide-react'

const PackingChecklist = () => {
	const { id } = useParams()
	const [trips, setTrips] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		const fetchTrips = async () => {
			setLoading(true)
			setError('')

			try {
				const token = localStorage.getItem('authToken')
				const response = await fetch('http://localhost:8000/api/trips/', {
					headers: token ? { Authorization: `Bearer ${token}` } : {}
				})

				if (!response.ok) {
					throw new Error('Failed to load trips')
				}

				const data = await response.json()
				setTrips(Array.isArray(data) ? data : data.results || [])
			} catch (fetchError) {
				setError(fetchError.message || 'Unable to load packing checklist')
			} finally {
				setLoading(false)
			}
		}

		fetchTrips()
	}, [])

	const selectedTrip = useMemo(() => {
		if (!id) return null
		return trips.find((trip) => String(trip.id) === String(id)) || null
	}, [id, trips])

	const items = useMemo(() => {
		if (selectedTrip) return selectedTrip.packing_items || []
		return trips.flatMap((trip) => (trip.packing_items || []).map((item) => ({ ...item, tripTitle: trip.title, tripId: trip.id })))
	}, [selectedTrip, trips])

	const grouped = useMemo(() => {
		return items.reduce((acc, item) => {
			const key = item.category || 'other'
			if (!acc[key]) acc[key] = []
			acc[key].push(item)
			return acc
		}, {})
	}, [items])

	const packedCount = items.filter((item) => item.is_packed).length

	if (loading) {
		return <div className="page-shell text-slate-600">Loading packing checklist...</div>
	}

	return (
		<div className="page-shell">
			<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
				<div>
					<h1 className="text-4xl font-bold text-slate-900">Packing Checklist</h1>
					<p className="text-slate-600 mt-2">
						{selectedTrip ? `Items for ${selectedTrip.title}` : 'All packing items across trips'}
					</p>
				</div>
				{!selectedTrip && (
					<Link to="/trips" className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition">
						Open My Trips
					</Link>
				)}
			</motion.div>

			{error && (
				<div className="glass border border-red-200 bg-red-50/60 text-red-700 rounded-xl px-4 py-3">{error}</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="premium-card interactive-lift rounded-xl p-5">
					<p className="text-sm text-slate-500 flex items-center gap-2"><Backpack className="w-4 h-4" />Total Items</p>
					<p className="text-2xl font-bold text-slate-900 mt-2">{items.length}</p>
				</div>
				<div className="premium-card interactive-lift rounded-xl p-5">
					<p className="text-sm text-slate-500 flex items-center gap-2"><CheckSquare className="w-4 h-4" />Packed</p>
					<p className="text-2xl font-bold text-emerald-600 mt-2">{packedCount}</p>
				</div>
				<div className="premium-card interactive-lift rounded-xl p-5">
					<p className="text-sm text-slate-500">Completion</p>
					<p className="text-2xl font-bold text-slate-900 mt-2">{items.length ? Math.round((packedCount / items.length) * 100) : 0}%</p>
				</div>
			</div>

			<div className="premium-card rounded-xl p-6">
				<h2 className="text-xl font-semibold text-slate-900 mb-4">Items by Category</h2>

				{items.length === 0 ? (
					<div className="text-slate-600">No packing items yet. Add items in your trip-specific packing pages.</div>
				) : (
					<div className="space-y-5">
						{Object.entries(grouped).map(([category, categoryItems]) => (
							<div key={category}>
								<p className="text-sm uppercase tracking-wide text-slate-500 mb-2">{category}</p>
								<div className="space-y-2">
									{categoryItems.map((item) => (
										<div key={item.id} className="bg-white/60 border border-slate-200/70 rounded-lg px-4 py-3 flex items-center justify-between">
											<div>
												<p className="font-medium text-slate-900">{item.item_name}</p>
												{!selectedTrip && item.tripTitle && <p className="text-xs text-slate-500">{item.tripTitle}</p>}
											</div>
											<span className={`text-xs px-2 py-1 rounded-full ${item.is_packed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
												{item.is_packed ? 'Packed' : 'Pending'}
											</span>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{!selectedTrip && trips.length > 0 && (
				<div className="premium-card rounded-xl p-6">
					<h2 className="text-xl font-semibold text-slate-900 mb-4">Jump to Trip Packing</h2>
					<div className="grid gap-3">
						{trips.map((trip) => (
							<Link key={trip.id} to={`/trip/${trip.id}/packing`} className="bg-white/60 border border-slate-200/70 rounded-lg px-4 py-3 flex items-center justify-between hover:bg-white transition">
								<span className="font-medium text-slate-800">{trip.title}</span>
								<ArrowRight className="w-4 h-4 text-slate-500" />
							</Link>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

export default PackingChecklist
