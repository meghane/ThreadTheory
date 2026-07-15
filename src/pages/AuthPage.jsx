// src/pages/AuthPage.jsx
// Sign in / sign up page. Both forms live here with a tab switcher.
// Supabase handles the actual auth — this page just collects the inputs.

import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const [searchParams]  = useSearchParams()
  const [isLogin, setIsLogin] = useState(searchParams.get('tab') !== 'signup')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [message,  setMessage]  = useState('')
  const [loading,  setLoading]  = useState(false)

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const switchTab = (login) => { setIsLogin(login); setError(''); setMessage('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!isLogin && password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) throw error
        navigate('/wardrobe')
      } else {
        const { error } = await signUp(email, password)
        if (error) throw error
        // Supabase sends a confirmation email — tell the user to check it
        setMessage('Check your email to confirm your account, then sign in.')
        setIsLogin(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '80px 24px 40px',
      background: 'linear-gradient(160deg, var(--cream) 0%, #EDE6DC 100%)',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: '40px 36px' }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'block', textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 26 }}>
            Thread<span style={{ color: 'var(--sage)' }}>Theory</span>
          </span>
        </Link>

        {/* Sign in / Sign up tab toggle */}
        <div style={{ display: 'flex', background: 'var(--cream)', borderRadius: 'var(--radius-sm)', padding: 3, marginBottom: 28 }}>
          {['Sign in', 'Sign up'].map((label, i) => (
            <button
              key={label}
              onClick={() => switchTab(i === 0)}
              style={{
                flex: 1, padding: 8, borderRadius: 'calc(var(--radius-sm) - 2px)',
                fontSize: 14, fontWeight: 500, transition: 'all 0.15s',
                background: (i === 0) === isLogin ? 'var(--white)' : 'transparent',
                color:      (i === 0) === isLogin ? 'var(--ink)'   : 'var(--ink-muted)',
                boxShadow:  (i === 0) === isLogin ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Success message (e.g. after sign-up) */}
        {message && (
          <div style={{
            background: 'var(--sage-light)', color: '#2D5C3A',
            padding: '12px 16px', borderRadius: 'var(--radius-sm)',
            fontSize: 14, marginBottom: 20,
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>

          {/* Confirm password field only shows on the sign-up tab */}
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <input type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
          )}

          {error && <p className="error-msg">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ justifyContent: 'center', padding: 12, marginTop: 4, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
