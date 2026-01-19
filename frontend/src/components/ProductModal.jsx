import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { productService } from '../services/productService'
import { sizeService } from '../services/sizeService'
import Modal from './Modal'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

function ProductModal({ isOpen, onClose, product = null }) {
  const queryClient = useQueryClient()
  const isEditMode = !!product
  const [expandedVariants, setExpandedVariants] = useState(new Set())

  const { data: sizesData } = useQuery({
    queryKey: ['sizes'],
    queryFn: () => sizeService.getAll(),
    enabled: isOpen,
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
    if (product) {
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
      // Expand all variants when editing
      if (product.variants && product.variants.length > 0) {
        setExpandedVariants(new Set(product.variants.map((_, i) => i)))
      }
    } else {
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
      setExpandedVariants(new Set())
    }
  }, [product, reset, isOpen])

  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEditMode) {
        return productService.update(product.productId, data)
      }
      return productService.create(data)
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success(
          isEditMode ? 'Product updated successfully' : 'Product created successfully'
        )
        queryClient.invalidateQueries({ queryKey: ['products'] })
        onClose()
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
    mutationFn: () => productService.delete(product.productId),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Product deleted successfully')
        queryClient.invalidateQueries({ queryKey: ['products'] })
        onClose()
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Product' : 'Create New Product'}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Product Basic Information */}
        <div className="space-y-4 border-b pb-4">
          <h4 className="text-md font-semibold text-gray-700 mb-3">Product Information</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('productName', { required: 'Product name is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.productName && (
              <p className="mt-1 text-sm text-red-600">{errors.productName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                {...register('category')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deposit Amount
              </label>
              <input
                type="number"
                step="0.01"
                {...register('depositAmount', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('isForSale')}
                className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">For Sale</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('isForRent')}
                className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">For Rent</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('isActive')}
                className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>
        </div>

        {/* Variants Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-semibold text-gray-700">Product Variants</h4>
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center space-x-2 px-3 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700"
            >
              <Plus size={16} />
              <span>Add Variant</span>
            </button>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <p>No variants added yet. Click "Add Variant" to add product variants.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => {
                const isExpanded = expandedVariants.has(index)
                return (
                  <div key={field.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleVariant(index)}
                      className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left"
                    >
                      <span className="font-medium text-gray-700">
                        Variant {index + 1}
                        {variants[index]?.sizeId && sizes.find(s => s.sizeId === variants[index].sizeId) && (
                          <span className="ml-2 text-sm text-gray-500">
                            - Size: {sizes.find(s => s.sizeId === variants[index].sizeId)?.sizeCode || 'N/A'}
                          </span>
                        )}
                      </span>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {isExpanded && (
                      <div className="p-4 space-y-4 bg-white">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Size <span className="text-red-500">*</span>
                            </label>
                            <select
                              {...register(`variants.${index}.sizeId`, { 
                                required: 'Size is required',
                                valueAsNumber: true 
                              })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Purchase Price <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              {...register(`variants.${index}.purchasePrice`, { 
                                required: 'Purchase price is required',
                                valueAsNumber: true 
                              })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        </div>

                        {/* Rent Price Section */}
                        {isForRent && (
                          <div className="border-t pt-3 space-y-3">
                            <h5 className="text-xs font-semibold text-gray-700">Rental Pricing</h5>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Rent Price
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  {...register(`variants.${index}.rentPrice`, { valueAsNumber: true })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Effective From
                                </label>
                                <input
                                  type="date"
                                  {...register(`variants.${index}.rentEffectiveFrom`)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Effective To (Optional)
                                </label>
                                <input
                                  type="date"
                                  {...register(`variants.${index}.rentEffectiveTo`)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Sale Price Section */}
                        {isForSale && (
                          <div className="border-t pt-3 space-y-3">
                            <h5 className="text-xs font-semibold text-gray-700">Sale Pricing</h5>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Sale Price
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  {...register(`variants.${index}.salePrice`, { valueAsNumber: true })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Effective From
                                </label>
                                <input
                                  type="date"
                                  {...register(`variants.${index}.saleEffectiveFrom`)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Effective To (Optional)
                                </label>
                                <input
                                  type="date"
                                  {...register(`variants.${index}.saleEffectiveTo`)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Inventory Section */}
                        <div className="border-t pt-3 space-y-3">
                          <h5 className="text-xs font-semibold text-gray-700">Inventory Information</h5>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Available Quantity
                              </label>
                              <input
                                type="number"
                                {...register(`variants.${index}.availableQuantity`, { 
                                  valueAsNumber: true,
                                  min: 0 
                                })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Availability Status
                              </label>
                              <select
                                {...register(`variants.${index}.availabilityStatus`)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              >
                                <option value="AVAILABLE">Available</option>
                                <option value="RENTED">Rented</option>
                                <option value="SOLD">Sold</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="DAMAGED">Damaged</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Expected Restore Date
                              </label>
                              <input
                                type="date"
                                {...register(`variants.${index}.expectedRestoreDate`)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Next Availability Date
                              </label>
                              <input
                                type="date"
                                {...register(`variants.${index}.nextAvailabilityDate`)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t">
                          <button
                            type="button"
                            onClick={() => {
                              remove(index)
                              const newExpanded = new Set(expandedVariants)
                              newExpanded.delete(index)
                              setExpandedVariants(newExpanded)
                            }}
                            className="text-red-600 hover:text-red-700 text-sm flex items-center space-x-1"
                          >
                            <Trash2 size={14} />
                            <span>Delete Variant</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          {isEditMode && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {mutation.isPending
              ? isEditMode
                ? 'Updating...'
                : 'Creating...'
              : isEditMode
              ? 'Update'
              : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ProductModal
