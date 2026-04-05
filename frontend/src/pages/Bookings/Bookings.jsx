import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { bookingService } from '../../services/bookingService'
import { useAuth } from '../../context/AuthContext'
import { Edit, Eye } from 'lucide-react'
import { format } from 'date-fns'
import DataGrid from '../../components/DataGrid'
import PageContainer from '../../components/common/PageContainer'

function Bookings() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('BOOKING_MANAGEMENT', 'CREATE')
  const canUpdate = hasPermission('BOOKING_MANAGEMENT', 'UPDATE')

  const { data, isLoading, error } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingService.getAll(),
  })

  const handleCreate = () => {
    navigate('/bookings/new')
  }

  const handleEdit = (booking) => {
    navigate(`/bookings/${booking.bookingId}`)
  }

  const handleView = (booking) => {
    navigate(`/bookings/${booking.bookingId}`)
  }

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getBookingTypeColor = (type) => {
    return type === 'RENT' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-indigo-100 text-indigo-800'
  }

  if (isLoading) return <div className="flex items-center justify-center h-64">Loading...</div>
  if (error) return <div className="flex items-center justify-center h-64 text-red-600">Error loading bookings</div>

  const bookings = Array.isArray(data?.data) ? data.data : []

  const columns = [
    {
      header: 'Booking ID',
      accessor: (row) => row.bookingNo || `#${row.bookingId}`,
    },
    {
      header: 'Customer',
      accessor: (row) => row.customerName || `Customer #${row.customerId}`,
    },
    {
      header: 'Type',
      accessor: 'bookingType',
      render: (row) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBookingTypeColor(row.bookingType)}`}>
          {row.bookingType}
        </span>
      ),
    },
    {
      header: 'Shop / Branch',
      accessor: (row) => `${row.shopName || '-'} / ${row.branchName || '-'}`,
    },
    {
      header: 'Booking Date',
      accessor: (row) => row.bookingDate 
        ? format(new Date(row.bookingDate), 'MMM dd, yyyy')
        : '-',
    },
    {
      header: 'Amount',
      accessor: (row) => `₹${row.totalAmount?.toFixed(2) || '0.00'}`,
      render: (row) => (
        <span className="font-semibold text-gray-900">
          ₹{row.totalAmount?.toFixed(2) || '0.00'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Items',
      accessor: (row) => `${row.items?.length || 0} item(s)`,
    },
  ]

  const searchFields = [
    (row) => row.bookingNo,
    (row) => row.bookingId?.toString(),
    (row) => row.customerName,
    (row) => row.shopName,
    (row) => row.branchName,
    (row) => row.bookingType,
    (row) => row.status,
  ]

  return (
    <PageContainer>
      <DataGrid
        title="Bookings"
        data={bookings}
        columns={columns}
        onAdd={canCreate ? handleCreate : undefined}
        onEdit={canUpdate ? handleEdit : undefined}
        onView={handleView}
        searchPlaceholder="Search by booking ID, customer, type, or status..."
        searchFields={searchFields}
        addButtonText="New Booking"
        emptyMessage="No bookings found"
        getRowId={(row) => row.bookingId}
        renderActions={(row) => (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleView(row)}
              className="text-blue-600 hover:text-blue-900"
              title="View"
            >
              <Eye size={18} />
            </button>
            {canUpdate && (
              <button
                onClick={() => handleEdit(row)}
                className="text-primary-600 hover:text-primary-900"
                title="Edit"
              >
                <Edit size={18} />
              </button>
            )}
          </div>
        )}
      />
    </PageContainer>
  )
}

export default Bookings


