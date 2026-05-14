// src/components/WeatherWidget.jsx
import { useWeather } from '../hooks/useWeather'
import { getWeatherIconUrl } from '../services/weather'

export default function WeatherWidget({ hasTomorrowSchedules = false }) {
  const { current, tomorrow, tomorrowCheck, loading, lastUpdated, refresh } = useWeather()

  if (loading) {
    return (
      <div className="weather-banner" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
        <span style={{ fontSize: 13, opacity: 0.8 }}>Fetching weather data…</span>
      </div>
    )
  }

  const w = current
  const temp = Math.round(w?.main?.temp || 28)
  const description = w?.weather?.[0]?.description || 'partly cloudy'
  const icon = w?.weather?.[0]?.icon
  const humidity = w?.main?.humidity || 70
  const windSpeed = w?.wind?.speed || 3
  const city = w?.name || 'Your City'

  const tomorrowTemp = Math.round(tomorrow?.main?.temp || 26)
  const tomorrowDesc = tomorrow?.weather?.[0]?.description || 'partly cloudy'
  const tomorrowIcon = tomorrow?.weather?.[0]?.icon
  const isTomorrowBad = tomorrowCheck && !tomorrowCheck.suitable

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Current Weather */}
      <div className="weather-banner">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>
              {city} — Current
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{temp}°</span>
              <span style={{ fontSize: 14, opacity: 0.85, textTransform: 'capitalize' }}>{description}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, opacity: 0.8 }}>
              <span>💧 {humidity}%</span>
              <span>💨 {windSpeed} m/s</span>
              {lastUpdated && (
                <span>🕐 {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            {icon ? (
              <img src={getWeatherIconUrl(icon)} alt={description} style={{ width: 60, height: 60, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))' }} />
            ) : (
              <span style={{ fontSize: 48 }}>🌤️</span>
            )}
            <button
              onClick={refresh}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, padding: '3px 8px', color: 'white', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
            >
              ↻ Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tomorrow's Forecast — highlighted if there's a pickup */}
      <div
        style={{
          background: isTomorrowBad ? '#fff1f2' : (hasTomorrowSchedules ? '#f0fdf4' : 'white'),
          border: `1.5px solid ${isTomorrowBad ? '#fecaca' : (hasTomorrowSchedules ? '#86efac' : 'var(--border)')}`,
          borderRadius: 12,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {tomorrowIcon ? (
          <img src={getWeatherIconUrl(tomorrowIcon)} alt={tomorrowDesc} style={{ width: 40, height: 40 }} />
        ) : (
          <span style={{ fontSize: 32 }}>{isTomorrowBad ? '⛈️' : '🌤️'}</span>
        )}

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: isTomorrowBad ? '#991b1b' : 'var(--green-dark)' }}>
            {hasTomorrowSchedules ? '🗑️ Collection Tomorrow' : 'Tomorrow\'s Forecast'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--charcoal)', marginTop: 2 }}>
            <strong>{tomorrowTemp}°C</strong>
            <span style={{ marginLeft: 6, textTransform: 'capitalize', color: 'var(--muted)' }}>{tomorrowDesc}</span>
          </div>
          {tomorrowCheck && (
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              marginTop: 4,
              color: isTomorrowBad ? '#dc2626' : '#059669',
            }}>
              {tomorrowCheck.icon} {tomorrowCheck.reason}
            </div>
          )}
        </div>

        {hasTomorrowSchedules && (
          <div style={{
            background: isTomorrowBad ? '#fee2e2' : '#dcfce7',
            color: isTomorrowBad ? '#dc2626' : '#15803d',
            borderRadius: 8,
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 700,
            textAlign: 'center',
            flexShrink: 0,
          }}>
            {isTomorrowBad ? '⚠️ ALERT' : '✅ READY'}
          </div>
        )}
      </div>
    </div>
  )
}
