// src/hooks/useWeather.js
import { useState, useEffect, useCallback } from 'react'
import { getCurrentWeather, getWeatherForDate, isCollectionFriendly } from '../services/weather'

// Returns tomorrow's date string
function getTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

// Auto-fetches weather and checks if tomorrow's schedules need weather warnings
export function useWeather() {
  const [current, setCurrent] = useState(null)
  const [tomorrow, setTomorrow] = useState(null)
  const [tomorrowCheck, setTomorrowCheck] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchWeather = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [currentData, tomorrowData] = await Promise.all([
        getCurrentWeather(),
        getWeatherForDate(getTomorrow()),
      ])
      setCurrent(currentData)
      setTomorrow(tomorrowData)
      setTomorrowCheck(isCollectionFriendly(tomorrowData))
      setLastUpdated(new Date())
    } catch (err) {
      setError('Could not fetch weather data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWeather()
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchWeather])

  return { current, tomorrow, tomorrowCheck, loading, error, lastUpdated, refresh: fetchWeather }
}

// Hook to check weather for a specific schedule date
export function useScheduleWeather(scheduleDate) {
  const [weather, setWeather] = useState(null)
  const [check, setCheck] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!scheduleDate) return
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = getTomorrow()
    const sDate = new Date(scheduleDate).toISOString().split('T')[0]

    // Only fetch for today or tomorrow (forecast available)
    const daysDiff = Math.ceil((new Date(sDate) - new Date(today)) / (1000 * 60 * 60 * 24))
    if (daysDiff < 0 || daysDiff > 5) return

    setLoading(true)
    getWeatherForDate(scheduleDate)
      .then((data) => {
        setWeather(data)
        setCheck(isCollectionFriendly(data))
      })
      .finally(() => setLoading(false))
  }, [scheduleDate])

  return { weather, check, loading }
}
