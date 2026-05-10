import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, DollarSign, PiggyBank, Receipt, ArrowRight } from 'lucide-react'

const BudgetTracker = () => {
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
				const list = Array.isArray(data) ? data : data.results || []
				setTrips(list)
			} catch (fetchError) {
				setError(fetchError.message || 'Unable to load budget data')
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

	const allBudgets = useMemo(() => {
		if (selectedTrip) return selectedTrip.budgets || []
		return trips.flatMap((trip) => (trip.budgets || []).map((budget) => ({ ...budget, tripTitle: trip.title, tripId: trip.id })))
	}, [selectedTrip, trips])

	const totals = useMemo(() => {
		const estimated = allBudgets.reduce((sum, item) => sum + Number(item.estimated_cost || 0), 0)
		const actual = allBudgets.reduce((sum, item) => sum + Number(item.actual_cost || 0), 0)
		return {
			estimated,
			actual,
			delta: estimated - actual
		}
	}, [allBudgets])

	if (loading) {
		return <div className="page-shell text-slate-600">Loading budget data...</div>
	}

	return (
		<div className="page-shell">
			<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
				<div>
					<h1 className="text-4xl font-bold text-slate-900">Budget Tracker</h1>
					<p className="text-slate-600 mt-2">
						{selectedTrip ? `Budget view for ${selectedTrip.title}` : 'Combined budget across your trips'}
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
					<p className="text-sm text-slate-500 flex items-center gap-2"><PiggyBank className="w-4 h-4" />Estimated</p>
					<p className="text-2xl font-bold text-slate-900 mt-2">${totals.estimated.toFixed(2)}</p>
				</div>
				<div className="premium-card interactive-lift rounded-xl p-5">
					<p className="text-sm text-slate-500 flex items-center gap-2"><Receipt className="w-4 h-4" />Actual</p>
					<p className="text-2xl font-bold text-slate-900 mt-2">${totals.actual.toFixed(2)}</p>
				</div>
				<div className="premium-card interactive-lift rounded-xl p-5">
					<p className="text-sm text-slate-500 flex items-center gap-2"><DollarSign className="w-4 h-4" />Remaining</p>
					<p className={`text-2xl font-bold mt-2 ${totals.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>${totals.delta.toFixed(2)}</p>
				</div>
			</div>

			<div className="premium-card rounded-xl p-6">
				<h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
					<BarChart3 className="w-5 h-5" />
					Budget Entries
				</h2>

				{allBudgets.length === 0 ? (
					<div className="text-slate-600">
						No budget entries found yet. Create a trip and add budget categories to see data here.
					</div>
				) : (
					<div className="space-y-3">
						{allBudgets.map((item, index) => (
							<div key={item.id || index} className="bg-white/60 border border-slate-200/70 rounded-lg px-4 py-3 flex items-center justify-between">
								<div>
									<p className="font-medium text-slate-900 capitalize">{item.category}</p>
									{!selectedTrip && item.tripTitle && (
										<p className="text-xs text-slate-500">{item.tripTitle}</p>
									)}
								</div>
								<div className="text-right">
									<p className="text-sm text-slate-500">Est ${Number(item.estimated_cost || 0).toFixed(2)}</p>
									<p className="font-semibold text-slate-900">Act ${Number(item.actual_cost || 0).toFixed(2)}</p>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{!selectedTrip && trips.length > 0 && (
				<div className="premium-card rounded-xl p-6">
					<h2 className="text-xl font-semibold text-slate-900 mb-4">Jump to Trip Budget</h2>
					<div className="grid gap-3">
						{trips.map((trip) => (
							<Link
								key={trip.id}
								to={`/trip/${trip.id}/budget`}
								className="bg-white/60 border border-slate-200/70 rounded-lg px-4 py-3 flex items-center justify-between hover:bg-white transition"
							>
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

export default BudgetTracker
