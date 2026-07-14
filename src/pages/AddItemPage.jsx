// src/pages/AddItemPage.jsx
// Form for adding a new clothing item to the wardrobe.
// The user can upload a photo (drag-and-drop or click), give the item a name,
// write a description, and fill in category, colour, style, season, and brand.
// On submit, the image uploads to Supabase Storage, then the item row is saved.

import { useState, useRef } from 'react'
import { useNavigate }       from 'react-router-dom'
import { useAuth }           from '../context/AuthContext'
import { addWardrobeItem, uploadClothingImage } from '../services/supabase'

const CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories', 'Dresses', 'Other']
const COLORS     = ['Black', 'White', 'Gray', 'Beige', 'Brown', 'Navy', 'Blue', 'Green', 'Red', 'Pink', 'Purple', 'Yellow', 'Orange', 'Multicolor']
const STYLES     = ['Casual', 'Formal', 'Business', 'Athletic', 'Lounge', 'Party', 'Beach', 'Outdoor']
const SEASONS    = ['All seasons', 'Spring', 'Summer', 'Fall', 'Winter']

const EMPTY_FORM = { name: '', category: '', color: '', style: '', season: 'All seasons', brand: '', description: '' }

export default function AddItemPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef  = useRef()

  const [form,         setForm]         = useState(EMPTY_FORM)
  const [imageFile,    setImageFile]    = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  // Validate and preview the selected image file
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    if (file.size > 10 * 1024 * 1024)   { setError('Image must be under 10 MB.'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleImageChange({ target: { files: e.dataTransfer.files } })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name)     { setError('Please give this item a name.'); return }
    if (!form.category) { setError('Please select a category.'); return }

    setLoading(true)
    setError('')

    try {
      // Upload the photo first (if one was selected), then save the item row
      const image_url = imageFile ? await uploadClothingImage(imageFile, user.id) : null
      await addWardrobeItem({ user_id: user.id, ...form, image_url })
      navigate('/wardrobe')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container" style={{ paddingTop: 'calc(var(--nav-h) + 32px)', paddingBottom: 60, maxWidth: 720 }}>
      <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ marginBottom: 16, padding: '6px 0' }}>
        ← Back to wardrobe
      </button>

      <h1 className="section-title" style={{ marginBottom: 32 }}>Add clothing item</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Photo upload ───────────────────────────────── */}
        <div className="form-group">
          <label className="form-label">Photo</label>
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            style={{
              border: '2px dashed var(--cream-dark)', borderRadius: 'var(--radius-md)',
              padding: 24, textAlign: 'center', cursor: 'pointer',
              background: 'var(--cream)', minHeight: 160,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 12, transition: 'border-color 0.15s',
            }}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 'var(--radius-sm)', objectFit: 'contain' }} />
            ) : (
              <>
                <span style={{ fontSize: 36 }}>📷</span>
                <div>
                  <p style={{ fontWeight: 500 }}>Click or drag to upload a photo</p>
                  <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>JPG, PNG, WEBP · max 10 MB</p>
                </div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
          {imagePreview && (
            <button type="button" className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 13, color: 'var(--terracotta)' }}
              onClick={() => { setImageFile(null); setImagePreview(null) }}>
              Remove photo
            </button>
          )}
        </div>

        {/* ── Name ──────────────────────────────────────── */}
        <div className="form-group">
          <label className="form-label">Item name *</label>
          <input type="text" placeholder="e.g. White linen button-up" value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>

        {/* ── Description ───────────────────────────────── */}
        <div className="form-group">
          <label className="form-label">Describe the item</label>
          <textarea
            rows={3}
            placeholder="Describe what it looks like, the fabric, fit, or any details that would help with matching outfits…"
            value={form.description}
            onChange={e => set('description', e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* ── Category + Colour ─────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} required>
              <option value="">Select…</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Primary color</label>
            <select value={form.color} onChange={e => set('color', e.target.value)}>
              <option value="">Select…</option>
              {COLORS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* ── Style + Season ────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Style / occasion</label>
            <select value={form.style} onChange={e => set('style', e.target.value)}>
              <option value="">Any</option>
              {STYLES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Season</label>
            <select value={form.season} onChange={e => set('season', e.target.value)}>
              {SEASONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* ── Brand (optional) ──────────────────────────── */}
        <div className="form-group">
          <label className="form-label">Brand (optional)</label>
          <input type="text" placeholder="e.g. Zara, Levi's, H&M" value={form.brand} onChange={e => set('brand', e.target.value)} />
        </div>

        {error && <p className="error-msg">{error}</p>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '12px 28px', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Saving…' : 'Save to wardrobe'}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
