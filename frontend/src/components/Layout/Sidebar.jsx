import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Warehouse,
  Receipt
} from 'lucide-react'

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/bookings', label: 'Bookings', icon: ShoppingCart },
  { path: '/transactions', label: 'Transactions', icon: Receipt },
  { path: '/inventory', label: 'Inventory', icon: Warehouse },
]

function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-52 bg-white border-r flex flex-col">
      <div className="h-15 flex items-center justify-center">
        <img
          src="/img/logo.png"
          alt="Rental System"
          className="h-20 w-auto mx-auto"
        />
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-primary-600 text-black'
                    : 'text-black-300 hover:bg-primary-600'
                    }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar


