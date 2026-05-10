import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Calendar, DollarSign, Upload, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const CreateTrip = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    total_budget: '',
    cover_photo: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, cover_photo: file }))
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.title || !formData.start_date || !formData.end_date) {
      setError('Please fill in all required fields')
      return
    }

    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      setError('End date must be after start date')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const formDataWithImage = new FormData()
      formDataWithImage.append('title', formData.title)
      formDataWithImage.append('description', formData.description)
      formDataWithImage.append('start_date', formData.start_date)
      formDataWithImage.append('end_date', formData.end_date)
      formDataWithImage.append('total_budget', formData.total_budget || 0)
      if (formData.cover_photo) {
        formDataWithImage.append('cover_photo', formData.cover_photo)
      }

      const response = await fetch('http://localhost:8000/api/trips/', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataWithImage
      })

      if (response.ok) {
        const data = await response.json()
        navigate(`/trip/${data.id}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create trip')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="page-shell">
      <Link to="/trips" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition">
        <ArrowLeft className="w-4 h-4" />
        Back to Trips
      </Link>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-3xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="page-title mb-2">Create New Trip</h1>
          <p className="page-subtitle">Start planning your next adventure</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="premium-card border border-red-200/50 bg-red-50/50 text-red-700 px-6 py-4 rounded-xl mb-6"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="premium-card rounded-2xl p-8 backdrop-blur-md space-y-6">
          
          {/* Cover Photo */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-4">Trip Cover Photo</label>
            <div className="relative">
              {preview ? (
                <div className="relative h-64 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl overflow-hidden">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPreview(null); setFormData(prev => ({ ...prev, cover_photo: null })) }}
                    className="absolute top-4 right-4 bg-white/80 text-slate-900 p-2 rounded-lg hover:bg-white transition"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="h-64 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center hover:border-blue-500 hover:bg-blue-50/30 transition">
                    <div className="text-center">
                      <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 font-medium">Click to upload or drag</p>
                      <p className="text-slate-500 text-sm">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Trip Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Trip Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Summer in Europe 2024"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell us about your trip..."
              rows="4"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 resize-none"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date *
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                End Date *
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                required
              />
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Budget
            </label>
            <input
              type="number"
              name="total_budget"
              value={formData.total_budget}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t border-white/20">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 brand-button py-3 rounded-lg font-semibold transition disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              {loading ? 'Creating Trip...' : 'Create Trip'}
            </button>
            <Link
              to="/trips"
              className="flex-1 flex items-center justify-center px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-white/50 transition"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* Tips */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-8 premium-card rounded-xl p-6 backdrop-blur-md"
        >
          <h3 className="font-semibold text-slate-900 mb-3">💡 Tips</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Give your trip a memorable name that describes the destination</li>
            <li>• Add a budget estimate to track your spending</li>
            <li>• Upload a cover photo to make your trip more visually appealing</li>
            <li>• You can add cities and activities after creating the trip</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default CreateTrip
