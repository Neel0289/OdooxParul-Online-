import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutGrid, MapPin, Plus, BarChart3, CheckSquare, FileText, User, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'

const Sidebar = ({ open, onLogout }) => {
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { icon: LayoutGrid, label: 'Dashboard', path: '/dashboard' },
    { icon: MapPin, label: 'My Trips', path: '/trips' },
    { icon: Plus, label: 'New Trip', path: '/create-trip' },
    { icon: BarChart3, label: 'Budget', path: '/budget' },
    { icon: CheckSquare, label: 'Packing', path: '/packing' },
    { icon: FileText, label: 'Notes', path: '/notes' },
    { icon: User, label: 'Profile', path: '/profile' },
  ]

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      localStorage.removeItem('authToken')
    }
    navigate('/login')
  }

  return (
    <motion.div
      animate={{ width: open ? 250 : 80 }}
      transition={{ duration: 0.3 }}
      className="glass border-r border-white/40 flex flex-col h-screen overflow-y-auto"
    >
      <div className="p-6">
        <div className="text-2xl font-bold text-center bg-gradient-to-br from-blue-600 to-teal-500 bg-clip-text text-transparent">✈️</div>
      </div>

      <nav className="flex-1 px-3 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname.includes(item.path)
          const Icon = item.icon
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all interactive-lift ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-white/70'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {open && <span className="font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/40">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {open && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </motion.div>
  )
}

export default Sidebar
