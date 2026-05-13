const WEATHER_META = {
  sunny: { icon: 'sun', label: 'Sunny' },
  cloudy: { icon: 'cloud', label: 'Cloudy' },
  rainy: { icon: 'rain', label: 'Rainy' },
  drizzle: { icon: 'drizzle', label: 'Drizzle' },
  thunderstorm: { icon: 'storm', label: 'Thunderstorm' },
  misty: { icon: 'mist', label: 'Misty' },
  snowy: { icon: 'snow', label: 'Snowy' },
}

const SEVERITY = {
  none: { badge: 'badge-green', label: 'Normal' },
  low: { badge: 'badge-amber', label: 'Light rain' },
  moderate: { badge: 'badge-amber', label: 'Moderate rain' },
  high: { badge: 'badge-red', label: 'Heavy weather' },
}

function WeatherGlyph({ type = 'cloudy' }) {
  const icon = WEATHER_META[type]?.icon || 'cloud'
  return (
    <div className={`weather-glyph weather-glyph-${icon}`} aria-hidden="true">
      <span className="sun-core" />
      <span className="cloud-core" />
      <span className="rain-line one" />
      <span className="rain-line two" />
      <span className="rain-line three" />
      <span className="bolt" />
    </div>
  )
}

export default function WeatherAlertBanner({ alert }) {
  if (!alert) return null
  const severity = SEVERITY[alert.severity] || SEVERITY.low

  return (
    <div className="weather-update-card compact">
      <WeatherGlyph type={alert.weather_type || 'rainy'} />
      <div>
        <p className="weather-card-kicker">Weather Update</p>
        <h3 className="weather-card-title">{alert.condition || 'Weather advisory'}</h3>
        <p className="weather-card-copy">{alert.message}</p>
        <p className="notification-meta">
          {new Date(alert.triggered_at).toLocaleString('en-PH')}
        </p>
      </div>
      <span className={`badge ${severity.badge}`}>
        {severity.label}
      </span>
    </div>
  )
}

export function WeatherUpdates({ updates, title = 'Weather Updates' }) {
  const days = updates?.days || []
  if (!days.length) return null

  return (
    <section className="weather-updates">
      <div className="section-header">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="section-copy">Today, tomorrow, and the coming days for your barangay.</p>
        </div>
      </div>
      <div className="weather-update-grid">
        {days.map(day => {
          const meta = WEATHER_META[day.weather_type] || WEATHER_META.cloudy
          const severity = SEVERITY[day.severity] || SEVERITY.none
          return (
            <article key={day.date} className={`weather-update-card ${day.label === 'Today' ? 'featured' : ''}`}>
              <WeatherGlyph type={day.weather_type} />
              <div className="weather-card-body">
                <div className="weather-card-heading">
                  <div>
                    <p className="weather-card-kicker">{day.label}</p>
                    <h3 className="weather-card-title">{meta.label}</h3>
                  </div>
                  <span className={`badge ${severity.badge}`}>{severity.label}</span>
                </div>
                <p className="weather-card-copy">
                  {day.condition} with {day.rain_probability}% rain chance and {day.rain_volume_mm} mm expected rain.
                </p>
                {day.suggestion?.active && (
                  <div className="suggestion-tag">
                    <strong>{day.suggestion.label}</strong>
                    <span>{day.suggestion.message}</span>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
