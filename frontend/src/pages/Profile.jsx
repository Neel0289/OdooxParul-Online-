import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, Mail, User, LogOut, Save, Lock } from 'lucide-react'

const Profile = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    bio: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await fetch('http://localhost:8000/api/user-profile/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setUser(data.user)
        setFormData({
          first_name: data.user.first_name || '',
          last_name: data.user.last_name || '',
          email: data.user.email || '',
          bio: data.bio || ''
        })
      } else {
        setError('Failed to load profile')
      }
    } catch (err) {
      setError('An error occurred while loading profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('http://localhost:8000/api/user-profile/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email
          },
          bio: formData.bio
        })
      })

      if (response.ok) {
        setSuccess('Profile updated successfully!')
        setEditing(false)
        fetchProfile()
      } else {
        setError('Failed to update profile')
      }
    } catch (err) {
      setError('An error occurred while updating profile')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="page-shell">
        <div className="premium-card rounded-xl p-8 text-center">
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <h1 className="page-title mb-8">My Profile</h1>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="premium-card border border-red-200/50 bg-red-50/50 text-red-700 px-6 py-4 rounded-xl mb-6"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="premium-card border border-green-200/50 bg-green-50/50 text-green-700 px-6 py-4 rounded-xl mb-6"
          >
            {success}
          </motion.div>
        )}

        {/* Profile Card */}
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          initial="hidden"
          animate="visible"
          className="premium-card rounded-2xl p-8 backdrop-blur-md space-y-6"
        >
          {/* Avatar */}
          <motion.div
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                {user?.first_name?.charAt(0) || 'U'}
              </div>
              {editing && (
                <button className="absolute bottom-0 right-0 bg-white p-3 rounded-full shadow-lg hover:bg-slate-50 transition">
                  <Camera className="w-5 h-5 text-slate-600" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Form Fields */}
          <motion.div
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled={!editing}
                  className={`w-full px-4 py-2 border rounded-lg ${
                    editing
                      ? 'border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
                      : 'border-transparent bg-slate-100 text-slate-600'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled={!editing}
                  className={`w-full px-4 py-2 border rounded-lg ${
                    editing
                      ? 'border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
                      : 'border-transparent bg-slate-100 text-slate-600'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!editing}
                className={`w-full px-4 py-2 border rounded-lg ${
                  editing
                    ? 'border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
                    : 'border-transparent bg-slate-100 text-slate-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                disabled={!editing}
                rows="4"
                placeholder="Tell us about yourself..."
                className={`w-full px-4 py-2 border rounded-lg resize-none ${
                  editing
                    ? 'border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
                    : 'border-transparent bg-slate-100 text-slate-600'
                }`}
              />
            </div>

            {profile && (
              <div className="pt-4 border-t border-white/20 text-sm text-slate-600">
                <p>Member since {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            className="flex gap-3 pt-4 border-t border-white/20"
          >
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 brand-button text-white py-2 rounded-lg font-medium transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-white/50 transition"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition"
                >
                  Edit Profile
                </button>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* Account Settings */}
        <motion.div
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="premium-card rounded-2xl p-8 backdrop-blur-md space-y-4 mt-8"
        >
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Account Settings
          </h2>

          <div className="space-y-3 pt-4 border-t border-white/20">
            <button className="w-full px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-white/50 transition text-left font-medium">
              Change Password
            </button>
            <button className="w-full px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-white/50 transition text-left font-medium">
              Two-Factor Authentication
            </button>
            <button className="w-full px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-white/50 transition text-left font-medium">
              Privacy Settings
            </button>
          </div>
        </motion.div>

        {/* Logout Button */}
        <motion.button
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 mt-8 px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </motion.button>
      </motion.div>
    </div>
  )
}

export default Profile
