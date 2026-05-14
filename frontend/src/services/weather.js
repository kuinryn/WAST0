// src/services/weather.js
// Fetches weather directly from OpenWeatherMap API
// Falls back to backend proxy if needed

const OWM_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || ''
const DEFAULT_CITY = import.meta.env.VITE_DEFAULT_CITY || 'Davao City'
const DEFAULT_LAT = import.meta.env.VITE_DEFAULT_LAT || 7.1907
const DEFAULT_LON = import.meta.env.VITE_DEFAULT_LON || 125.4553

// Get current weather
export async function getCurrentWeather(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  if (!OWM_KEY) return getMockWeather('today')
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`
    )
    if (!res.ok) throw new Error('OWM error')
    return await res.json()
  } catch {
    return getMockWeather('today')
  }
}

// Get 5-day forecast (3-hour intervals)
export async function get5DayForecast(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  if (!OWM_KEY) return getMockForecast()
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`
    )
    if (!res.ok) throw new Error('OWM error')
    return await res.json()
  } catch {
    return getMockForecast()
  }
}

// Get weather for a specific date (tomorrow)
export async function getWeatherForDate(targetDate, lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  const forecast = await get5DayForecast(lat, lon)
  if (!forecast?.list) return getMockWeather('tomorrow')

  const target = new Date(targetDate)
  const targetStr = target.toISOString().split('T')[0]

  // Find entries matching target date
  const dayEntries = forecast.list.filter(entry => {
    const d = new Date(entry.dt * 1000)
    return d.toISOString().split('T')[0] === targetStr
  })

  if (!dayEntries.length) return getMockWeather('tomorrow')

  // Return midday entry if available, otherwise first
  const midday = dayEntries.find(e => {
    const h = new Date(e.dt * 1000).getHours()
    return h >= 11 && h <= 13
  }) || dayEntries[0]

  return {
    ...midday,
    name: DEFAULT_CITY,
    main: midday.main,
    weather: midday.weather,
    wind: midday.wind,
  }
}

export async function getWeeklyForecast(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  const forecast = await get5DayForecast(lat, lon)
  const entries = forecast?.list || []
  const byDate = new Map()

  entries.forEach(entry => {
    const date = new Date(entry.dt * 1000)
    const key = date.toISOString().split('T')[0]
    const hour = date.getHours()
    const current = byDate.get(key)
    if (!current || Math.abs(hour - 12) < Math.abs(current.hour - 12)) {
      byDate.set(key, { entry, hour, date })
    }
  })

  return Array.from(byDate.values()).slice(0, 7).map(({ entry, date }) => ({
    date,
    temp: Math.round(entry.main?.temp || 0),
    description: entry.weather?.[0]?.description || 'forecast unavailable',
    icon: entry.weather?.[0]?.icon,
  }))
}

// Check if weather is suitable for collection
export function isCollectionFriendly(weatherData) {
  if (!weatherData?.weather) return { suitable: true, reason: 'Unknown' }
  const id = weatherData.weather[0]?.id || 800
  const temp = weatherData.main?.temp || 28

  if (id >= 200 && id < 600) {
    return { suitable: false, reason: 'Rain or storm expected', icon: '⛈️' }
  }
  if (temp > 38) {
    return { suitable: false, reason: 'Extreme heat advisory', icon: '🌡️' }
  }
  return { suitable: true, reason: 'Good conditions for collection', icon: '✅' }
}

// Weather icon URL
export function getWeatherIconUrl(iconCode) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`
}

// Mock data for development/no API key
function getMockWeather(type) {
  const isRainy = type === 'tomorrow'
  return {
    name: DEFAULT_CITY,
    main: { temp: isRainy ? 24 : 30, feels_like: isRainy ? 26 : 34, humidity: isRainy ? 85 : 70 },
    weather: [{ id: isRainy ? 501 : 801, main: isRainy ? 'Rain' : 'Clouds', description: isRainy ? 'moderate rain' : 'few clouds', icon: isRainy ? '10d' : '02d' }],
    wind: { speed: isRainy ? 5.2 : 2.8 },
  }
}

function getMockForecast() {
  const list = []
  for (let i = 0; i < 40; i++) {
    const dt = Math.floor(Date.now() / 1000) + i * 10800
    list.push({
      dt,
      main: { temp: 28 + Math.random() * 6, feels_like: 30 + Math.random() * 5, humidity: 65 + Math.random() * 20 },
      weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
      wind: { speed: 2 + Math.random() * 4 },
    })
  }
  return { list, city: { name: DEFAULT_CITY } }
}
