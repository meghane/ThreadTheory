// src/hooks/useWeather.js
// Fetches current weather using the user's location.
// Uses Open-Meteo (free, no API key needed): https://open-meteo.com
// Call this hook in any component that needs weather data:
//   const { weather, loading, error } = useWeather()

import { useState, useEffect } from 'react'

// Maps Open-Meteo weather codes to human-readable descriptions
export const WMO_CODES = {
  0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Foggy',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain',   63: 'Rain',     65: 'Heavy rain',
  71: 'Light snow',   73: 'Snow',     75: 'Heavy snow',
  80: 'Rain showers', 95: 'Thunderstorm', 99: 'Thunderstorm w/ hail',
}

// Returns clothing hint tags based on temperature and weather code.
// These show up as the green pills on the outfit suggestions page.
export function weatherToOutfitHint(code, tempC) {
  const hints = []

  if      (tempC < 5)  hints.push('heavy coat', 'layers')
  else if (tempC < 12) hints.push('jacket', 'sweater')
  else if (tempC < 20) hints.push('light jacket', 'long sleeves')
  else if (tempC < 27) hints.push('t-shirt', 'light layers')
  else                 hints.push('shorts', 'light fabrics', 'breathable top')

  if ([61, 63, 65, 80].includes(code))  hints.push('waterproof layer')
  if ([71, 73, 75].includes(code))      hints.push('warm boots', 'heavy layers')
  if ([45, 48].includes(code))          hints.push('visible colors')

  return hints
}

export default function useWeather() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    // Ask the browser for the user's coordinates
    navigator.geolocation?.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const url = `https://api.open-meteo.com/v1/forecast`
            + `?latitude=${latitude}&longitude=${longitude}`
            + `&current=temperature_2m,weathercode,apparent_temperature`
            + `&temperature_unit=fahrenheit&timezone=auto`

          const res  = await fetch(url)
          const json = await res.json()
          const c    = json.current

          setWeather({
            tempF:      Math.round(c.temperature_2m),
            tempC:      Math.round((c.temperature_2m - 32) * 5 / 9),
            feelsLikeF: Math.round(c.apparent_temperature),
            code:       c.weathercode,
            description: WMO_CODES[c.weathercode] ?? 'Unknown',
          })
        } catch {
          setError('Could not load weather data.')
        } finally {
          setLoading(false)
        }
      },
      // User denied location access
      () => { setError('Location access denied.'); setLoading(false) }
    )
  }, [])

  return { weather, loading, error }
}
