// src/pages/EditItemPage.jsx
// Lets the user update any detail on an existing clothing item.
// Loads the item by id from the URL, pre-fills the form, and saves changes
// back to Supabase on submit. A new photo can also be uploaded here.

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams }      from 'react-router-dom'
import { useAuth }                     from '../context/AuthContext'
import { getWardrobeItem, updateWardrobeItem, uploadClothingImage } from '../services/supabase'

const CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories', 'Dresses', 'Other']
const COLORS     = ['Black', 'White', 'Gray', 'Beige', 'Brown', 'Navy', 'Blue', 'Green', 'Red', 'Pink', 'Purple', 'Yellow', 'Orange', 'Multicolor']
const STYLES     = ['Casual', 'Formal', 'Business', 'Athletic', 'Lounge', 'Party', 'Beach', 'Outdoor']
const SEASONS    = ['All seasons', 'Spring', 'Summer', 'Fall', 'Winter']

export default function EditItemPage() {
  const { id }   = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef  = useRef()

  const [form,         setForm]         = useState(null)   // null while loading
  const [imageFile,    setImageFile]    = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  // Fetch the item when the page loads so we can pre-fill the form
  useEffect(() => {
    getWardrobeItem(id)
      .then(data => { setForm(data); setLoading(false) })
      .catch(() => { setError('Could not load item.'); setLoading(false) })
  }, [id])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    if (file.size > 10 * 1024 * 1024)   { setError('Image must be under 10 MB.'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name)     { setError('Name is required.'); return }
    if (!form.category) { setError('Category is required.'); return }

    setSaving(true)
    setError('')

    try {
      // Only upload a new image if the user picked one; otherwise keep the existing URL
      const image_url = imageFile
        ? await uploadClothingImage(imageFile, user.id)
        : form.image_url

      await updateWardrobeItem(id, {
        name:        form.name,
        category:    form.category,
        color:       form.color,
        style:       form.style,
        season:      form.season,
        brand:       form.brand,
        description: form.description,
        image_url,
      })

      navigate('/wardrobe')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="centered"><div className="spinner" /></div>
  if (!form)   return <div className="centered"><p>Item not found.</p></div>

  // The photo to show: a new local preview, or the existing saved URL
  const displayImage = imagePreview || form.image_url

  return (
    <div className="page-container" style={{ paddingTop: 'calc(var(--nav-h) + 32px)', paddingBottom: 60, maxWidth: 720 }}>
      <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ marginBottom: 16, padding: '6px 0' }}>
        ← Back to wardrobe
      </button>

      <h1 className="section-title" style={{ marginBottom: 32 }}>Edit item</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Photo ─────────────────────────────────────── */}
        <div className="form-group">
          <label className="form-label">Photo</label>
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={e => { e.preventDefault(); handleImageChange({ target: { files: e.dataTransfer.files } }) }}
            onDragOver={e => e.preventDefault()}
            style={{
              border: '2px dashed var(--cream-dark)', borderRadius: 'var(--radius-md)',
              padding: 24, textAlign: 'center', cursor: 'pointer',
              background: 'var(--cream)', minHeight: 160,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 12,
            }}
          >
            {displayImage ? (
              <img src={displayImage} alt="Preview" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 'var(--radius-sm)', objectFit: 'contain' }} />
            ) : (
              <>
                <span style={{ fontSize: 36 }}>📷</span>
                <p style={{ fontWeight: 500 }}>Click or drag to replace photo</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
        </div>

        {/* ── Name ──────────────────────────────────────── */}
        <div className="form-group">
          <label className="form-label">Item name *</label>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>

        {/* ── Description ───────────────────────────────── */}
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea rows={3} value={form.description || ''} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
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
            <select value={form.color || ''} onChange={e => set('color', e.target.value)}>
              <option value="">Select…</option>
              {COLORS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* ── Style + Season ────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Style / occasion</label>
            <select value={form.style || ''} onChange={e => set('style', e.target.value)}>
              <option value="">Any</option>
              {STYLES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Season</label>
            <select value={form.season || 'All seasons'} onChange={e => set('season', e.target.value)}>
              {SEASONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* ── Brand ─────────────────────────────────────── */}
        <div className="form-group">
          <label className="form-label">Brand (optional)</label>
          <input type="text" value={form.brand || ''} onChange={e => set('brand', e.target.value)} />
        </div>

        {error && <p className="error-msg">{error}</p>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '12px 28px', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
