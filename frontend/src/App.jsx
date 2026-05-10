import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/layout/Navbar'
import Sidebar from './components/layout/Sidebar'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import TripList from './pages/TripList'
import CreateTrip from './pages/CreateTrip'
import TripDetail from './pages/TripDetail'
import ItineraryBuilder from './pages/ItineraryBuilder'
import BudgetTracker from './pages/BudgetTracker'
import PackingChecklist from './pages/PackingChecklist'
import Notes from './pages/Notes'
import Profile from './pages/Profile'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken')
    if (token) {
      setIsAuthenticated(true)
      // Fetch user profile
      fetchUserProfile(token)
    }
  }, [])

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch('http://localhost:8000/api/user-profile/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  return (
    <Router>
      <div className="app-shell flex h-screen">
        {isAuthenticated && <Sidebar open={sidebarOpen} />}
        <div className="flex-1 flex flex-col overflow-hidden">
          {isAuthenticated && <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} user={user} />}
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={isAuthenticated ? <Dashboard /> : <Home />} />
              <Route path="/login" element={!isAuthenticated ? <Login setAuth={setIsAuthenticated} setUser={setUser} /> : <Navigate to="/" />} />
              <Route path="/signup" element={!isAuthenticated ? <Signup setAuth={setIsAuthenticated} /> : <Navigate to="/" />} />
              <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/trips" element={isAuthenticated ? <TripList /> : <Navigate to="/login" />} />
              <Route path="/create-trip" element={isAuthenticated ? <CreateTrip /> : <Navigate to="/login" />} />
              <Route path="/trip/:id" element={isAuthenticated ? <TripDetail /> : <Navigate to="/login" />} />
              <Route path="/trip/:id/itinerary" element={isAuthenticated ? <ItineraryBuilder /> : <Navigate to="/login" />} />
              <Route path="/budget" element={isAuthenticated ? <BudgetTracker /> : <Navigate to="/login" />} />
              <Route path="/trip/:id/budget" element={isAuthenticated ? <BudgetTracker /> : <Navigate to="/login" />} />
              <Route path="/packing" element={isAuthenticated ? <PackingChecklist /> : <Navigate to="/login" />} />
              <Route path="/trip/:id/packing" element={isAuthenticated ? <PackingChecklist /> : <Navigate to="/login" />} />
              <Route path="/notes" element={isAuthenticated ? <Notes /> : <Navigate to="/login" />} />
              <Route path="/trip/:id/notes" element={isAuthenticated ? <Notes /> : <Navigate to="/login" />} />
              <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App

