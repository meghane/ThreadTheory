// src/context/AuthContext.jsx
// Manages whether a user is logged in globally.
// Any component can call useAuth() to get the current user
// or the signIn / signUp / signOut functions.

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if a session already exists when the page first loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Keep user state in sync if they log in/out in another tab
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp  = (email, password) => supabase.auth.signUp({ email, password })
  const signIn  = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signOut = ()                 => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
