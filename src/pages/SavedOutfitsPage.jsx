// src/pages/SavedOutfitsPage.jsx
// Shows all outfits the user has bookmarked from the suggestions page.
// Each outfit row is stored as a JSON array of wardrobe item ids — this page
// re-fetches those items to display the actual clothing details and photos.

import { useState, useEffect } from 'react'
import { useAuth }             from '../context/AuthContext'
import { supabase }            from '../services/supabase'
import { deleteSavedOutfit }   from '../services/supabase'

const CATEGORY_EMOJI = {
  Tops: '👕', Bottoms: '👖', Outerwear: '🧥',
  Shoes: '👟', Accessories: '👜', Dresses: '👗', Other: '✨',
}

export default function SavedOutfitsPage() {
  const { user } = useAuth()
  const [saved,   setSaved]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) loadSaved() }, [user])

  const loadSaved = async () => {
    setLoading(true)
    try {
      // Get all saved outfit rows for this user
      const { data, error } = await supabase
        .from('saved_outfits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error

      // For each saved outfit, look up the actual wardrobe items by their ids
      const hydrated = await Promise.all((data || []).map(async (outfit) => {
        const ids = JSON.parse(outfit.outfit_data || '[]')
        if (!ids.length) return { ...outfit, items: [] }
        const { data: items } = await supabase
          .from('wardrobe_items')
          .select('*')
          .in('id', ids)
        return { ...outfit, items: items || [] }
      }))

      setSaved(hydrated)
    } catch (err) {
      console.error('Failed to load saved outfits:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this saved outfit?')) return
    try {
      await deleteSavedOutfit(id)
      setSaved(prev => prev.filter(o => o.id !== id))
    } catch (err) { console.error('Failed to remove outfit:', err) }
  }

  return (
    <div className="page-container" style={{ paddingTop: 'calc(var(--nav-h) + 32px)', paddingBottom: 60 }}>
      <h1 className="section-title" style={{ marginBottom: 8 }}>Saved outfits</h1>
      <p style={{ color: 'var(--ink-muted)', marginBottom: 32, fontSize: 15 }}>
        {saved.length} saved {saved.length === 1 ? 'look' : 'looks'}
      </p>

      {loading ? (
        <div className="centered"><div className="spinner" /></div>
      ) : saved.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">♡</div>
          <h3>No saved outfits yet</h3>
          <p>Head to Outfits and save the looks you love.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {saved.map(outfit => (
            <div key={outfit.id} className="card" style={{ overflow: 'hidden' }}>

              {/* Photo strip */}
              <div style={{ display: 'flex', height: 130, background: 'var(--cream)' }}>
                {outfit.items.slice(0, 4).map((item, idx) => (
                  <div key={item.id} style={{
                    flex: 1, overflow: 'hidden',
                    borderRight: idx < Math.min(outfit.items.length, 4) - 1 ? '1px solid var(--cream-dark)' : 'none',
                  }}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                        {CATEGORY_EMOJI[item.category] ?? '✨'}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Item list */}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                  {outfit.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13 }}>{CATEGORY_EMOJI[item.category] ?? '✨'}</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</span>
                    </div>
                  ))}
                </div>

                {outfit.weather_note && (
                  <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 8 }}>{outfit.weather_note}</p>
                )}

                <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 12 }}>
                  Saved {new Date(outfit.created_at).toLocaleDateString()}
                </p>

                <button onClick={() => handleDelete(outfit.id)} className="btn btn-danger" style={{ fontSize: 13, padding: '6px 12px' }}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
