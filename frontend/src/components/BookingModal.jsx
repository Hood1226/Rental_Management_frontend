import { useState, useEffect, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { bookingService } from '../services/bookingService'
import { customerService } from '../services/customerService'
import { productService } from '../services/productService'
import Modal from './Modal'
import { Plus, Trash2 } from 'lucide-react'

function BookingModal({ isOpen, onClose, booking = null }) {
  const queryClient = useQueryClient()
  const isEditMode = !!booking
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getAll(),
    enabled: isOpen,
  })

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getAll(),
    enabled: isOpen,
  })

  // Flatten all variants from all products for easy selection
  const allVariants = useMemo(() => {
    if (!productsData?.data) return []
    const variants = []
    productsData.data.forEach(product => {
      if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach(variant => {
          variants.push({
            ...variant,
            productName: product.productName,
            productId: product.productId,
          })
        })
      }
    })
    return variants
  }, [productsData])

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      customerId: '',
      bookingType: 'RENT',
      status: 'PENDING',
      totalAmount: 0,
      isAdvanceBooking: false,
      scheduledDate: '',
      advancePaymentAmount: 0,
      items: [{ variantId: '', quantity: 1, unitPrice: 0, rentalStart: '', rentalEnd: '', subtotal: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const bookingType = watch('bookingType')
  const items = watch('items')
  const isAdvanceBooking = watch('isAdvanceBooking')

  useEffect(() => {
    if (booking) {
      reset({
        customerId: booking.customerId || '',
        bookingType: booking.bookingType || 'RENT',
        status: booking.status || 'PENDING',
        totalAmount: booking.totalAmount || 0,
        isAdvanceBooking: !!booking.isAdvanceBooking,
        scheduledDate: booking.scheduledDate || '',
        advancePaymentAmount: booking.advancePaymentAmount ?? 0,
        items: booking.items && booking.items.length > 0
          ? booking.items.map(item => ({
              variantId: item.variantId || '',
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 0,
              rentalStart: item.rentalStart || '',
              rentalEnd: item.rentalEnd || '',
              subtotal: item.subtotal || 0,
            }))
          : [{ variantId: '', quantity: 1, unitPrice: 0, rentalStart: '', rentalEnd: '', subtotal: 0 }],
      })
      setSelectedCustomer(booking.customerId)
    } else {
      reset({
        customerId: '',
        bookingType: 'RENT',
        status: 'PENDING',
        totalAmount: 0,
        isAdvanceBooking: false,
        scheduledDate: '',
        advancePaymentAmount: 0,
        items: [{ variantId: '', quantity: 1, unitPrice: 0, rentalStart: '', rentalEnd: '', subtotal: 0 }],
      })
      setSelectedCustomer(null)
    }
  }, [booking, reset, isOpen])

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name?.startsWith('items')) {
        const total = value.items?.reduce((sum, item) => {
          const subtotal = (item.quantity || 0) * (item.unitPrice || 0)
          return sum + subtotal
        }, 0) || 0
        reset({ ...value, totalAmount: total }, { keepDirty: true })
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, reset])

  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEditMode) {
        return bookingService.update(booking.bookingId, data)
      }
      return bookingService.create(data)
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success(
          isEditMode ? 'Booking updated successfully' : 'Booking created successfully'
        )
        queryClient.invalidateQueries({ queryKey: ['bookings'] })
        onClose()
      } else {
        toast.error(response.message || 'Operation failed')
      }
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 
        (isEditMode ? 'Failed to update booking' : 'Failed to create booking')
      )
    },
  })

  const onSubmit = (data) => {
    mutation.mutate(data)
  }

  const calculateSubtotal = (index) => {
    const item = items[index]
    if (item) {
      const quantity = parseFloat(item.quantity) || 0
      const unitPrice = parseFloat(item.unitPrice) || 0
      return quantity * unitPrice
    }
    return 0
  }

  const handleVariantChange = (index, variantId) => {
    const variant = allVariants.find(v => v.variantId === parseInt(variantId))
    if (variant) {
      // Auto-fill unit price based on booking type
      const price = bookingType === 'RENT' ? variant.rentPrice : variant.salePrice
      if (price) {
        setValue(`items.${index}.unitPrice`, price)
        // Recalculate subtotal
        const quantity = watch(`items.${index}.quantity`) || 1
        const subtotal = quantity * price
        setValue(`items.${index}.subtotal`, subtotal)
        // Recalculate total
        const allItems = watch('items')
        const totalAmount = allItems.reduce((sum, item, idx) => {
          if (idx === index) return sum + subtotal
          return sum + (item.subtotal || 0)
        }, 0)
        setValue('totalAmount', totalAmount)
      }
    }
  }

  const getVariantInfo = (variantId) => {
    return allVariants.find(v => v.variantId === variantId)
  }

  const customers = customersData?.data || []

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Booking' : 'Create New Booking'}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer <span className="text-red-500">*</span>
          </label>
          <select
            {...register('customerId', { required: 'Customer is required' })}
            value={selectedCustomer || ''}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select Customer</option>
            {customers.map((customer) => (
              <option key={customer.customerId} value={customer.customerId}>
                {customer.customerName} - {customer.email || customer.mobileNumber}
              </option>
            ))}
          </select>
          {errors.customerId && (
            <p className="mt-1 text-sm text-red-600">{errors.customerId.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Booking Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register('bookingType', { required: 'Booking type is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="RENT">Rent</option>
              <option value="SALE">Sale</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('isAdvanceBooking')}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">Advance booking</span>
            </label>
            {isAdvanceBooking && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Scheduled date</label>
                  <input
                    type="date"
                    {...register('scheduledDate')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Advance payment (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    {...register('advancePaymentAmount', { valueAsNumber: true, min: 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Booking Items <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => append({ variantId: '', quantity: 1, unitPrice: 0, rentalStart: '', rentalEnd: '', subtotal: 0 })}
              className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
            >
              <Plus size={16} />
              <span>Add Item</span>
            </button>
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-4 mb-3 space-y-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Product Variant <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register(`items.${index}.variantId`, { 
                      required: 'Variant is required',
                      valueAsNumber: true 
                    })}
                    onChange={(e) => {
                      handleVariantChange(index, e.target.value)
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Product Variant</option>
                    {allVariants.map((variant) => (
                      <option key={variant.variantId} value={variant.variantId}>
                        {variant.productName} - Size: {variant.sizeCode || 'N/A'} 
                        {variant.rentPrice && ` (Rent: ₹${variant.rentPrice})`}
                        {variant.salePrice && ` (Sale: ₹${variant.salePrice})`}
                      </option>
                    ))}
                  </select>
                  {errors.items?.[index]?.variantId && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.items[index].variantId.message}
                    </p>
                  )}
                  {items[index]?.variantId && (() => {
                    const variantInfo = getVariantInfo(items[index].variantId)
                    return variantInfo ? (
                      <div className="mt-1 text-xs text-gray-500">
                        <span>Available: {variantInfo.availableQuantity || 0}</span>
                        {variantInfo.availabilityStatus && (
                          <span className="ml-2">Status: {variantInfo.availabilityStatus}</span>
                        )}
                      </div>
                    ) : null
                  })()}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    {...register(`items.${index}.quantity`, { 
                      required: 'Quantity is required',
                      valueAsNumber: true,
                      min: 1 
                    })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Unit Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.unitPrice`, { 
                      required: 'Unit price is required',
                      valueAsNumber: true 
                    })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                {bookingType === 'RENT' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Rental Start Date
                      </label>
                      <input
                        type="date"
                        {...register(`items.${index}.rentalStart`)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Rental End Date
                      </label>
                      <input
                        type="date"
                        {...register(`items.${index}.rentalEnd`)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Subtotal: ₹{calculateSubtotal(index).toFixed(2)}
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          {isAdvanceBooking ? (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Advance payment:</span>
                <span className="text-base font-bold text-green-700">
                  ₹{(Number(watch('advancePaymentAmount')) || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                <span className="text-sm font-semibold text-gray-700">Balance to pay:</span>
                <span className="text-base font-bold text-amber-700">
                  ₹{Math.max(0, (Number(watch('totalAmount')) || 0) - (Number(watch('advancePaymentAmount')) || 0)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                <span className="text-lg font-semibold text-gray-700">Total:</span>
                <span className="text-xl font-bold text-primary-600">
                  ₹{watch('totalAmount')?.toFixed(2) || '0.00'}
                </span>
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">Total Amount:</span>
              <span className="text-xl font-bold text-primary-600">
                ₹{watch('totalAmount')?.toFixed(2) || '0.00'}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
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

export default BookingModal

