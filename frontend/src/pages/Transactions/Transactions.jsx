import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { bookingService } from '../../services/bookingService'
import { Eye, AlertTriangle, Receipt, CheckCircle2, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import DataGrid from '../../components/DataGrid'
import PageContainer from '../../components/common/PageContainer'
import StatCard from '../../components/common/StatCard'
import { grids, spacing, inputClasses, textSizes } from '../../utils/responsive'

function Transactions() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')

  const { data, isLoading, error } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingService.getAll(),
  })

  // Flatten all transactions from all bookings
  const allTransactions = useMemo(() => {
    if (!data?.data || !Array.isArray(data.data)) return []
    
    const transactions = []
    data.data.forEach(booking => {
      if (booking.transactions && Array.isArray(booking.transactions)) {
        booking.transactions.forEach(transaction => {
          transactions.push({
            ...transaction,
            bookingId: booking.bookingId,
            bookingType: booking.bookingType,
            customerName: booking.customerName,
            customerId: booking.customerId,
            bookingStatus: booking.status,
            bookingDate: booking.bookingDate,
          })
        })
      }
    })
    return transactions
  }, [data])

  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(trans => trans.status === statusFilter)
    }

    // Filter by type
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(trans => trans.transactionType === typeFilter)
    }

    return filtered
  }, [allTransactions, statusFilter, typeFilter])

  // Calculate summary statistics
  const stats = useMemo(() => {
    const total = filteredTransactions.length
    const active = filteredTransactions.filter(t => t.status === 'ACTIVE').length
    const damageReports = filteredTransactions.filter(t => t.transactionType === 'DAMAGE').length
    const totalDamageCost = filteredTransactions
      .filter(t => t.transactionType === 'DAMAGE' && t.damageRecords)
      .reduce((sum, t) => {
        const damageCost = t.damageRecords.reduce((dSum, d) => dSum + (d.repairCost || 0), 0)
        return sum + damageCost
      }, 0)

    return {
      total,
      active,
      damageReports,
      totalDamageCost,
    }
  }, [filteredTransactions])

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'REPORTED':
        return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'RENT_OUT':
        return 'bg-indigo-100 text-indigo-800'
      case 'RETURN':
        return 'bg-green-100 text-green-800'
      case 'SALE':
        return 'bg-blue-100 text-blue-800'
      case 'DAMAGE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64">Loading...</div>
  if (error) return <div className="flex items-center justify-center h-64 text-red-600">Error loading transactions</div>

  const columns = [
    {
      header: 'Transaction ID',
      accessor: 'transactionId',
      render: (row) => `#${row.transactionId}`,
    },
    {
      header: 'Booking',
      accessor: (row) => `#${row.bookingId}`,
      render: (row) => (
        <div>
          <div className="font-medium">#{row.bookingId}</div>
          <div className="text-xs text-gray-400">
            {row.bookingDate 
              ? format(new Date(row.bookingDate), 'MMM dd, yyyy')
              : '-'}
          </div>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      render: (row) => row.customerName || '-',
    },
    {
      header: 'Product',
      accessor: 'productName',
      render: (row) => (
        <div>
          <div className="font-medium">{row.productName || '-'}</div>
          {row.sizeCode && (
            <div className="text-xs text-gray-400">Size: {row.sizeCode}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'transactionType',
      render: (row) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(row.transactionType)}`}>
          {row.transactionType || '-'}
        </span>
      ),
    },
    {
      header: 'Quantity',
      accessor: 'quantity',
      render: (row) => row.quantity || 0,
    },
    {
      header: 'Dates',
      accessor: 'expectedReturnDate',
      render: (row) => (
        <div className="text-xs">
          {row.expectedReturnDate && (
            <div>Expected: {format(new Date(row.expectedReturnDate), 'MMM dd')}</div>
          )}
          {row.actualReturnDate && (
            <div className="text-green-600">Actual: {format(new Date(row.actualReturnDate), 'MMM dd')}</div>
          )}
          {row.transactionDate && (
            <div className="text-gray-400">Date: {format(new Date(row.transactionDate), 'MMM dd')}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(row.status)}`}>
          {row.status || '-'}
        </span>
      ),
    },
    {
      header: 'Damage Records',
      accessor: 'damageRecords',
      render: (row) => {
        if (row.transactionType === 'DAMAGE' && row.damageRecords) {
          return (
            <div className="space-y-1">
              {row.damageRecords.length > 0 ? (
                <div className="max-w-xs">
                  <div className="flex items-center space-x-1 text-red-600 mb-1">
                    <AlertTriangle size={14} />
                    <span className="font-semibold">{row.damageRecords.length} Record(s)</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    Total Cost: ₹{row.damageRecords.reduce((sum, d) => sum + (d.repairCost || 0), 0).toFixed(2)}
                  </div>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-primary-600 hover:text-primary-700">
                      View Details
                    </summary>
                    <div className="mt-2 space-y-2 pl-4 border-l-2 border-red-200">
                      {row.damageRecords.map((damage, idx) => (
                        <div key={idx} className="bg-red-50 p-2 rounded">
                          <div className="font-medium text-gray-700">
                            {damage.description || 'No description'}
                          </div>
                          <div className="text-red-600">
                            Cost: ₹{damage.repairCost?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              ) : (
                <span className="text-gray-400">No records</span>
              )}
            </div>
          )
        }
        return <span className="text-gray-400">-</span>
      },
    },
  ]

  const searchFields = [
    (row) => row.productName,
    (row) => row.customerName,
    (row) => row.transactionType,
    (row) => row.status,
    (row) => row.notes,
  ]

  return (
    <PageContainer>
      {/* Summary Cards */}
      <div className={`grid ${grids['1-2-4']} ${spacing.gap} ${spacing.margin}`}>
        <StatCard
          title="Total Transactions"
          value={stats.total}
          icon={Receipt}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Active"
          value={stats.active}
          icon={CheckCircle2}
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
          valueColor="text-blue-600"
        />
        <StatCard
          title="Damage Reports"
          value={stats.damageReports}
          icon={AlertTriangle}
          iconBgColor="bg-red-50"
          iconColor="text-red-600"
          valueColor="text-red-600"
        />
        <StatCard
          title="Total Damage Cost"
          value={`₹${stats.totalDamageCost.toFixed(2)}`}
          icon={TrendingUp}
          iconBgColor="bg-orange-50"
          iconColor="text-orange-600"
          valueColor="text-red-600"
        />
      </div>

      {/* Filters */}
      <div className={`bg-white rounded-lg shadow-md ${spacing.card} ${spacing.margin} border border-gray-200`}>
        <div className={`grid ${grids['1-2']} ${spacing.gap}`}>
          <div>
            <label className={`block ${textSizes.sm} font-medium text-gray-700 mb-1.5 sm:mb-2`}>Transaction Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={inputClasses}
            >
              <option value="ALL">All Types</option>
              <option value="RENT_OUT">Rent Out</option>
              <option value="RETURN">Return</option>
              <option value="SALE">Sale</option>
              <option value="DAMAGE">Damage</option>
            </select>
          </div>
          <div>
            <label className={`block ${textSizes.sm} font-medium text-gray-700 mb-1.5 sm:mb-2`}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={inputClasses}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="REPORTED">Reported</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* DataGrid */}
      <DataGrid
        data={filteredTransactions}
        columns={columns}
        onView={(row) => navigate(`/bookings/${row.bookingId}`)}
        searchPlaceholder="Search transactions..."
        searchFields={searchFields}
        emptyMessage="No transactions found"
        getRowId={(row) => row.transactionId}
        renderActions={(row) => (
          <button
            onClick={() => navigate(`/bookings/${row.bookingId}`)}
            className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
            title="View Booking"
          >
            <Eye size={18} />
            <span className="hidden sm:inline">View</span>
          </button>
        )}
      />
    </PageContainer>
  )
}

export default Transactions

