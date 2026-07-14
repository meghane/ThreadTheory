// src/pages/ProfilePage.jsx
// User profile page. Shows account info, wardrobe stats, and a style preference
// picker. Preferences are saved to Supabase and will eventually be used to
// weight the outfit recommendations toward the user's chosen styles.

import { useState, useEffect }     from 'react'
import { useNavigate }             from 'react-router-dom'
import { useAuth }                 from '../context/AuthContext'
import { getWardrobeItems, getUserPreferences, saveUserPreferences } from '../services/supabase'

const STYLE_OPTIONS = [
  'Casual', 'Formal', 'Business', 'Athletic', 'Lounge',
  'Party', 'Beach', 'Outdoor', 'Minimalist', 'Streetwear', 'Boho', 'Classic',
]

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [stats,       setStats]       = useState({ total: 0, byCategory: {} })
  const [stylePrefs,  setStylePrefs]  = useState([])
  const [saving,      setSaving]      = useState(false)
  const [saveStatus,  setSaveStatus]  = useState('') // 'saved' | 'error' | ''

  useEffect(() => {
    if (!user) return
    loadStats()
    loadPreferences()
  }, [user])

  const loadStats = async () => {
    try {
      const items = await getWardrobeItems(user.id)
      const byCategory = {}
      items.forEach(i => { byCategory[i.category] = (byCategory[i.category] || 0) + 1 })
      setStats({ total: items.length, byCategory })
    } catch (err) { console.error('Failed to load wardrobe stats:', err) }
  }

  const loadPreferences = async () => {
    try {
      const prefs = await getUserPreferences(user.id)
      if (prefs?.style_prefs) setStylePrefs(prefs.style_prefs)
    } catch { /* no prefs saved yet — that's fine */ }
  }

  const toggleStyle = (style) => {
    setStylePrefs(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    )
  }

  const handleSavePrefs = async () => {
    setSaving(true)
    setSaveStatus('')
    try {
      await saveUserPreferences(user.id, { style_prefs: stylePrefs })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(''), 2500)
    } catch {
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const categoryEntries = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])

  return (
    <div className="page-container" style={{ paddingTop: 'calc(var(--nav-h) + 32px)', paddingBottom: 60, maxWidth: 700 }}>
      <h1 className="section-title" style={{ marginBottom: 32 }}>My profile</h1>

      {/* ── Account card ─────────────────────────────────── */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          {/* Avatar — first letter of email address */}
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'var(--sage-light)', color: '#2D5C3A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 500,
          }}>
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 500 }}>{user?.email}</p>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
              Member since {new Date(user?.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button onClick={handleSignOut} className="btn btn-outline" style={{ fontSize: 14 }}>
          Sign out
        </button>
      </div>

      {/* ── Wardrobe stats ───────────────────────────────── */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>Wardrobe stats</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12 }}>
          {/* Total count */}
          <div style={{ background: 'var(--cream)', borderRadius: 'var(--radius-sm)', padding: 14, textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 500 }}>{stats.total}</p>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Total items</p>
          </div>
          {/* One tile per category */}
          {categoryEntries.map(([cat, count]) => (
            <div key={cat} style={{ background: 'var(--cream)', borderRadius: 'var(--radius-sm)', padding: 14, textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 500 }}>{count}</p>
              <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{cat}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Style preferences ────────────────────────────── */}
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 6 }}>Style preferences</h2>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 20 }}>
          Pick the styles you gravitate toward — outfit suggestions will favour these.
        </p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {STYLE_OPTIONS.map(style => {
            const on = stylePrefs.includes(style)
            return (
              <button
                key={style}
                onClick={() => toggleStyle(style)}
                style={{
                  padding: '7px 14px', borderRadius: 100, fontSize: 13, fontWeight: 500,
                  border: '1.5px solid',
                  borderColor: on ? 'var(--sage)'       : 'var(--cream-dark)',
                  background:  on ? 'var(--sage-light)' : 'transparent',
                  color:       on ? '#2D5C3A'           : 'var(--ink-muted)',
                  transition: 'all 0.15s',
                }}
              >
                {style}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleSavePrefs}
            disabled={saving}
            className="btn btn-primary"
            style={{ opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving…' : 'Save preferences'}
          </button>
          {saveStatus === 'saved' && <span className="success-msg">Saved!</span>}
          {saveStatus === 'error' && <span className="error-msg">Something went wrong — try again.</span>}
        </div>
      </div>
    </div>
  )
}
