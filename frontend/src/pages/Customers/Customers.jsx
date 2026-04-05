import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { customerService } from '../../services/customerService'
import { useAuth } from '../../context/AuthContext'
import { Edit, Eye } from 'lucide-react'
import CustomerModal from '../../components/CustomerModal'
import DataGrid from '../../components/DataGrid'
import PageContainer from '../../components/common/PageContainer'

function Customers() {
  const [showModal, setShowModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('CUSTOMER_MANAGEMENT', 'CREATE')
  const canUpdate = hasPermission('CUSTOMER_MANAGEMENT', 'UPDATE')

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getAll(),
  })

  const handleCreate = () => {
    setSelectedCustomer(null)
    setShowModal(true)
  }

  const handleEdit = (customer) => {
    setSelectedCustomer(customer)
    setShowModal(true)
  }

  const handleView = (customer) => {
    setSelectedCustomer(customer)
    setShowModal(true)
  }

  const handleClose = () => {
    setShowModal(false)
    setSelectedCustomer(null)
  }

  if (isLoading) return <div className="flex items-center justify-center h-64">Loading...</div>
  if (error) return <div className="flex items-center justify-center h-64 text-red-600">Error loading customers</div>

  const customers = Array.isArray(data?.data) ? data.data : []

  const columns = [
    {
      header: 'Customer Name',
      accessor: 'customerName',
    },
    {
      header: 'Email',
      accessor: (row) => row.email || '-',
    },
    {
      header: 'Mobile',
      accessor: (row) => row.mobileNumber || '-',
    },
    {
      header: 'WhatsApp',
      accessor: (row) => row.whatsappNumber || '-',
    },
    {
      header: 'ID Proof',
      accessor: 'idProofType',
      render: (row) =>
        row.idProofType ? (
          <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
            {row.idProofType}
          </span>
        ) : (
          '-'
        ),
    },
  ]

  const searchFields = [
    (row) => row.customerName,
    (row) => row.email,
    (row) => row.mobileNumber,
    (row) => row.whatsappNumber,
  ]

  return (
    <PageContainer>
      <DataGrid
        title="Customers"
        data={customers}
        columns={columns}
        onAdd={canCreate ? handleCreate : undefined}
        onEdit={canUpdate ? handleEdit : undefined}
        onView={handleView}
        searchPlaceholder="Search customers by name, email, or phone..."
        searchFields={searchFields}
        addButtonText="Add Customer"
        emptyMessage="No customers found"
        getRowId={(row) => row.customerId}
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

      <CustomerModal
        isOpen={showModal}
        onClose={handleClose}
        customer={selectedCustomer}
      />
    </PageContainer>
  )
}

export default Customers


