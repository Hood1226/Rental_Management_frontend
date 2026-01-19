import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { productService } from '../../services/productService'
import { sizeService } from '../../services/sizeService'
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Save, X } from 'lucide-react'
import PageContainer from '../../components/common/PageContainer'
import FormContainer from '../../components/common/FormContainer'
import FormSection from '../../components/common/FormSection'
import { inputClasses, textSizes, iconSizes, grids, spacing } from '../../utils/responsive'

function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditMode = !!id && id !== 'new'
  const [expandedVariants, setExpandedVariants] = useState(new Set())

  const { data: sizesData } = useQuery({
    queryKey: ['sizes'],
    queryFn: () => sizeService.getAll(),
  })

  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getById(id),
    enabled: isEditMode,
  })

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      productName: '',
      category: '',
      description: '',
      depositAmount: 0,
      isForSale: false,
      isForRent: false,
      isActive: true,
      variants: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  })

  const isForRent = watch('isForRent')
  const isForSale = watch('isForSale')
  const variants = watch('variants')

  useEffect(() => {
    if (isEditMode && productData?.data) {
      const product = productData.data
      reset({
        productName: product.productName || '',
        category: product.category || '',
        description: product.description || '',
        depositAmount: product.depositAmount || 0,
        isForSale: product.isForSale || false,
        isForRent: product.isForRent || false,
        isActive: product.isActive !== undefined ? product.isActive : true,
        variants: product.variants && product.variants.length > 0
          ? product.variants.map(v => ({
              variantId: v.variantId || null,
              sizeId: v.sizeId || null,
              purchasePrice: v.purchasePrice || 0,
              rentPrice: v.rentPrice || null,
              rentEffectiveFrom: v.rentEffectiveFrom || new Date().toISOString().split('T')[0],
              rentEffectiveTo: v.rentEffectiveTo || null,
              salePrice: v.salePrice || null,
              saleEffectiveFrom: v.saleEffectiveFrom || null,
              saleEffectiveTo: v.saleEffectiveTo || null,
              availableQuantity: v.availableQuantity || 0,
              availabilityStatus: v.availabilityStatus || 'AVAILABLE',
              expectedRestoreDate: v.expectedRestoreDate || null,
              nextAvailabilityDate: v.nextAvailabilityDate || null,
            }))
          : [],
      })
      if (product.variants && product.variants.length > 0) {
        setExpandedVariants(new Set(product.variants.map((_, i) => i)))
      }
    } else if (!isEditMode) {
      reset({
        productName: '',
        category: '',
        description: '',
        depositAmount: 0,
        isForSale: false,
        isForRent: false,
        isActive: true,
        variants: [],
      })
    }
  }, [productData, isEditMode, reset])

  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEditMode) {
        return productService.update(id, data)
      }
      return productService.create(data)
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success(
          isEditMode ? 'Product updated successfully' : 'Product created successfully'
        )
        queryClient.invalidateQueries({ queryKey: ['products'] })
        if (!isEditMode) {
          navigate(`/products/${response.data?.productId || ''}`)
        }
      } else {
        toast.error(response.message || 'Operation failed')
      }
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 
        (isEditMode ? 'Failed to update product' : 'Failed to create product')
      )
    },
  })

  const onSubmit = (data) => {
    mutation.mutate(data)
  }

  const deleteMutation = useMutation({
    mutationFn: () => productService.delete(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Product deleted successfully')
        queryClient.invalidateQueries({ queryKey: ['products'] })
        navigate('/products')
      } else {
        toast.error(response.message || 'Failed to delete product')
      }
    },
    onError: () => {
      toast.error('Failed to delete product')
    },
  })

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate()
    }
  }

  const addVariant = () => {
    const newVariant = {
      sizeId: null,
      purchasePrice: 0,
      rentPrice: null,
      rentEffectiveFrom: new Date().toISOString().split('T')[0],
      rentEffectiveTo: null,
      salePrice: null,
      saleEffectiveFrom: null,
      saleEffectiveTo: null,
      availableQuantity: 0,
      availabilityStatus: 'AVAILABLE',
      expectedRestoreDate: null,
      nextAvailabilityDate: null,
    }
    append(newVariant)
    setExpandedVariants(new Set([...expandedVariants, fields.length]))
  }

  const toggleVariant = (index) => {
    const newExpanded = new Set(expandedVariants)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedVariants(newExpanded)
  }

  const sizes = sizesData?.data || []

  if (isLoading && isEditMode) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <PageContainer maxWidth="5xl">
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormContainer>
        {/* Title and Back Button */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <h4 className="text-lg font-bold text-gray-900">
            {isEditMode ? 'Edit Product' : 'Create Product'}
          </h4>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors text-sm px-2 py-1 rounded-md hover:bg-gray-100"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
        </div>
        {/* Product Basic Information */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('productName', { required: 'Product name is required' })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
              {errors.productName && (
                <p className="mt-1 text-xs text-red-600">{errors.productName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Category
              </label>
              <input
                type="text"
                {...register('category')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Deposit Amount
              </label>
              <input
                type="number"
                step="0.01"
                {...register('depositAmount', { valueAsNumber: true })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
            />
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('isForSale')}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-xs font-medium text-gray-700">For Sale</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('isForRent')}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-xs font-medium text-gray-700">For Rent</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('isActive')}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-xs font-medium text-gray-700">Active</span>
            </label>
          </div>
        </div>

        {/* Variants Section */}
        <div className="space-y-2 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-800">Product Variants</h4>
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-all shadow-sm"
            >
              <Plus size={14} />
              <span>Add Variant</span>
            </button>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-sm">No variants added yet. Click "Add Variant" to add product variants.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map((field, index) => {
                const isExpanded = expandedVariants.has(index)
                const variant = variants[index]
                const size = variant?.sizeId ? sizes.find(s => s.sizeId === variant.sizeId) : null
                return (
                  <div key={field.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggleVariant(index)}
                        className="flex-1 flex items-center space-x-2 flex-wrap text-left"
                      >
                        <span className="text-sm font-medium text-gray-700">
                          Variant {index + 1}
                        </span>
                        {size && (
                          <span className="text-xs text-gray-500">
                            - Size: {size.sizeCode || 'N/A'}
                          </span>
                        )}
                        {variant?.purchasePrice > 0 && (
                          <span className="text-xs text-gray-500">
                            Purchase: ₹{variant.purchasePrice}
                          </span>
                        )}
                        {variant?.rentPrice && (
                          <span className="text-xs text-blue-600">
                            Rent: ₹{variant.rentPrice}
                          </span>
                        )}
                        {variant?.salePrice && (
                          <span className="text-xs text-green-600">
                            Sale: ₹{variant.salePrice}
                          </span>
                        )}
                        {variant?.availableQuantity !== undefined && (
                          <span className="text-xs text-gray-500">
                            Qty: {variant.availableQuantity}
                          </span>
                        )}
                        {variant?.availabilityStatus && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            variant.availabilityStatus === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                            variant.availabilityStatus === 'RENTED' ? 'bg-yellow-100 text-yellow-700' :
                            variant.availabilityStatus === 'SOLD' ? 'bg-gray-100 text-gray-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {variant.availabilityStatus}
                          </span>
                        )}
                      </button>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            remove(index)
                            const newExpanded = new Set(expandedVariants)
                            newExpanded.delete(index)
                            setExpandedVariants(newExpanded)
                          }}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                          title="Delete variant"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleVariant(index)}
                          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-all"
                          title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-3 space-y-2.5 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                              Size <span className="text-red-500">*</span>
                            </label>
                            <select
                              {...register(`variants.${index}.sizeId`, { 
                                required: 'Size is required',
                                valueAsNumber: true 
                              })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                            >
                              <option value="">Select Size</option>
                              {sizes.map((size) => (
                                <option key={size.sizeId} value={size.sizeId}>
                                  {size.sizeCode} - {size.sizeName || ''}
                                </option>
                              ))}
                            </select>
                            {errors.variants?.[index]?.sizeId && (
                              <p className="mt-1 text-xs text-red-600">
                                {errors.variants[index].sizeId.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                              Purchase Price <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              {...register(`variants.${index}.purchasePrice`, { 
                                required: 'Purchase price is required',
                                valueAsNumber: true 
                              })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                            />
                          </div>
                        </div>

                        {isForRent && (
                          <div className="border-t border-gray-100 pt-2.5 mt-2.5 space-y-2">
                            <h5 className="text-xs font-semibold text-gray-700">Rental Pricing</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                  Rent Price
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  {...register(`variants.${index}.rentPrice`, { valueAsNumber: true })}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                  Effective From
                                </label>
                                <input
                                  type="date"
                                  {...register(`variants.${index}.rentEffectiveFrom`)}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                  Effective To (Optional)
                                </label>
                                <input
                                  type="date"
                                  {...register(`variants.${index}.rentEffectiveTo`)}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {isForSale && (
                          <div className="border-t border-gray-100 pt-2.5 mt-2.5 space-y-2">
                            <h5 className="text-xs font-semibold text-gray-700">Sale Pricing</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                  Sale Price
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  {...register(`variants.${index}.salePrice`, { valueAsNumber: true })}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                  Effective From
                                </label>
                                <input
                                  type="date"
                                  {...register(`variants.${index}.saleEffectiveFrom`)}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                  Effective To (Optional)
                                </label>
                                <input
                                  type="date"
                                  {...register(`variants.${index}.saleEffectiveTo`)}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="border-t border-gray-100 pt-2.5 mt-2.5 space-y-2">
                          <h5 className="text-xs font-semibold text-gray-700">Inventory Information</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Available Quantity
                              </label>
                              <input
                                type="number"
                                {...register(`variants.${index}.availableQuantity`, { 
                                  valueAsNumber: true,
                                  min: 0 
                                })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Availability Status
                              </label>
                              <select
                                {...register(`variants.${index}.availabilityStatus`)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                              >
                                <option value="AVAILABLE">Available</option>
                                <option value="RENTED">Rented</option>
                                <option value="SOLD">Sold</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="DAMAGED">Damaged</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Expected Restore Date
                              </label>
                              <input
                                type="date"
                                {...register(`variants.${index}.expectedRestoreDate`)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Next Availability Date
                              </label>
                              <input
                                type="date"
                                {...register(`variants.${index}.nextAvailabilityDate`)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                              />
                            </div>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-gray-200">
          {isEditMode && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 text-sm font-medium transition-all shadow-sm hover:shadow"
            >
              <Trash2 size={14} />
              <span>{deleteMutation.isPending ? 'Deleting...' : 'Delete'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium transition-all"
          >
            <X size={14} />
            <span>Cancel</span>
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 text-sm font-medium transition-all shadow-sm hover:shadow"
          >
            <Save size={14} />
            <span>
              {mutation.isPending
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                ? 'Update Product'
                : 'Create Product'}
            </span>
          </button>
        </div>
        </FormContainer>
      </form>
    </PageContainer>
  )
}

export default ProductDetails

