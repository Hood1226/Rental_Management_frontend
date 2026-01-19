import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import Breadcrumbs from '../Breadcrumbs'

function Layout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-0 sm:p-0">
          <div className="px-4 sm:px-6 pt-2 sm:pt-3">
            <Breadcrumbs />
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout


