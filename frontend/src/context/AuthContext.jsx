import { useEffect, useState } from 'react'
import api from '../api/axios'
import { AuthContext } from './auth-context'
import { registerMessagingToken } from '../services/firebaseMessaging'

function getSavedUser() {
  const token = localStorage.getItem('access_token')
  const savedUser = localStorage.getItem('user')
  if (!token || !savedUser) return null
  try {
    return JSON.parse(savedUser)
  } catch {
    localStorage.clear()
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser)
  const [loading] = useState(false)

  const login = async (email, password) => {
    const res = await api.post('/auth/login/', { email, password })
    localStorage.setItem('access_token', res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }

  const register = async (data) => {
    const res = await api.post('/auth/register/', data)
    localStorage.setItem('access_token', res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  useEffect(() => {
    if (!user) return
    registerMessagingToken().catch(() => {})
  }, [user])

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
