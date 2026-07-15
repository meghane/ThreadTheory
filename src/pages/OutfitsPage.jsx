// src/pages/OutfitsPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useAuth }             from '../context/AuthContext'
import { getWardrobeItems, saveOutfit } from '../services/supabase'
import { getSmartOutfits }     from '../services/outfitEngine'
import useWeather, { weatherToOutfitHint } from '../hooks/useWeather'
import OutfitCard              from '../components/OutfitCard'

<<<<<<< HEAD
const STYLES = ['Any', 'Casual', 'Formal', 'Business', 'Athletic',  'Party', 'Beach',]
=======
const STYLES = ['Any', 'Casual', 'Formal', 'Business', 'Athletic', 'Lounge', 'Party', 'Beach', 'Outdoor']
>>>>>>> 1d4f78dda7022e422c573e745031f990009b5aad

const WEATHER_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '⛈️',
  71: '🌨️', 73: '❄️', 75: '❄️',
  80: '🌧️', 95: '⛈️', 99: '⛈️',
}

export default function OutfitsPage() {
  const { user } = useAuth()
  const { weather, loading: weatherLoading, error: weatherError } = useWeather()

  const [items,           setItems]           = useState([])
  const [loadingItems,    setLoadingItems]    = useState(true)
  const [outfits,         setOutfits]         = useState([])
  const [selectedStyle,   setSelectedStyle]   = useState('Any')
  const [useWeatherMatch, setUseWeatherMatch] = useState(true)
  const [savedIds,        setSavedIds]        = useState(new Set())
  const [savingId,        setSavingId]        = useState(null)
  const [generatingAI,    setGeneratingAI]    = useState(false)

  // Avoid running on accidental multi-renders
  const isFetching = useRef(false)

  useEffect(() => {
    if (!user) return
    getWardrobeItems(user.id)
      .then(data => { setItems(data); setLoadingItems(false) })
      .catch(console.error)
  }, [user])

 // Combine effect to trigger generation when things load or filters change
  useEffect(() => {
    if (loadingItems || weatherLoading || isFetching.current) return;
    
    isFetching.current = true;
    
    const delayDebounce = setTimeout(() => {
      // Pass selectedStyle here to evaluate live state values
      regenerate(selectedStyle).finally(() => {
        isFetching.current = false;
      });
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [items, selectedStyle, useWeatherMatch, weather, loadingItems, weatherLoading])

 const regenerate = async (currentStyle) => {
    // 1. If React passes the click event instead of a string, this line catches it!
    // It checks if currentStyle is a string. If it's an event object, it ignores it 
    // and uses the state variable "selectedStyle" instead.
    let actualStyle = (typeof currentStyle === 'string') ? currentStyle : selectedStyle;
    
    // 2. Normalize "Any" string down to null
    const targetStyle = (actualStyle === 'Any' || !actualStyle) ? null : actualStyle;
    
    const filters = {
      style: targetStyle,
      tempF: (useWeatherMatch && weather) ? weather.tempF : null,
    };
    
    console.log("Filters safely formatted and sent to engine:", filters);
    
    setGeneratingAI(true);
    try {
      const results = await getSmartOutfits(items, filters, 12);
      setOutfits(results);
    } catch (err) {
      console.error('UI Outfit production pipeline encountered an exception:', err);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSave = async (outfit) => {
    setSavingId(outfit.id)
    try {
      await saveOutfit({
        user_id:      user.id,
        outfit_data:  JSON.stringify(outfit.items.map(i => i.id)),
        weather_note: outfit.weatherNote || null,
      })
      setSavedIds(prev => new Set([...prev, outfit.id]))
    } catch (err) {
      console.error('Failed to save outfit:', err)
    } finally {
      setSavingId(null)
    }
  }

  const loading = loadingItems || weatherLoading || generatingAI

  return (
    <div className="page-container" style={{ paddingTop: 'calc(var(--nav-h) + 32px)', paddingBottom: 60 }}>

      <div style={{ marginBottom: 32 }}>
        <h1 className="section-title" style={{ marginBottom: 8 }}>Outfit suggestions</h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: 15 }}>Matched from your wardrobe based on colour, season, and style.</p>
      </div>

      {/* Weather strip */}
      {!weatherLoading && weather && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 32 }}>{WEATHER_ICONS[weather.code] ?? '🌡️'}</span>
            <div>
              <p style={{ fontWeight: 500 }}>{weather.tempF}°F · {weather.description}</p>
              <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Feels like {weather.feelsLikeF}°F</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {weatherToOutfitHint(weather.code, weather.tempC).map(h => (
              <span key={h} className="tag tag-sage">{h}</span>
            ))}
          </div>

          <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--ink-muted)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={useWeatherMatch}
              onChange={e => setUseWeatherMatch(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--sage)' }}
            />
            Match to weather
          </label>
        </div>
      )}

      {weatherError && (
        <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 16, padding: '10px 14px', background: 'var(--cream-dark)', borderRadius: 'var(--radius-sm)' }}>
          {weatherError} — outfit suggestions will ignore weather conditions.
        </div>
      )}

      {/* Style filter row */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 28, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--ink-muted)', marginRight: 4 }}>Style:</span>
        {STYLES.map(s => (
          <button
            key={s}
            disabled={generatingAI}
            onClick={() => {
  setSelectedStyle(s);
  regenerate(s);
}}
            style={{
              padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 500,
              border: '1.5px solid',
              borderColor: selectedStyle === s ? 'var(--ink)'       : 'var(--cream-dark)',
              background:  selectedStyle === s ? 'var(--ink)'       : 'transparent',
              color:       selectedStyle === s ? 'var(--cream)'     : 'var(--ink-muted)',
              transition: 'all 0.15s',
              cursor: generatingAI ? 'not-allowed' : 'pointer',
              opacity: generatingAI && selectedStyle !== s ? 0.6 : 1
            }}
          >
            {s}
          </button>
        ))}
        <button 
          disabled={generatingAI}
          onClick={regenerate} 
          className="btn btn-sage" 
          style={{ marginLeft: 8, padding: '6px 14px', cursor: generatingAI ? 'not-allowed' : 'pointer' }}
        >
          {generatingAI ? 'Styling...' : '↻ Shuffle'}
        </button>
      </div>

      {/* Outfits grid */}
      {loading && outfits.length === 0 ? (
        <div className="centered" style={{ padding: '40px 0' }}>
          <div className="spinner" />
          {generatingAI && <p style={{ color: 'var(--ink-muted)', fontSize: 14, marginTop: 12 }}>Gemini is curating style options...</p>}
        </div>
      ) : items.length < 3 ? (
        <div className="empty-state">
          <div className="empty-icon">👗</div>
          <h3>Not enough items yet</h3>
          <p>Add at least 3–4 clothing items to your wardrobe to get outfit suggestions.</p>
        </div>
      ) : outfits.length === 0 ? (
        <div className="empty-state">
          <h3>No outfits match these filters</h3>
          <p>Try a different style or turn off weather matching.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {outfits.map(outfit => (
            <div key={outfit.id} style={{ position: 'relative' }}>
              {outfit.isFallback && (
                <span className="tag" style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, background: '#f0eae4', color: '#555', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}>
<<<<<<< HEAD
                 
=======
                  ⚙️ Standby Look
>>>>>>> 1d4f78dda7022e422c573e745031f990009b5aad
                </span>
              )}
              <OutfitCard
                outfit={outfit}
                onSave={handleSave}
                saved={savedIds.has(outfit.id)}
                saving={savingId === outfit.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}