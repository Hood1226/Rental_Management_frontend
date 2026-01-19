import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/authService'
import { LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function Header() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await authService.logout() // Call backend logout endpoint
    logout() // Clear local state
    navigate('/login')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-2xl font-semibold text-gray-800">Rental Management System</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-gray-700">
            <User size={20} />
            <span>{user?.userName || 'User'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header


