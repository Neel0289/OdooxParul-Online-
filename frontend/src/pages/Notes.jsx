import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, CalendarClock, ArrowRight } from 'lucide-react'

const Notes = () => {
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
				setError(fetchError.message || 'Unable to load notes')
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

	const notes = useMemo(() => {
		if (selectedTrip) return selectedTrip.notes || []
		return trips.flatMap((trip) => (trip.notes || []).map((note) => ({ ...note, tripTitle: trip.title, tripId: trip.id })))
	}, [selectedTrip, trips])

	const sortedNotes = useMemo(() => {
		return [...notes].sort((a, b) => new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at))
	}, [notes])

	if (loading) {
		return <div className="page-shell text-slate-600">Loading notes...</div>
	}

	return (
		<div className="page-shell">
			<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
				<div>
					<h1 className="text-4xl font-bold text-slate-900">Notes</h1>
					<p className="text-slate-600 mt-2">
						{selectedTrip ? `Travel journal for ${selectedTrip.title}` : 'All notes across your trips'}
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

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="premium-card interactive-lift rounded-xl p-5">
					<p className="text-sm text-slate-500 flex items-center gap-2"><FileText className="w-4 h-4" />Total Notes</p>
					<p className="text-2xl font-bold text-slate-900 mt-2">{sortedNotes.length}</p>
				</div>
				<div className="premium-card interactive-lift rounded-xl p-5">
					<p className="text-sm text-slate-500 flex items-center gap-2"><CalendarClock className="w-4 h-4" />Latest Update</p>
					<p className="text-lg font-semibold text-slate-900 mt-2">
						{sortedNotes[0] ? new Date(sortedNotes[0].timestamp || sortedNotes[0].created_at).toLocaleString() : 'No notes yet'}
					</p>
				</div>
			</div>

			<div className="premium-card rounded-xl p-6">
				<h2 className="text-xl font-semibold text-slate-900 mb-4">Note Timeline</h2>

				{sortedNotes.length === 0 ? (
					<div className="text-slate-600">No notes found. Add notes from your trip detail workflow to see them here.</div>
				) : (
					<div className="space-y-3">
						{sortedNotes.map((note) => (
							<div key={note.id} className="bg-white/60 border border-slate-200/70 rounded-lg px-4 py-3">
								{!selectedTrip && note.tripTitle && (
									<p className="text-xs font-medium text-blue-700 mb-1">{note.tripTitle}</p>
								)}
								<p className="text-slate-900 whitespace-pre-wrap">{note.content}</p>
								<p className="text-xs text-slate-500 mt-2">{new Date(note.timestamp || note.created_at).toLocaleString()}</p>
							</div>
						))}
					</div>
				)}
			</div>

			{!selectedTrip && trips.length > 0 && (
				<div className="premium-card rounded-xl p-6">
					<h2 className="text-xl font-semibold text-slate-900 mb-4">Jump to Trip Notes</h2>
					<div className="grid gap-3">
						{trips.map((trip) => (
							<Link key={trip.id} to={`/trip/${trip.id}/notes`} className="bg-white/60 border border-slate-200/70 rounded-lg px-4 py-3 flex items-center justify-between hover:bg-white transition">
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

export default Notes
