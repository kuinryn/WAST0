import { getApps, initializeApp } from 'firebase/app'
import { getMessaging, getToken, isSupported } from 'firebase/messaging'
import api from '../api/axios'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every(Boolean) && import.meta.env.VITE_FIREBASE_VAPID_KEY
}

async function getServiceWorkerRegistration() {
  if (!('serviceWorker' in navigator)) return null
  return navigator.serviceWorker.register(
    new URL('../firebase-messaging-sw.js', import.meta.url),
    { type: 'module' },
  )
}

export async function registerMessagingToken() {
  if (!hasFirebaseConfig()) return null
  if (!('Notification' in window)) return null
  if (!(await isSupported())) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const app = getApps()[0] || initializeApp(firebaseConfig)
  const messaging = getMessaging(app)
  const serviceWorkerRegistration = await getServiceWorkerRegistration()
  if (!serviceWorkerRegistration) return null

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration,
  })

  if (token) {
    await api.post('/auth/fcm-token/', { fcm_token: token })
  }

  return token
}
