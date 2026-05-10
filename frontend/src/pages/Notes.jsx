import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, CalendarClock, ArrowRight, Plus, Edit, Trash2, Save, X } from 'lucide-react'

const Notes = () => {
	const { id } = useParams()
	const [trips, setTrips] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [notes, setNotes] = useState([])
	const [editingNote, setEditingNote] = useState(null)
	const [editingContent, setEditingContent] = useState('')
	const [newNoteContent, setNewNoteContent] = useState('')
	const [isAddingNote, setIsAddingNote] = useState(false)

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true)
			setError('')

			try {
				const token = localStorage.getItem('authToken')
				
				// Fetch trips for context
				const tripsResponse = await fetch('http://localhost:8000/api/trips/', {
					headers: token ? { Authorization: `Bearer ${token}` } : {}
				})

				if (!tripsResponse.ok) {
					throw new Error('Failed to load trips')
				}

				const tripsData = await tripsResponse.json()
				const tripsArray = Array.isArray(tripsData) ? tripsData : tripsData.results || []
				setTrips(tripsArray)

				// If specific trip, fetch its notes
				if (id) {
					const notesResponse = await fetch(`http://localhost:8000/api/trips/${id}/notes/`, {
						headers: token ? { Authorization: `Bearer ${token}` } : {}
					})

					if (notesResponse.ok) {
						const notesData = await notesResponse.json()
						setNotes(Array.isArray(notesData) ? notesData : notesData.results || [])
					}
				} else {
					// Fetch all notes from all trips
					const allNotes = []
					for (const trip of tripsArray) {
						try {
							const notesResponse = await fetch(`http://localhost:8000/api/trips/${trip.id}/notes/`, {
								headers: token ? { Authorization: `Bearer ${token}` } : {}
							})
							if (notesResponse.ok) {
								const notesData = await notesResponse.json()
								allNotes.push(...(Array.isArray(notesData) ? notesData : notesData.results || []).map(note => ({ ...note, tripTitle: trip.title, tripId: trip.id })))
							}
						} catch (noteError) {
							console.error('Error fetching notes for trip', trip.id, noteError)
						}
					}
					setNotes(allNotes)
				}
			} catch (fetchError) {
				setError(fetchError.message || 'Unable to load data')
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [id])

	const selectedTrip = useMemo(() => {
		if (!id) return null
		return trips.find((trip) => String(trip.id) === String(id)) || null
	}, [id, trips])

	const sortedNotes = useMemo(() => {
		return [...notes].sort((a, b) => new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at))
	}, [notes])

	const handleAddNote = async () => {
		if (!newNoteContent.trim()) return

		try {
			const token = localStorage.getItem('authToken')
			const response = await fetch(`http://localhost:8000/api/trips/${id || selectedTrip.id}/notes/`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ content: newNoteContent })
			})

			if (response.ok) {
				const newNote = await response.json()
				setNotes(prev => [newNote, ...prev])
				setNewNoteContent('')
				setIsAddingNote(false)
			} else {
				setError('Failed to add note')
			}
		} catch (error) {
			setError('Error adding note')
		}
	}

	const handleEditNote = async (noteId, content) => {
		try {
			const token = localStorage.getItem('authToken')
			const response = await fetch(`http://localhost:8000/api/trips/${id || selectedTrip.id}/notes/${noteId}/`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ content })
			})

			if (response.ok) {
				const updatedNote = await response.json()
				setNotes(prev => prev.map(note => note.id === noteId ? updatedNote : note))
				setEditingNote(null)
				setEditingContent('')
			} else {
				setError('Failed to update note')
			}
		} catch (error) {
			setError('Error updating note')
		}
	}

	const startEditing = (note) => {
		setEditingNote(note.id)
		setEditingContent(note.content)
	}

	const cancelEditing = () => {
		setEditingNote(null)
		setEditingContent('')
	}

	const handleDeleteNote = async (noteId) => {
		if (!confirm('Are you sure you want to delete this note?')) return

		try {
			const token = localStorage.getItem('authToken')
			const response = await fetch(`http://localhost:8000/api/trips/${id || selectedTrip.id}/notes/${noteId}/`, {
				method: 'DELETE',
				headers: { 'Authorization': `Bearer ${token}` }
			})

			if (response.ok) {
				setNotes(prev => prev.filter(note => note.id !== noteId))
			} else {
				setError('Failed to delete note')
			}
		} catch (error) {
			setError('Error deleting note')
		}
	}

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
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold text-slate-900">Note Timeline</h2>
					{selectedTrip && (
						<button
							onClick={() => setIsAddingNote(true)}
							className="flex items-center gap-2 brand-button px-4 py-2 rounded-lg font-medium"
						>
							<Plus className="w-4 h-4" />
							Add Note
						</button>
					)}
				</div>

				{sortedNotes.length === 0 ? (
					<div className="text-slate-600">
						{selectedTrip ? 'No notes for this trip yet. Add your first note!' : 'No notes found. Add notes from your trip detail workflow to see them here.'}
					</div>
				) : (
					<div className="space-y-3">
						{sortedNotes.map((note) => (
							<div key={note.id} className="bg-white/60 border border-slate-200/70 rounded-lg p-4">
								{editingNote === note.id ? (
									<div className="space-y-3">
										<textarea
											value={editingContent}
											onChange={(e) => setEditingContent(e.target.value)}
											className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
											rows={3}
											placeholder="Edit your note..."
										/>
										<div className="flex gap-2">
											<button
												onClick={() => handleEditNote(note.id, editingContent)}
												className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
											>
												<Save className="w-4 h-4" />
												Save
											</button>
											<button
												onClick={cancelEditing}
												className="flex items-center gap-2 bg-gray-300 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-400"
											>
												<X className="w-4 h-4" />
												Cancel
											</button>
										</div>
									</div>
								) : (
									<>
										{!selectedTrip && note.tripTitle && (
											<p className="text-xs font-medium text-blue-700 mb-1">{note.tripTitle}</p>
										)}
										<p className="text-slate-900 whitespace-pre-wrap">{note.content}</p>
										<div className="flex items-center justify-between mt-3">
											<p className="text-xs text-slate-500">{new Date(note.timestamp || note.created_at).toLocaleString()}</p>
											{selectedTrip && (
												<div className="flex gap-2">
													<button
														onClick={() => startEditing(note)}
														className="text-blue-600 hover:text-blue-800 p-1"
														title="Edit note"
													>
														<Edit className="w-4 h-4" />
													</button>
													<button
														onClick={() => handleDeleteNote(note.id)}
														className="text-red-600 hover:text-red-800 p-1"
														title="Delete note"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</div>
											)}
										</div>
									</>
								)}
							</div>
						))}
					</div>
				)}

				{/* Add New Note */}
				{isAddingNote && (
					<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<h3 className="text-lg font-semibold text-slate-900 mb-3">Add New Note</h3>
						<textarea
							value={newNoteContent}
							onChange={(e) => setNewNoteContent(e.target.value)}
							className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
							rows={4}
							placeholder="Write your note here..."
						/>
						<div className="flex gap-2">
							<button
								onClick={handleAddNote}
								className="flex items-center gap-2 brand-button px-4 py-2 rounded-lg font-medium"
							>
								<Save className="w-4 h-4" />
								Add Note
							</button>
							<button
								onClick={() => { setIsAddingNote(false); setNewNoteContent('') }}
								className="flex items-center gap-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
							>
								<X className="w-4 h-4" />
								Cancel
							</button>
						</div>
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
