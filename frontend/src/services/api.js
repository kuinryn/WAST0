// src/services/api.js
// Integrated: v2 frontend design + v1 backend endpoints
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh token on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        const { data } = await axios.post(`${API_BASE}/auth/token/refresh/`, { refresh })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────
export const login = (data) => api.post('/auth/login/', data)
export const register = (data) => api.post('/auth/register/', data)
export const getMe = () => api.get('/auth/me/')
export const updateProfile = (data) => api.patch('/auth/profile/', data)

// ── Schedules ─────────────────────────────────────────
export const getSchedules = (params) => api.get('/schedules/', { params })
export const createSchedule = (data) => api.post('/schedules/', data)
export const updateSchedule = (id, data) => api.put(`/schedules/${id}/`, data)
export const deleteSchedule = (id) => api.delete(`/schedules/${id}/`)
export const scheduleWeatherAction = (id, data) => api.post(`/schedules/${id}/weather-action/`, data)
export const getUpcomingSchedules = () => api.get('/schedules/', { params: { upcoming: true } })
export const getTomorrowSchedules = () => api.get('/schedules/', { params: { tomorrow: true } })

// ── Barangays ─────────────────────────────────────────
export const getBarangays = () => api.get('/barangays/')
export const createBarangay = (data) => api.post('/barangays/', data)
export const updateBarangay = (id, data) => api.put(`/barangays/${id}/`, data)
export const deleteBarangay = (id) => api.delete(`/barangays/${id}/`)

// ── Users (Admin) ─────────────────────────────────────
export const getUsers = () => api.get('/auth/users/')
export const createUser = (data) => api.post('/auth/users/', data)
export const updateUser = (id, data) => api.put(`/auth/users/${id}/`, data)
export const deleteUser = (id) => api.delete(`/auth/users/${id}/`)

// ── Audit Logs ────────────────────────────────────────
export const getAuditLogs = (params) => api.get('/audit/', { params })

// ── Weather ───────────────────────────────────────────
export const getWeatherAlerts = (barangayId) => api.get('/weather/alerts/', { params: { barangay: barangayId } })
export const getTomorrowWeatherRecommendation = (barangayId) => api.get('/weather/tomorrow-recommendation/', { params: { barangay: barangayId } })

// ── Notifications ─────────────────────────────────────
export const registerFCMToken = (token) => api.post('/auth/fcm-token/', { fcm_token: token })
export const getNotifications = () => api.get('/notifications/')

// ── Dashboard ─────────────────────────────────────────
export const getDashboardStats = () => api.get('/schedules/')

export default api
