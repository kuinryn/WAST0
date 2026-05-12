import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

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

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-green-600">
          WAST0 🗑️
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-gray-600 text-sm">{user.name || user.email}</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[user.role]}`}>
                {ROLE_LABELS[user.role]}
              </span>
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
  )
}
