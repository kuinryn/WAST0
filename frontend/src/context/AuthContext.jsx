// src/context/AuthContext.jsx
// Integrated: v1 backend auth flow + v2 frontend structure
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as apiLogin, register as apiRegister, getMe, updateProfile } from '../services/api'

const AuthContext = createContext(null)

function getSavedUser() {
  const token = localStorage.getItem('access_token')
  const saved = localStorage.getItem('user')
  if (!token || !saved) return null
  try { return JSON.parse(saved) } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await getMe()
      localStorage.setItem('user', JSON.stringify(data))
      setUser(data)
    } catch {
      setUser(null)
      localStorage.removeItem('user')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) fetchMe()
    else setLoading(false)
  }, [fetchMe])

  const login = async (email, password) => {
    const { data } = await apiLogin({ email, password })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const register = async (formData) => {
    const { data } = await apiRegister(formData)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  const patchProfile = async (formData) => {
    const { data } = await updateProfile(formData)
    localStorage.setItem('user', JSON.stringify(data))
    setUser(data)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, patchProfile, fetchMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
