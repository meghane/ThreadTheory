// src/components/ClothingCard.jsx
// One card in the wardrobe grid. Shows the item photo (or a placeholder emoji),
// its name, category tag, colour tag, and a short description.
// Hovering reveals an edit button and a delete button.

import { useNavigate } from 'react-router-dom'

// Color of the category pill on each card
const CATEGORY_TAG = {
  Tops:        'tag-neutral',
  Bottoms:     'tag-neutral',
  Outerwear:   'tag-neutral',
  Dresses:     'tag-neutral',
  Shoes:       'tag-neutral',
  Accessories: 'tag-neutral',
  Other:       'tag-neutral',
}

// Fallback emoji when no photo has been uploaded
const CATEGORY_EMOJI = {
  Tops: '👕', Bottoms: '👖', Outerwear: '🧥',
  Dresses: '👗', Shoes: '👟', Other: '✨',
}

export default function ClothingCard({ item, onDelete }) {
  const navigate = useNavigate()

  return (
    <div
      className="card"
      style={{ overflow: 'hidden', transition: 'box-shadow 0.15s, transform 0.15s', position: 'relative' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none' }}
    >
      {/* Square image area — uses padding trick to stay square at any width */}
      <div style={{ width: '100%', paddingBottom: '100%', position: 'relative', background: 'var(--cream)', overflow: 'hidden' }}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
            {CATEGORY_EMOJI[item.category] ?? '✨'}
          </div>
        )}

        {/* Edit and delete buttons — appear over the image on hover */}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          display: 'flex', gap: 4,
          opacity: 0, transition: 'opacity 0.15s',
        }}
          className="card-actions"
        >
          <button
            onClick={() => navigate(`/wardrobe/edit/${item.id}`)}
            title="Edit item"
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(249,246,240,0.92)',
              color: 'var(--ink)', fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✎</button>

          <button
            onClick={() => onDelete(item.id)}
            title="Remove item"
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(26,23,20,0.75)',
              color: 'white', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>
      </div>

      {/* Text info below the image */}
      <div style={{ padding: '12px 14px' }}>
        <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.name || 'Unnamed item'}
        </p>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {item.category && <span className={`tag ${CATEGORY_TAG[item.category] || 'tag-neutral'}`}>{item.category}</span>}
          {item.color    && <span className="tag tag-neutral">{item.color}</span>}
          {item.style    && <span className="tag tag-neutral">{item.style}</span>}
        </div>

        {item.description && (
          <p style={{
            fontSize: 12, color: 'var(--ink-muted)', marginTop: 6,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {item.description}
          </p>
        )}
      </div>

      {/* Inline style to show action buttons on card hover */}
      <style>{`.card:hover .card-actions { opacity: 1 !important; }`}</style>
    </div>
  )
}
