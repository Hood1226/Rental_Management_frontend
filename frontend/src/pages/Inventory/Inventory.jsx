import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productService } from '../../services/productService'
import { Package, AlertCircle, TrendingUp } from 'lucide-react'
import DataGrid from '../../components/DataGrid'
import PageContainer from '../../components/common/PageContainer'
import StatCard from '../../components/common/StatCard'
import { grids, spacing } from '../../utils/responsive'

function Inventory() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getAll(),
  })

  // Flatten all variants from all products for inventory view
  const inventoryItems = useMemo(() => {
    if (!data?.data || !Array.isArray(data.data)) return []
    
    const items = []
    data.data.forEach(product => {
      if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach(variant => {
          items.push({
            ...variant,
            productName: product.productName,
            productId: product.productId,
            category: product.category,
          })
        })
      }
    })
    return items
  }, [data])

  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalItems = inventoryItems.length
    const totalQuantity = inventoryItems.reduce((sum, item) => sum + (item.availableQuantity || 0), 0)
    const lowStock = inventoryItems.filter(item => (item.availableQuantity || 0) < 10).length
    const outOfStock = inventoryItems.filter(item => (item.availableQuantity || 0) === 0).length
    
    return {
      totalItems,
      totalQuantity,
      lowStock,
      outOfStock,
    }
  }, [inventoryItems])

  if (isLoading) return <div className="flex items-center justify-center h-64">Loading...</div>
  if (error) return <div className="flex items-center justify-center h-64 text-red-600">Error loading inventory</div>

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
      header: 'Size',
      accessor: (row) => row.sizeCode || 'N/A',
    },
    {
      header: 'Available Quantity',
      accessor: (row) => row.availableQuantity || 0,
      render: (row) => {
        const qty = row.availableQuantity || 0
        const isLowStock = qty < 10 && qty > 0
        const isOutOfStock = qty === 0
        
        return (
          <span className={`font-semibold ${
            isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {qty}
          </span>
        )
      },
    },
    {
      header: 'Rent Price',
      accessor: (row) => row.rentPrice ? `₹${row.rentPrice}` : '-',
    },
    {
      header: 'Sale Price',
      accessor: (row) => row.salePrice ? `₹${row.salePrice}` : '-',
    },
    {
      header: 'Status',
      accessor: 'availableQuantity',
      render: (row) => {
        const qty = row.availableQuantity || 0
        if (qty === 0) {
          return (
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
              Out of Stock
            </span>
          )
        } else if (qty < 10) {
          return (
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
              Low Stock
            </span>
          )
        } else {
          return (
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
              In Stock
            </span>
          )
        }
      },
    },
  ]

  const searchFields = [
    (row) => row.productName,
    (row) => row.category,
    (row) => row.sizeCode,
  ]

  return (
    <PageContainer>
      {/* Summary Cards */}
      <div className={`grid ${grids['1-2-4']} ${spacing.gap} ${spacing.margin}`}>
        <StatCard
          title="Total Items"
          value={stats.totalItems}
          icon={Package}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Total Quantity"
          value={stats.totalQuantity}
          icon={TrendingUp}
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          title="Low Stock"
          value={stats.lowStock}
          icon={AlertCircle}
          iconBgColor="bg-yellow-50"
          iconColor="text-yellow-600"
          valueColor="text-yellow-600"
        />
        <StatCard
          title="Out of Stock"
          value={stats.outOfStock}
          icon={AlertCircle}
          iconBgColor="bg-red-50"
          iconColor="text-red-600"
          valueColor="text-red-600"
        />
      </div>

      {/* DataGrid */}
      <DataGrid
        data={inventoryItems}
        columns={columns}
        searchPlaceholder="Search by product name, category, or size..."
        searchFields={searchFields}
        emptyMessage="No inventory items found"
        getRowId={(row) => row.variantId}
      />
    </PageContainer>
  )
}

export default Inventory


