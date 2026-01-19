import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productService } from '../../services/productService'
import { bookingService } from '../../services/bookingService'
import { customerService } from '../../services/customerService'
import { Package, ShoppingCart, Users, TrendingUp, ArrowUpRight, Clock, AlertCircle } from 'lucide-react'
import PageContainer from '../../components/common/PageContainer'
import { grids, spacing, textSizes } from '../../utils/responsive'

function Dashboard() {
  const navigate = useNavigate()

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getAll(),
  })

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingService.getAll(),
  })

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getAll(),
  })

  const products = productsData?.data || []
  const bookings = bookingsData?.data || []
  const customers = customersData?.data || []

  // Calculate revenue from bookings
  const revenue = useMemo(() => {
    return bookings.reduce((sum, booking) => {
      return sum + (parseFloat(booking.totalAmount) || 0)
    }, 0)
  }, [bookings])

  // Get recent bookings (last 5)
  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => {
        const dateA = new Date(a.bookingDate || 0)
        const dateB = new Date(b.bookingDate || 0)
        return dateB - dateA
      })
      .slice(0, 5)
  }, [bookings])

  // Get low stock products (variants with availableQuantity < 10)
  const lowStockItems = useMemo(() => {
    const lowStock = []
    products.forEach(product => {
      if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach(variant => {
          if ((variant.availableQuantity || 0) < 10) {
            lowStock.push({
              productName: product.productName,
              variantId: variant.variantId,
              sizeCode: variant.sizeCode || 'N/A',
              availableQuantity: variant.availableQuantity || 0,
            })
          }
        })
      }
    })
    return lowStock.slice(0, 5)
  }, [products])

  const stats = [
    {
      title: 'Total Products',
      value: products.length,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      path: '/products',
    },
    {
      title: 'Total Bookings',
      value: bookings.length,
      icon: ShoppingCart,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      path: '/bookings',
    },
    {
      title: 'Total Customers',
      value: customers.length,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      path: '/customers',
    },
    {
      title: 'Revenue',
      value: `₹${revenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      path: '/bookings',
    },
  ]

  const isLoading = productsLoading || bookingsLoading || customersLoading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <PageContainer>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Loading dashboard data...</div>
          </div>
        </PageContainer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <PageContainer>
        {/* Header Section */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h4 className={`${textSizes['2xl']} font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2`}>
            Business Snapshot
          </h4>
          <p className={`${textSizes.base} text-gray-600`}>Welcome back! Here's what's happening with your business today.</p>
        </div>

        {/* Stats Grid */}
        <div className={`grid ${grids['1-2-4']} ${spacing.gap} ${spacing.margin}`}>
        {stats.map((stat, index) => {
          const Icon = stat.icon
          
          return (
            <button
              key={index}
              onClick={() => stat.path && navigate(stat.path)}
              className={`group relative bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 transition-all duration-300 hover:shadow-2xl overflow-hidden text-left ${
                stat.path ? 'cursor-pointer hover:-translate-y-1' : 'cursor-default'
              }`}
            >
              {/* Gradient Background Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className={`${stat.bgColor} p-2 sm:p-3 rounded-lg sm:rounded-xl transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className={`${stat.textColor} w-5 h-5 sm:w-6 sm:h-6`} />
                  </div>
                  {stat.path && (
                    <ArrowUpRight className="text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1 group-hover:-translate-y-1 w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                
                <p className={`text-gray-500 ${textSizes.sm} font-medium mb-1`}>{stat.title}</p>
                <div className="flex items-end justify-between">
                  <p className={`${textSizes.xl} font-bold text-gray-800`}>{stat.value}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

        {/* Bottom Grid Section */}
        <div className={`grid ${grids['1-3']} ${spacing.gap}`}>
          {/* Recent Bookings */}
          <div className={`lg:col-span-2 bg-white rounded-xl sm:rounded-2xl shadow-lg ${spacing.card} hover:shadow-xl transition-shadow duration-300`}>
            <div className={`flex items-center justify-between ${spacing.margin}`}>
              <div className={`flex items-center ${spacing.gap}`}>
                <div className="bg-green-50 p-2 rounded-lg">
                  <Clock className="text-green-600 w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h2 className={`${textSizes.lg} font-semibold text-gray-800`}>Recent Bookings</h2>
              </div>
              <button 
                onClick={() => navigate('/bookings')}
                className={`${textSizes.sm} text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors`}
              >
                View All
              </button>
            </div>
            
            <div className={`space-y-2 sm:space-y-3`}>
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <button
                    key={booking.bookingId}
                    onClick={() => navigate(`/bookings/${booking.bookingId}`)}
                    className={`w-full flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors cursor-pointer text-left`}
                  >
                    <div className={`flex items-center ${spacing.gap} flex-1 min-w-0`}>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className={`font-medium text-gray-800 ${textSizes.base} truncate`}>
                          Booking #{booking.bookingId}
                        </p>
                        <p className={`${textSizes.sm} text-gray-500 truncate`}>
                          {booking.customerName || `Customer #${booking.customerId}`}
                        </p>
                      </div>
                    </div>
                    <span className={`${textSizes.sm} font-semibold text-gray-600 ml-2 flex-shrink-0`}>
                      ₹{(booking.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </button>
                ))
              ) : (
                <div className={`text-center py-8 text-gray-500 ${textSizes.base}`}>
                  No bookings found
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Items */}
          <div className={`bg-white rounded-xl sm:rounded-2xl shadow-lg ${spacing.card} hover:shadow-xl transition-shadow duration-300`}>
            <div className={`flex items-center ${spacing.gap} ${spacing.margin}`}>
              <div className="bg-orange-50 p-2 rounded-lg">
                <AlertCircle className="text-orange-600 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h2 className={`${textSizes.lg} font-semibold text-gray-800`}>Low Stock Alert</h2>
            </div>
            
            <div className={`space-y-2 sm:space-y-3`}>
              {lowStockItems.length > 0 ? (
                lowStockItems.map((item, idx) => (
                  <button
                    key={`${item.variantId}-${idx}`}
                    onClick={() => navigate('/products')}
                    className={`w-full p-2 sm:p-3 bg-orange-50 border border-orange-100 rounded-lg sm:rounded-xl hover:shadow-md transition-shadow cursor-pointer text-left`}
                  >
                    <p className={`font-medium text-gray-800 ${textSizes.sm} mb-1 truncate`}>
                      {item.productName}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`${textSizes.xs} text-gray-600`}>
                        Size: {item.sizeCode} • Qty: {item.availableQuantity}
                      </span>
                      <span className={`${textSizes.xs} bg-orange-200 text-orange-800 px-2 py-0.5 sm:py-1 rounded-full font-semibold flex-shrink-0 ml-2`}>
                        Low
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className={`text-center py-8 text-gray-500 ${textSizes.sm}`}>
                  No low stock items
                </div>
              )}
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}

export default Dashboard