import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard/Dashboard'
import Products from './pages/Products/Products'
import ProductDetails from './pages/Products/ProductDetails'
import Customers from './pages/Customers/Customers'
import Bookings from './pages/Bookings/Bookings'
import BookingDetails from './pages/Bookings/BookingDetails'
import Transactions from './pages/Transactions/Transactions'
import Inventory from './pages/Inventory/Inventory'
import Login from './pages/Auth/Login'
import { useAuthStore } from './store/authStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetails />} />
            <Route path="customers" element={<Customers />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="bookings/:id" element={<BookingDetails />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="inventory" element={<Inventory />} />
          </Route>
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} />
    </QueryClientProvider>
  )
}

export default App


