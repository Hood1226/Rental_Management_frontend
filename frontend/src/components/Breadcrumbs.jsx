import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

function Breadcrumbs() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  const getBreadcrumbName = (path) => {
    const names = {
      '': 'Dashboard',
      products: 'Products',
      customers: 'Customers',
      bookings: 'Bookings',
      transactions: 'Transactions',
      inventory: 'Inventory',
    }
    return names[path] || path.charAt(0).toUpperCase() + path.slice(1)
  }

  return (
    <nav className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600">
      <Link
        to="/"
        className="flex items-center hover:text-gray-900 transition-colors"
      >
        <Home size={14} className="sm:w-4 sm:h-4" />
      </Link>
      {pathnames.length > 0 && <ChevronRight size={14} className="sm:w-4 sm:h-4" />}
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1
        const displayName = getBreadcrumbName(value)

        return (
          <span key={to} className="flex items-center">
            {isLast ? (
              <span className="text-gray-900 font-medium">{displayName}</span>
            ) : (
              <>
                <Link
                  to={to}
                  className="hover:text-gray-900 transition-colors"
                >
                  {displayName}
                </Link>
                <ChevronRight size={14} className="sm:w-4 sm:h-4 mx-1 sm:mx-2" />
              </>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export default Breadcrumbs

