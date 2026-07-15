// src/main.jsx
// Entry point for the whole app. Defines every URL route and wraps
// everything in the auth system so any page can check if someone's logged in.

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import './index.css'

import Navbar          from './components/Navbar'
import LandingPage     from './pages/LandingPage'
import AuthPage        from './pages/AuthPage'
import WardrobePage    from './pages/WardrobePage'
import AddItemPage     from './pages/AddItemPage'
import EditItemPage    from './pages/EditItemPage'
import OutfitsPage     from './pages/OutfitsPage'
import SavedOutfitsPage from './pages/SavedOutfitsPage'
import ProfilePage     from './pages/ProfilePage'

// Wraps any route that needs a login. Redirects to /auth if the user isn't signed in.
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="centered"><div className="spinner" /></div>
  return user ? children : <Navigate to="/auth" replace />
}

function App() {
  const { user } = useAuth()

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public pages */}
        <Route path="/"     element={user ? <Navigate to="/wardrobe" replace /> : <LandingPage />} />
        <Route path="/auth" element={user ? <Navigate to="/wardrobe" replace /> : <AuthPage />} />

        {/* Protected pages — require login */}
        <Route path="/wardrobe"          element={<PrivateRoute><WardrobePage /></PrivateRoute>} />
        <Route path="/wardrobe/add"      element={<PrivateRoute><AddItemPage /></PrivateRoute>} />
        <Route path="/wardrobe/edit/:id" element={<PrivateRoute><EditItemPage /></PrivateRoute>} />
        <Route path="/outfits"           element={<PrivateRoute><OutfitsPage /></PrivateRoute>} />
        <Route path="/saved"             element={<PrivateRoute><SavedOutfitsPage /></PrivateRoute>} />
        <Route path="/profile"           element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

        {/* Catch-all — send unknown URLs back to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
