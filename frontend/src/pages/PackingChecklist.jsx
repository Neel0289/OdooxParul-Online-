import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, Backpack, ArrowRight, Plus, X, Pencil, Camera, DollarSign, Image as ImageIcon } from 'lucide-react'

const PackingChecklist = () => {
	const { id } = useParams()
	const [trips, setTrips] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	// Modal State
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [editingItemId, setEditingItemId] = useState(null)
	const [formData, setFormData] = useState({
		item_name: '', category: 'clothing', description: '', quantity: 1, price: 0, is_packed: false
	})
	const [photoFile, setPhotoFile] = useState(null)

	const fetchTrips = useCallback(async () => {
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
	}, [])

	useEffect(() => {
		setLoading(true)
		fetchTrips()
	}, [fetchTrips])

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

	const handleInputChange = (e) => {
		const { name, value, type, checked } = e.target
		setFormData(prev => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value
		}))
	}

	const handleFileChange = (e) => {
		if (e.target.files && e.target.files[0]) {
			setPhotoFile(e.target.files[0])
		}
	}

	const openAddModal = () => {
		setEditingItemId(null)
		setFormData({ item_name: '', category: 'clothing', description: '', quantity: 1, price: 0, is_packed: false })
		setPhotoFile(null)
		setIsModalOpen(true)
	}

	const openEditModal = (item) => {
		setEditingItemId(item.id)
		setFormData({
			item_name: item.item_name || '',
			category: item.category || 'clothing',
			description: item.description || '',
			quantity: item.quantity || 1,
			price: item.price || 0,
			is_packed: item.is_packed || false
		})
		setPhotoFile(null)
		setIsModalOpen(true)
	}

	const handleSaveItem = async (e) => {
		e.preventDefault()
		setIsSubmitting(true)

		const data = new FormData()
		Object.keys(formData).forEach(key => data.append(key, formData[key]))
		if (photoFile) {
			data.append('photo', photoFile)
		}

		try {
			const token = localStorage.getItem('authToken')
			const url = editingItemId
				? `http://localhost:8000/api/trips/${id}/packing/${editingItemId}/`
				: `http://localhost:8000/api/trips/${id}/packing/`
			
			const response = await fetch(url, {
				method: editingItemId ? 'PATCH' : 'POST',
				headers: token ? { Authorization: `Bearer ${token}` } : {},
				body: data // FormData automatically sets multipart/form-data
			})

			if (!response.ok) {
				const errData = await response.json()
				throw new Error(errData.error || 'Failed to save item')
			}
			
			await fetchTrips()
			setIsModalOpen(false)
		} catch (err) {
			alert(err.message)
		} finally {
			setIsSubmitting(false)
		}
	}

	const togglePacked = async (item) => {
		try {
			const token = localStorage.getItem('authToken')
			const tripId = item.tripId || id
			const response = await fetch(`http://localhost:8000/api/trips/${tripId}/packing/${item.id}/`, {
				method: 'PATCH',
				headers: { 
					'Content-Type': 'application/json',
					...(token && { Authorization: `Bearer ${token}` })
				},
				body: JSON.stringify({ is_packed: !item.is_packed })
			})
			if (response.ok) {
				// Optimistically update local state
				const updatedTrips = trips.map(t => {
					if (String(t.id) === String(tripId)) {
						return {
							...t,
							packing_items: t.packing_items.map(pi => pi.id === item.id ? { ...pi, is_packed: !item.is_packed } : pi)
						}
					}
					return t
				})
				setTrips(updatedTrips)
			}
		} catch (err) {
			console.error("Failed to toggle packed status")
		}
	}

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
				{!selectedTrip ? (
					<Link to="/trips" className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition">
						Open My Trips
					</Link>
				) : (
					<button 
						onClick={openAddModal}
						className="flex items-center gap-2 brand-button px-4 py-2 rounded-xl font-medium transition"
					>
						<Plus className="w-4 h-4" /> Add Item
					</button>
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
					<div className="text-slate-600">No packing items yet. Click "Add Item" to start building your checklist.</div>
				) : (
					<div className="space-y-6">
						{Object.entries(grouped).map(([category, categoryItems]) => (
							<div key={category}>
								<p className="text-sm uppercase tracking-wide text-slate-500 mb-3">{category}</p>
								<div className="space-y-3">
									{categoryItems.map((item) => (
										<div key={item.id} className={`bg-white/60 border ${item.is_packed ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200/70'} rounded-lg p-4 transition duration-300`}>
											<div className="flex items-start justify-between gap-4">
												<div className="flex items-start gap-3 flex-1">
													<button 
														onClick={() => togglePacked(item)}
														className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition ${item.is_packed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-emerald-400'}`}
													>
														<CheckSquare className="w-3.5 h-3.5" />
													</button>
													<div className="flex-1">
														<p className={`font-medium ${item.is_packed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
															{item.item_name} <span className="text-sm text-slate-500 font-normal">x{item.quantity}</span>
														</p>
														{item.description && <p className="text-sm text-slate-600 mt-1">{item.description}</p>}
														
														<div className="flex items-center gap-3 mt-2">
															{Number(item.price) > 0 && (
																<span className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
																	<DollarSign className="w-3 h-3" />
																	{item.price} each
																</span>
															)}
															{item.photo && (
																<a href={`http://localhost:8000${item.photo}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded transition">
																	<ImageIcon className="w-3 h-3" /> View Photo
																</a>
															)}
														</div>
														
														{!selectedTrip && item.tripTitle && <p className="text-xs text-slate-400 mt-2">Trip: {item.tripTitle}</p>}
													</div>
												</div>
												{selectedTrip && (
													<button 
														onClick={() => openEditModal(item)}
														className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition shrink-0"
														title="Edit Item"
													>
														<Pencil className="w-4 h-4" />
													</button>
												)}
											</div>
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

			{/* Add/Edit Modal */}
			<AnimatePresence>
				{isModalOpen && (
					<motion.div
						initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto"
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
							className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative my-8"
						>
							<button 
								onClick={() => setIsModalOpen(false)}
								className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1 transition"
							>
								<X className="w-5 h-5" />
							</button>
							<h3 className="text-xl font-bold text-slate-900 mb-4">
								{editingItemId ? 'Edit Packing Item' : 'Add Packing Item'}
							</h3>

							<form onSubmit={handleSaveItem} className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
									<input type="text" name="item_name" required value={formData.item_name} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="e.g. Passport" />
								</div>
								
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
										<select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
											<option value="clothing">Clothing</option>
											<option value="documents">Documents</option>
											<option value="electronics">Electronics</option>
											<option value="toiletries">Toiletries</option>
											<option value="medications">Medications</option>
											<option value="food">Food/Snacks</option>
											<option value="gear">Gear/Equipment</option>
											<option value="entertainment">Entertainment</option>
											<option value="gifts">Gifts/Souvenirs</option>
											<option value="other">Other</option>
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
										<input type="number" min="1" name="quantity" required value={formData.quantity} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">Estimated Price / Cost</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<DollarSign className="w-4 h-4 text-slate-400" />
										</div>
										<input type="number" min="0" step="0.01" name="price" value={formData.price} onChange={handleInputChange} className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg" placeholder="0.00" />
									</div>
									<p className="text-xs text-slate-500 mt-1">This will be automatically added to your Budget Tracker</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
									<textarea name="description" rows="2" value={formData.description} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none" placeholder="Details like size, color, brand..." />
								</div>

								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">Photo (Optional)</label>
									<label className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition text-sm text-slate-600">
										<Camera className="w-4 h-4" />
										{photoFile ? photoFile.name : 'Upload Item Photo'}
										<input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
									</label>
								</div>

								<div className="flex items-center gap-2 mt-2">
									<input type="checkbox" id="is_packed" name="is_packed" checked={formData.is_packed} onChange={handleInputChange} className="w-4 h-4 text-blue-600 rounded border-slate-300" />
									<label htmlFor="is_packed" className="text-sm font-medium text-slate-700">Mark as Packed</label>
								</div>

								<button type="submit" disabled={isSubmitting} className="w-full brand-button py-2.5 rounded-lg font-semibold mt-4">
									{isSubmitting ? 'Saving...' : 'Save Item'}
								</button>
							</form>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

export default PackingChecklist
