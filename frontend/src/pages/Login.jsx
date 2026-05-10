import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, LogIn } from 'lucide-react'

const Login = ({ setAuth, setUser }) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [show2FA, setShow2FA] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = { username: formData.username, password: formData.password }
      // include 2FA code when present
      if (twoFactorCode) payload.two_factor_code = twoFactorCode

      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json().catch(() => ({}))

      // If server indicates 2FA is required, show code input
      if (response.status === 206 || data['2fa_required']) {
        setShow2FA(true)
        setError('Two-factor authentication required. Enter the code from your authenticator.')
        setLoading(false)
        return
      }

      if (response.ok && data.token) {
        localStorage.setItem('authToken', data.token)
        if (setUser && data.user) setUser({ user: data.user })
        setAuth(true)
        navigate('/dashboard')
      } else {
        let message = data.error || 'Invalid username or password'
        setError(message)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handle2FASubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = { username: formData.username, password: formData.password, two_factor_code: twoFactorCode }
      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok && data.token) {
        localStorage.setItem('authToken', data.token)
        if (setUser && data.user) setUser({ user: data.user })
        setAuth(true)
        navigate('/dashboard')
      } else {
        setError(data.error || 'Invalid two-factor code')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-16 -left-20 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-teal-300/25 blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="premium-card border border-white/30 rounded-3xl p-8 backdrop-blur-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
            <p className="text-slate-600">Sign in to your Traveloop account</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Username or Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username or email"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 flex items-center justify-center gap-2 brand-button py-2.5 rounded-xl font-medium transition disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {show2FA && (
            <form onSubmit={handle2FASubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">2FA Code</label>
                <input type="text" name="twoFactorCode" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} placeholder="Enter code from authenticator" className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <button disabled={loading} className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl">Verify & Sign in</button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
