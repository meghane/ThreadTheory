// src/components/Navbar.jsx
// The sticky top navigation bar. Shows the logo + nav links when logged in,
// just the logo and a sign-in button when logged out.
// Meghan: colours and font are pulled from CSS variables in index.css.

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Links shown to logged-in users
const NAV_LINKS = [
  { path: '/wardrobe', label: 'Wardrobe' },
  { path: '/outfits',  label: 'Outfits'  },
  { path: '/saved',    label: 'Saved'    },
]

export default function Navbar() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 'var(--nav-h)',
      background: 'rgba(249,246,240,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--cream-dark)',
      display: 'flex', alignItems: 'center',
    }}>
      <div className="page-container" style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', width: '100%',
      }}>

        {/* Logo — goes to wardrobe if logged in, home if not */}
        <Link to={user ? '/wardrobe' : '/'}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '-0.01em' }}>
            Thread<span style={{ color: 'var(--sage)' }}>Theory</span>
          </span>
        </Link>

        {user && (
          <>
            {/* Page navigation links */}
            <div style={{ display: 'flex', gap: 4 }}>
              {NAV_LINKS.map(({ path, label }) => {
                const active = location.pathname.startsWith(path)
                return (
                  <Link key={path} to={path} style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 14, fontWeight: 500,
                    color:      active ? 'var(--ink)'       : 'var(--ink-muted)',
                    background: active ? 'var(--cream-dark)' : 'transparent',
                    transition: 'all 0.15s',
                  }}>
                    {label}
                  </Link>
                )
              })}
            </div>

            {/* Right side: profile link + sign out */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link to="/profile" className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 14 }}>
                Profile
              </Link>
              <button onClick={handleSignOut} className="btn btn-outline" style={{ padding: '6px 14px', fontSize: 14 }}>
                Sign out
              </button>
            </div>
          </>
        )}

        {/* Not logged in — show sign-in button only */}
        {!user && (
          <Link to="/auth" className="btn btn-primary">Sign in</Link>
        )}
      </div>
    </nav>
  )
}
