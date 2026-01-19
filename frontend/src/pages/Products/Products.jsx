import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productService } from '../../services/productService'
import { Edit, Eye } from 'lucide-react'
import DataGrid from '../../components/DataGrid'
import PageContainer from '../../components/common/PageContainer'

function Products() {
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getAll(),
  })

  const handleCreate = () => {
    navigate('/products/new')
  }

  const handleEdit = (product) => {
    navigate(`/products/${product.productId}`)
  }

  const handleView = (product) => {
    navigate(`/products/${product.productId}`)
  }

  if (isLoading) return <div className="flex items-center justify-center h-64">Loading...</div>
  if (error) return <div className="flex items-center justify-center h-64 text-red-600">Error loading products</div>

  const products = Array.isArray(data?.data) ? data.data : []

  const columns = [
    {
      header: 'Product Name',
      accessor: 'productName',
    },
    {
      header: 'Category',
      accessor: (row) => row.category || '-',
    },
    {
      header: 'Deposit Amount',
      accessor: (row) => `₹${row.depositAmount || 0}`,
    },
    {
      header: 'For Sale/Rent',
      accessor: (row) => {
        const types = []
        if (row.isForSale) types.push('Sale')
        if (row.isForRent) types.push('Rent')
        return types.length > 0 ? types.join(', ') : '-'
      },
      render: (row) => (
        <div className="flex space-x-2">
          {row.isForSale && (
            <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
              Sale
            </span>
          )}
          {row.isForRent && (
            <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800">
              Rent
            </span>
          )}
          {!row.isForSale && !row.isForRent && (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      header: 'Variants',
      accessor: (row) => `${row.variants?.length || 0} variant${(row.variants?.length || 0) !== 1 ? 's' : ''}`,
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            row.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  const searchFields = [
    (row) => row.productName,
    (row) => row.category,
  ]

  return (
    <PageContainer>
      <DataGrid
        data={products}
        columns={columns}
        onAdd={handleCreate}
        onEdit={handleEdit}
        onView={handleView}
        searchPlaceholder="Search by product name or category..."
        searchFields={searchFields}
        emptyMessage="No products found"
        getRowId={(row) => row.productId}
        renderActions={(row) => (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleView(row)}
              className="text-blue-600 hover:text-blue-900"
              title="View"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={() => handleEdit(row)}
              className="text-primary-600 hover:text-primary-900"
              title="Edit"
            >
              <Edit size={18} />
            </button>
          </div>
        )}
      />
    </PageContainer>
  )
}

export default Products


