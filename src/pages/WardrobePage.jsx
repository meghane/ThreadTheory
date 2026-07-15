// src/pages/WardrobePage.jsx
// The main wardrobe view. Loads all of the user's clothing items and displays
// them in a grid. Supports searching by name/description and filtering by
// category, colour, and style.

import { useState, useEffect } from 'react'
import { Link }                from 'react-router-dom'
import { useAuth }             from '../context/AuthContext'
import { getWardrobeItems, deleteWardrobeItem } from '../services/supabase'
import ClothingCard            from '../components/ClothingCard'

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Dresses', 'Other']
const COLORS     = ['All', 'Black', 'White', 'Gray', 'Beige', 'Brown', 'Navy', 'Blue', 'Green', 'Red', 'Pink', 'Purple', 'Yellow', 'Orange', 'Multicolor']
const STYLES     = ['All', 'Casual', 'Formal', 'Business', 'Athletic','Party', 'Beach']

export default function WardrobePage() {
  const { user } = useAuth()
  const [items,          setItems]          = useState([])
  const [loading,        setLoading]        = useState(true)
  const [search,         setSearch]         = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeColor,    setActiveColor]    = useState('All')
  const [activeStyle,    setActiveStyle]    = useState('All')

  useEffect(() => { if (user) loadItems() }, [user])

  const loadItems = async () => {
    setLoading(true)
    try   { setItems(await getWardrobeItems(user.id)) }
    catch (err) { console.error('Failed to load wardrobe:', err) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this item from your wardrobe?')) return
    try {
      await deleteWardrobeItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (err) { console.error('Failed to delete item:', err) }
  }

  // Apply all active filters to the full items list
  const filtered = items.filter(item => {
    const q = search.toLowerCase()
    return (
      (activeCategory === 'All' || item.category === activeCategory) &&
      (activeColor    === 'All' || item.color    === activeColor)    &&
      (activeStyle    === 'All' || item.style    === activeStyle)    &&
      (!q || item.name?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q))
    )
  })

  // Pill button used for all filter rows
  const FilterPill = ({ label, active, onClick }) => (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 500,
      border: '1.5px solid',
      borderColor: active ? 'var(--ink)'       : 'var(--cream-dark)',
      background:  active ? 'var(--ink)'       : 'transparent',
      color:       active ? 'var(--cream)'     : 'var(--ink-muted)',
      transition: 'all 0.15s',
    }}>
      {label}
    </button>
  )

  return (
    <div className="page-container" style={{ paddingTop: 'calc(var(--nav-h) + 32px)', paddingBottom: 60 }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="section-title" style={{ fontSize: 36 }}>My Wardrobe</h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: 15, marginTop: 4 }}>
            {items.length} {items.length === 1 ? 'item' : 'items'} in your closet
          </p>
        </div>
        <Link to="/wardrobe/add" className="btn btn-primary">+ Add item</Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        <input
          type="text"
          placeholder="Search by name or description…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => <FilterPill key={c} label={c} active={activeCategory === c} onClick={() => setActiveCategory(c)} />)}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Color:</span>
          {COLORS.map(c => <FilterPill key={c} label={c} active={activeColor === c} onClick={() => setActiveColor(c)} />)}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Style:</span>
          {STYLES.map(s => <FilterPill key={s} label={s} active={activeStyle === s} onClick={() => setActiveStyle(s)} />)}
        </div>
      </div>

      {/* Grid / empty states */}
      {loading ? (
        <div className="centered"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👗</div>
          {items.length === 0 ? (
            <>
              <h3>Your closet is empty</h3>
              <p style={{ marginBottom: 24 }}>Add your first clothing item to get started.</p>
              <Link to="/wardrobe/add" className="btn btn-primary">Add my first item</Link>
            </>
          ) : (
            <h3>No items match your filters</h3>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {filtered.map(item => (
            <ClothingCard key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
