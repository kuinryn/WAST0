import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProfileModal from './ProfileModal'

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  official: 'Barangay Official',
  resident: 'Resident',
}

const ROLE_COLORS = {
  super_admin: 'bg-red-100 text-red-700',
  official: 'bg-blue-100 text-blue-700',
  resident: 'bg-green-100 text-green-700',
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showProfile, setShowProfile] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Get initials for avatar
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-green-600">
            WAST0 🗑️
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[user.role]}`}>
                  {ROLE_LABELS[user.role]}
                </span>

                {/* Clickable profile avatar */}
                <button
                  onClick={() => setShowProfile(true)}
                  title="Edit profile"
                  style={{
                    width: 36, height: 36,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #14532d, #15803d)',
                    border: '2px solid #bbf7d0',
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    boxShadow: '0 2px 6px rgba(21,128,61,0.25)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.08)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(21,128,61,0.4)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(21,128,61,0.25)'
                  }}
                >
                  {initials}
                </button>

                <button
                  onClick={handleLogout}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-600 hover:text-green-600 transition">Login</Link>
                <Link to="/register" className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Profile Modal */}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  )
}