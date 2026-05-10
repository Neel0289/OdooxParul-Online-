import React from 'react'
import { Menu, LogOut, User, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const Navbar = ({ toggleSidebar, user, onLogout }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      localStorage.removeItem('authToken')
    }
    navigate('/login')
  }

  return (
    <motion.nav 
      className="glass border-b border-white/40 sticky top-0 z-40"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="p-2 hover:bg-white/60 rounded-xl transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent tracking-tight">
            ✈️ Traveloop
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-sm bg-white/60 border border-white/50 rounded-xl px-3 py-1.5">
            <p className="font-semibold text-slate-900">
              {user?.user?.first_name || 'Traveler'} {user?.user?.last_name || ''}
            </p>
            <p className="text-slate-500 text-xs">{user?.user?.username}</p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => navigate('/profile')}
              className="p-2 hover:bg-white/70 rounded-xl transition-colors"
              title="Profile"
            >
              <User className="w-5 h-5 text-slate-600" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 rounded-xl transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-red-600" />
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

export default Navbar
