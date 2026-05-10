import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, Mail, User, LogOut, Save, Lock } from 'lucide-react'

const Profile = ({ onLogout }) => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    bio: '',
    two_factor_enabled: false,
    profile_public: true,
    show_email: true
  })
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [qrDataUri, setQrDataUri] = useState(null)
  const [verificationCode, setVerificationCode] = useState('')
  const fileInputRef = useRef(null)

  const handlePhotoChange = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const form = new FormData()
      form.append('profile_picture', file)

      const doUpload = async (prefix = 'Bearer') => {
        return await fetch('http://localhost:8000/api/current-profile/', {
          method: 'PUT',
          headers: {
            'Authorization': `${prefix} ${token}`
            // NOTE: do NOT set Content-Type for FormData
          },
          body: form
        })
      }

      let res = await doUpload('Bearer')
      if (res.status === 401) res = await doUpload('Token')

      if (res.ok) {
        setSuccess('Photo uploaded')
        // Refresh profile to get new image URL
        fetchProfile()
      } else {
        setError('Failed to upload photo')
      }
    } catch (err) {
      setError('An error occurred while uploading photo')
    } finally {
      setLoading(false)
      // clear input
      e.target.value = ''
    }
  }

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
      // Try Bearer first, fall back to Token if needed
      let response = await fetch('http://localhost:8000/api/current-profile/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.status === 401) {
        response = await fetch('http://localhost:8000/api/current-profile/', {
          headers: { 'Authorization': `Token ${token}` }
        })
      }

      if (response.ok) {
        let data = await response.json()
        // API may return a list (router list endpoint) or single object
        if (Array.isArray(data)) data = data[0] || null
        if (!data) {
          setError('Profile not found')
        } else {
          setProfile(data)
          setUser(data.user)
          setFormData({
            first_name: data.user.first_name || '',
            last_name: data.user.last_name || '',
            email: data.user.email || '',
            bio: data.bio || '',
            two_factor_enabled: data.two_factor_enabled || false,
            profile_public: typeof data.profile_public === 'boolean' ? data.profile_public : true,
            show_email: typeof data.show_email === 'boolean' ? data.show_email : true
          })
        }
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

  const updateProfileField = async (payload) => {
    const token = localStorage.getItem('authToken')
    if (!token) return { ok: false }

    const doPut = async (prefix = 'Bearer') => {
      return await fetch('http://localhost:8000/api/current-profile/', {
        method: 'PUT',
        headers: {
          'Authorization': `${prefix} ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
    }

    let response = await doPut('Bearer')
    if (response.status === 401) response = await doPut('Token')
    return response
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')

      const doPut = async (prefix = 'Bearer') => {
        return await fetch('http://localhost:8000/api/current-profile/', {
          method: 'PUT',
          headers: {
            'Authorization': `${prefix} ${token}`,
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
      }

      let response = await doPut('Bearer')
      if (response.status === 401) response = await doPut('Token')

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

  const handleChangePassword = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      if (!token) throw new Error('Not authenticated')

      const doPost = async (prefix = 'Bearer') => {
        return await fetch('http://localhost:8000/api/change-password/', {
          method: 'POST',
          headers: {
            'Authorization': `${prefix} ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
        })
      }

      let response = await doPost('Bearer')
      if (response.status === 401) response = await doPost('Token')

      if (response.ok) {
        setSuccess('Password changed successfully')
        setShowChangePassword(false)
        setOldPassword('')
        setNewPassword('')
      } else {
        const data = await response.json().catch(() => ({}))
        setError(data.error || 'Failed to change password')
      }
    } catch (err) {
      setError('An error occurred while changing password')
    } finally {
      setLoading(false)
    }
  }

  const start2FASetup = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      let res = await fetch('http://localhost:8000/api/2fa/generate/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 401) {
        // retry with Token prefix
        res = await fetch('http://localhost:8000/api/2fa/generate/', {
          headers: { 'Authorization': `Token ${token}` }
        })
      }
      if (res.ok) {
        const data = await res.json()
        setQrDataUri(data.qr_code)
        setShow2FASetup(true)
      } else {
        setError('Failed to start 2FA setup')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const verify2FACode = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      let res = await fetch('http://localhost:8000/api/2fa/verify/', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode })
      })
      if (res.status === 401) {
        res = await fetch('http://localhost:8000/api/2fa/verify/', {
          method: 'POST',
          headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: verificationCode })
        })
      }
      if (res.ok) {
        setSuccess('Two-factor enabled')
        setShow2FASetup(false)
        setVerificationCode('')
        fetchProfile()
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Failed to verify code')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const disable2FA = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const response = await updateProfileField({ two_factor_enabled: false })
      if (response.ok) {
        setSuccess('Two-factor disabled')
        fetchProfile()
      } else {
        setError('Failed to disable two-factor')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handlePrivacySave = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const payload = {
        profile_public: !!formData.profile_public,
        show_email: !!formData.show_email
      }
      const response = await updateProfileField(payload)
      if (response.ok) {
        setSuccess('Privacy settings saved')
        fetchProfile()
      } else {
        setError('Failed to save privacy settings')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      localStorage.removeItem('authToken')
    }
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
                {profile?.profile_picture ? (
                  <img src={profile.profile_picture} alt="avatar" className="w-32 h-32 rounded-full object-cover shadow-lg" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                    {user?.first_name?.charAt(0) || 'U'}
                  </div>
                )}

                {editing && (
                  <>
                    <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-white p-3 rounded-full shadow-lg hover:bg-slate-50 transition">
                      <Camera className="w-5 h-5 text-slate-600" />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </>
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
            {/* Change Password */}
            <div className="w-full border border-slate-200 rounded-lg p-4 bg-white/40">
              <div className="flex items-center justify-between">
                <div className="font-medium text-slate-800">Change Password</div>
                <button onClick={() => setShowChangePassword(!showChangePassword)} className="text-sm text-blue-600 hover:underline">{showChangePassword ? 'Hide' : 'Update'}</button>
              </div>
              {showChangePassword && (
                <div className="mt-3 space-y-3">
                  <input
                    type="password"
                    placeholder="Current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleChangePassword} disabled={loading || !oldPassword || !newPassword} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{loading ? 'Saving...' : 'Save'}</button>
                    <button onClick={() => { setShowChangePassword(false); setOldPassword(''); setNewPassword('') }} className="px-4 py-2 border rounded-lg">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* Two-Factor */}
            <div className="w-full border border-slate-200 rounded-lg p-4 bg-white/40">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-800">Two-Factor Authentication</div>
                  <div className="text-sm text-slate-600">Enhance account security with 2FA</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-sm ${formData.two_factor_enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {formData.two_factor_enabled ? 'Enabled' : 'Disabled'}
                  </div>
                  {!formData.two_factor_enabled ? (
                    <button onClick={start2FASetup} disabled={loading} className="px-3 py-1 border rounded-lg">Enable</button>
                  ) : (
                    <button onClick={disable2FA} disabled={loading} className="px-3 py-1 border rounded-lg">Disable</button>
                  )}
                </div>
              </div>

              {show2FASetup && (
                <div className="mt-4 space-y-3">
                  <div className="text-sm text-slate-700">Scan this QR with your authenticator app (Google Authenticator, Authy), then enter the code below to verify.</div>
                  {qrDataUri && <img src={qrDataUri} alt="2FA QR" className="w-48 h-48 mt-2" />}
                  <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="Enter code from app" className="w-full px-3 py-2 border rounded-lg" />
                  <div className="flex gap-2">
                    <button onClick={verify2FACode} disabled={loading || !verificationCode} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Verify</button>
                    <button onClick={() => { setShow2FASetup(false); setQrDataUri(null); setVerificationCode('') }} className="px-4 py-2 border rounded-lg">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* Privacy Settings */}
            <div className="w-full border border-slate-200 rounded-lg p-4 bg-white/40">
              <div className="font-medium text-slate-800">Privacy Settings</div>
              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={formData.profile_public} onChange={(e) => setFormData(prev => ({ ...prev, profile_public: e.target.checked }))} />
                  <div>
                    <div className="font-medium">Public profile</div>
                    <div className="text-sm text-slate-600">Allow others to view your public profile</div>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={formData.show_email} onChange={(e) => setFormData(prev => ({ ...prev, show_email: e.target.checked }))} />
                  <div>
                    <div className="font-medium">Show email</div>
                    <div className="text-sm text-slate-600">Display your email on your public profile</div>
                  </div>
                </label>

                <div className="mt-3">
                  <button onClick={handlePrivacySave} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save privacy settings</button>
                </div>
              </div>
            </div>
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
