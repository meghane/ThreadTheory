// src/pages/LandingPage.jsx
// Public home page — shown to visitors who aren't logged in yet.

import { Link } from 'react-router-dom'

const FEATURES = [
  {
    icon: '👗',
    title: 'Digital closet',
    desc: 'Upload photos of your clothes and build a wardrobe you can actually search through.',
  },
  {
    icon: '🌤️',
    title: 'Weather-aware outfits',
    desc: "Get suggestions that match today's forecast — no more overdressing or freezing.",
  },
  {
    icon: '✨',
    title: 'Style-based filtering',
    desc: 'Filter by occasion and vibe to discover combinations you would never have thought of.',
  },
  {
    icon: '🎨',
    title: 'Color matching',
    desc: 'The recommendation engine only pairs items whose colors actually work together.',
  },
]

export default function LandingPage() {
  return (
    <div>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px 60px',
        textAlign: 'center',
        background: 'linear-gradient(160deg, var(--cream) 0%, #EDE6DC 100%)',
      }}>
        <div style={{
          display: 'inline-block',
          background: 'var(--sage-light)', color: '#2D5C3A',
          padding: '6px 16px', borderRadius: 100,
          fontSize: 13, fontWeight: 500, marginBottom: 24, letterSpacing: '0.04em',
        }}>
          YOUR CLOSET, REIMAGINED
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(42px, 8vw, 80px)',
          fontWeight: 400, lineHeight: 1.05,
          maxWidth: 700, marginBottom: 24, letterSpacing: '-0.02em',
        }}>
          Stop forgetting what you own.
        </h1>

        <p style={{ fontSize: 18, color: 'var(--ink-light)', maxWidth: 520, marginBottom: 40, lineHeight: 1.7 }}>
          ThreadTheory turns your wardrobe into an outfit machine. Upload your clothes,
          describe your style, and get daily suggestions based on the weather.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/auth" className="btn btn-primary" style={{ padding: '13px 28px', fontSize: 16 }}>
            Get started free
          </Link>
          <Link to="/auth?tab=login" className="btn btn-outline" style={{ padding: '13px 28px', fontSize: 16 }}>
            Sign in
          </Link>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'var(--white)' }}>
        <div className="page-container">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, textAlign: 'center', marginBottom: 48 }}>
            Everything your wardrobe needs
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="card" style={{ padding: '28px 24px' }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', textAlign: 'center', background: 'var(--ink)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 400, color: 'var(--cream)', marginBottom: 20 }}>
          Ready to dress smarter?
        </h2>
        <p style={{ color: 'var(--ink-muted)', marginBottom: 32, fontSize: 16 }}>
          It only takes a few minutes to upload your first items.
        </p>
        <Link to="/auth" className="btn btn-sage" style={{ padding: '13px 32px', fontSize: 16 }}>
          Build my closet →
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer style={{
        padding: '24px', textAlign: 'center',
        background: 'var(--ink)', borderTop: '1px solid #2A2622',
        color: 'var(--ink-muted)', fontSize: 13,
      }}>
        ThreadTheory © 2026 · Cinisi · Pelissier · Thomas
      </footer>
    </div>
  )
}
