import { Link, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Warehouse,
  Receipt,
  Shield,
  UserCog,
  KeyRound,
  Layers,
  Building2
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const mainMenuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, moduleKey: 'DASHBOARD' },
  { path: '/products', label: 'Products', icon: Package, moduleKey: 'PRODUCT_MANAGEMENT' },
  { path: '/customers', label: 'Customers', icon: Users, moduleKey: 'CUSTOMER_MANAGEMENT' },
  { path: '/bookings', label: 'Bookings', icon: ShoppingCart, moduleKey: 'BOOKING_MANAGEMENT' },
  { path: '/transactions', label: 'Transactions', icon: Receipt, moduleKey: 'TRANSACTION_MANAGEMENT' },
  { path: '/inventory', label: 'Inventory', icon: Warehouse, moduleKey: 'INVENTORY_MANAGEMENT' },
  { path: '/shop-branch', label: 'Shop & Branch', icon: Building2, moduleKey: 'SHOP_BRANCH_MANAGEMENT' },
]

const userRoleModuleItems = [
  { path: '/users', label: 'Users', icon: UserCog, moduleKey: 'USER_MANAGEMENT' },
  { path: '/roles', label: 'Roles', icon: Shield, moduleKey: 'ROLE_MANAGEMENT' },
  { path: '/role-access', label: 'Role Access', icon: KeyRound, moduleKey: 'ROLE_ACCESS_MANAGEMENT' },
  { path: '/modules', label: 'Modules', icon: Layers, moduleKey: 'MODULE_MANAGEMENT' },
]

function Sidebar() {
  const location = useLocation()
  const { user, hasPermission } = useAuth()

  const visibleMainItems = useMemo(() => {
    if (!user) return []
    return mainMenuItems.filter((item) => hasPermission(item.moduleKey, 'READ'))
  }, [user, hasPermission])

  const visibleUserRoleItems = useMemo(() => {
    if (!user) return []
    return userRoleModuleItems.filter((item) => hasPermission(item.moduleKey, 'READ'))
  }, [user, hasPermission])

  const renderLink = (item) => {
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
  }

  return (
    <aside className="w-52 bg-white border-r flex flex-col">
      <div className="h-15 flex items-center justify-center">
        <img
          src="/img/logo.png"
          alt="Rental System"
          className="h-20 w-auto mx-auto"
        />
      </div>
      <nav className="flex-1 p-4 overflow-y-auto">
        {visibleMainItems.length > 0 && (
          <ul className="space-y-2">
            {visibleMainItems.map(renderLink)}
          </ul>
        )}
        {visibleUserRoleItems.length > 0 && (
          <div className={`pt-4 mt-4 border-t border-gray-200 ${visibleMainItems.length === 0 ? '' : ''}`}>
            <p className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              User &amp; access
            </p>
            <ul className="space-y-2 mt-1">
              {visibleUserRoleItems.map(renderLink)}
            </ul>
          </div>
        )}
      </nav>
    </aside>
  )
}

export default Sidebar


