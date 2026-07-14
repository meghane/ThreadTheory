// src/components/OutfitCard.jsx
// Displays one generated outfit. Shows a strip of item photos (or emoji fallbacks),
// lists every piece in the outfit, displays Gemini's custom title & style rationale,
// includes a weather note, and has a save button.

const CATEGORY_EMOJI = {
  Tops: '👕', Bottoms: '👖', Outerwear: '🧥',
  Shoes: '👟', Accessories: '👜', Dresses: '👗', Other: '✨',
}

export default function OutfitCard({ outfit, onSave, saved, saving }) {
  const { items, weatherNote, title, description } = outfit

  // Show up to 4 items in the photo strip — more than that gets cramped
  const stripItems = items.slice(0, 4)

  return (
    <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Photo strip — each item gets an equal slice of the width */}
      <div style={{ display: 'flex', height: 130, background: 'var(--cream)' }}>
        {stripItems.map((item, idx) => (
          <div
            key={item.id}
            style={{
              flex: 1, overflow: 'hidden',
              borderRight: idx < stripItems.length - 1 ? '1px solid var(--cream-dark)' : 'none',
            }}
          >
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>
                {CATEGORY_EMOJI[item.category] ?? '✨'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        
        {/* Gemini-Generated Custom Title */}
        <h3 style={{ 
          fontSize: 16, 
          fontWeight: 600, 
          color: 'var(--ink)', 
          margin: '0 0 8px 0',
          lineHeight: 1.2 
        }}>
          {title || "Classic Combination"}
        </h3>

        {/* Item List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>{CATEGORY_EMOJI[item.category] ?? '✨'}</span>
              <span style={{ fontSize: 13, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name}
              </span>
              {item.color && <span className="tag tag-neutral" style={{ fontSize: 11, flexShrink: 0 }}>{item.color}</span>}
            </div>
          ))}
        </div>

        {/* Gemini-Generated Style Rationale/Description */}
        {description && (
          <p style={{ 
            fontSize: 13, 
            color: 'var(--ink-muted)', 
            lineHeight: 1.4, 
            margin: '0 0 12px 0' 
          }}>
            {description}
          </p>
        )}

        {/* Weather context note */}
        {weatherNote && (
          <p style={{ 
            fontSize: 12, 
            color: 'var(--ink-muted)', 
            fontStyle: 'italic',
            marginTop: 'auto', // Pushes weather context to bottom of content area
            marginBottom: 12 
          }}>
            ☀️ {weatherNote}
          </p>
        )}

        {/* Save button — turns into a confirmation once saved */}
        <button
          onClick={() => !saved && onSave(outfit)}
          disabled={saved || saving}
          className={saved ? 'btn btn-outline' : 'btn btn-sage'}
          style={{
            width: '100%', justifyContent: 'center', padding: '9px',
            marginTop: !weatherNote ? 'auto' : 0, // Fallback push if no weather note exists
            opacity: saving ? 0.6 : 1,
            color: saved ? 'var(--sage)' : undefined,
            borderColor: saved ? 'var(--sage)' : undefined,
          }}
        >
          {saved ? '✓ Saved' : saving ? 'Saving…' : '♡  Save outfit'}
        </button>
      </div>
    </div>
  )
}