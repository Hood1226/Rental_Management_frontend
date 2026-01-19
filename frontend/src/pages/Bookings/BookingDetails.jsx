import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { bookingService } from '../../services/bookingService'
import { customerService } from '../../services/customerService'
import { productService } from '../../services/productService'
import { ArrowLeft, Plus, X, CheckCircle2, Loader2, Package, Receipt, AlertCircle, Calendar, DollarSign, Hash, PlusCircle, ChevronDown, ChevronUp, Save, Trash2, Search } from 'lucide-react'
import PageContainer from '../../components/common/PageContainer'
import FormContainer from '../../components/common/FormContainer'
import FormSection from '../../components/common/FormSection'
import { grids, spacing, inputClasses, textSizes, iconSizes } from '../../utils/responsive'

function BookingDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditMode = !!id && id !== 'new'

  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)

  // Only fetch customers when search query has 3+ characters
  const { data: customersData } = useQuery({
    queryKey: ['customers', customerSearchQuery],
    queryFn: () => customerService.getAll(),
    enabled: customerSearchQuery.length >= 3,
  })

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getAll(),
  })

  const { data: bookingData, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingService.getById(id),
    enabled: isEditMode,
  })

  // Fetch customer data in edit mode to display customer name
  const { data: customerData } = useQuery({
    queryKey: ['customer', bookingData?.data?.customerId],
    queryFn: () => customerService.getById(bookingData?.data?.customerId),
    enabled: isEditMode && !!bookingData?.data?.customerId,
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
      items: [],
      transactions: [],
    },
  })

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: 'items',
  })

  const { fields: transactionFields, append: appendTransaction, remove: removeTransaction } = useFieldArray({
    control,
    name: 'transactions',
  })

  const bookingType = watch('bookingType')
  const items = watch('items')
  const transactions = watch('transactions')

  const [expandedItems, setExpandedItems] = useState(new Set())
  const [expandedTransactions, setExpandedTransactions] = useState(new Set())

  useEffect(() => {
    if (isEditMode && bookingData?.data) {
      const booking = bookingData.data
      reset({
        customerId: booking.customerId || '',
        bookingType: booking.bookingType || 'RENT',
        status: booking.status || 'PENDING',
        totalAmount: booking.totalAmount || 0,
        items: booking.items && booking.items.length > 0
          ? booking.items.map(item => ({
            variantId: item.variantId || '',
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            rentalStart: item.rentalStart || '',
            rentalEnd: item.rentalEnd || '',
            subtotal: item.subtotal || 0,
          }))
          : [],
        transactions: booking.transactions && booking.transactions.length > 0
          ? booking.transactions.map(trans => ({
            transactionId: trans.transactionId || null,
            variantId: trans.variantId || '',
            transactionType: trans.transactionType || 'RENT_OUT',
            quantity: trans.quantity || 1,
            expectedReturnDate: trans.expectedReturnDate || '',
            actualReturnDate: trans.actualReturnDate || '',
            status: trans.status || 'ACTIVE',
            notes: trans.notes || '',
            damageRecords: trans.damageRecords && trans.damageRecords.length > 0
              ? trans.damageRecords.map(damage => ({
                damageId: damage.damageId || null,
                description: damage.description || '',
                repairCost: damage.repairCost || 0,
              }))
              : [],
          }))
          : [],
      })
      // Set customer search query for edit mode
      if (customerData?.data) {
        const customer = customerData.data
        if (customer.customerName && customer.mobileNumber) {
          setCustomerSearchQuery(`${customer.customerName} - ${customer.mobileNumber}`)
        } else if (customer.customerName) {
          setCustomerSearchQuery(customer.customerName)
        }
      } else if (booking.customerName && booking.mobileNumber) {
        setCustomerSearchQuery(`${booking.customerName} - ${booking.mobileNumber}`)
      } else if (booking.customerName) {
        setCustomerSearchQuery(booking.customerName)
      }
    } else if (!isEditMode) {
      reset({
        customerId: '',
        bookingType: 'RENT',
        status: 'PENDING',
        totalAmount: 0,
        items: [{ variantId: '', quantity: 1, unitPrice: 0, rentalStart: '', rentalEnd: '', subtotal: 0 }],
        transactions: [],
      })
      setCustomerSearchQuery('')
    }
  }, [bookingData, customerData, isEditMode, reset])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.customer-search-container')) {
        setShowCustomerDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name?.startsWith('items')) {
        const total = value.items?.reduce((sum, item) => {
          const subtotal = (item.quantity || 0) * (item.unitPrice || 0)
          return sum + subtotal
        }, 0) || 0
        setValue('totalAmount', total)
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, setValue])

  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEditMode) {
        return bookingService.update(id, data)
      }
      return bookingService.create(data)
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success(
          isEditMode ? 'Booking updated successfully' : 'Booking created successfully'
        )
        queryClient.invalidateQueries({ queryKey: ['bookings'] })
        if (!isEditMode) {
          navigate(`/bookings/${response.data?.bookingId || ''}`)
        }
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

  const handleVariantChange = (index, variantId) => {
    const variant = allVariants.find(v => v.variantId === parseInt(variantId))
    if (variant) {
      const price = bookingType === 'RENT' ? variant.rentPrice : variant.salePrice
      if (price) {
        setValue(`items.${index}.unitPrice`, price)
        const quantity = watch(`items.${index}.quantity`) || 1
        const subtotal = quantity * price
        setValue(`items.${index}.subtotal`, subtotal)
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

  const calculateSubtotal = (index) => {
    const item = items[index]
    if (item) {
      const quantity = parseFloat(item.quantity) || 0
      const unitPrice = parseFloat(item.unitPrice) || 0
      return quantity * unitPrice
    }
    return 0
  }

  const addDamageRecord = (transactionIndex) => {
    const currentTransactions = watch('transactions')
    const updatedTransactions = [...currentTransactions]
    if (!updatedTransactions[transactionIndex].damageRecords) {
      updatedTransactions[transactionIndex].damageRecords = []
    }
    updatedTransactions[transactionIndex] = {
      ...updatedTransactions[transactionIndex],
      damageRecords: [
        ...updatedTransactions[transactionIndex].damageRecords,
        {
          description: '',
          repairCost: 0,
        }
      ]
    }
    setValue('transactions', updatedTransactions, { shouldDirty: true })
  }

  const removeDamageRecord = (transactionIndex, damageIndex) => {
    const currentTransactions = watch('transactions')
    const updatedTransactions = [...currentTransactions]
    if (updatedTransactions[transactionIndex].damageRecords) {
      updatedTransactions[transactionIndex] = {
        ...updatedTransactions[transactionIndex],
        damageRecords: updatedTransactions[transactionIndex].damageRecords.filter((_, idx) => idx !== damageIndex)
      }
      setValue('transactions', updatedTransactions, { shouldDirty: true })
    }
  }

  // Filter customers based on search query (name or mobile)
  const filteredCustomers = useMemo(() => {
    if (!customersData?.data || customerSearchQuery.length < 3) return []
    
    const query = customerSearchQuery.toLowerCase()
    return customersData.data.filter(customer => 
      customer.customerName?.toLowerCase().includes(query) ||
      customer.mobileNumber?.includes(query)
    )
  }, [customersData, customerSearchQuery])

  const customers = filteredCustomers

  const toggleItem = (index) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  const toggleTransaction = (index) => {
    const newExpanded = new Set(expandedTransactions)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedTransactions(newExpanded)
  }

  if (isLoading && isEditMode) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <PageContainer maxWidth="5xl">
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormContainer>
          {/* Title and Back Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200">
          <h4 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
            {isEditMode ? 'Edit Booking' : 'Create Booking'}
          </h4>
          <button
            type="button"
            onClick={() => navigate('/bookings')}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-md hover:bg-gray-100"
          >
            <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Back</span>
          </button>
        </div>

        {/* Booking Basic Information */}
        <div className="space-y-2 sm:space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            <div className="customer-search-container sm:col-span-2 lg:col-span-1">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5">
                Customer <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <input
                  type="text"
                  placeholder="Type customer name or mobile (min 3 chars)..."
                  value={customerSearchQuery}
                  onChange={(e) => {
                    setCustomerSearchQuery(e.target.value)
                    setShowCustomerDropdown(true)
                    if (e.target.value.length < 3) {
                      setValue('customerId', '')
                    }
                  }}
                  onFocus={() => {
                    if (customerSearchQuery.length >= 3) {
                      setShowCustomerDropdown(true)
                    }
                  }}
                  className="w-full pl-7 sm:pl-9 pr-2 sm:pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                />
                {customerSearchQuery.length > 0 && customerSearchQuery.length < 3 && (
                  <p className="mt-1 text-[10px] sm:text-xs text-gray-500">Type at least 3 characters to search</p>
                )}
                {showCustomerDropdown && customerSearchQuery.length >= 3 && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 sm:max-h-60 overflow-auto">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.customerId}
                        onClick={() => {
                          setValue('customerId', customer.customerId, { shouldValidate: true })
                          setCustomerSearchQuery(`${customer.customerName} - ${customer.mobileNumber || ''}`)
                          setShowCustomerDropdown(false)
                        }}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-gray-100 cursor-pointer text-xs sm:text-sm"
                      >
                        {customer.customerName} - {customer.mobileNumber || 'No mobile'}
                      </div>
                    ))}
                  </div>
                )}
                {showCustomerDropdown && customerSearchQuery.length >= 3 && filteredCustomers.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-500">
                    No customers found
                  </div>
                )}
              </div>
              <input
                type="hidden"
                {...register('customerId', { required: 'Customer is required' })}
              />
              {errors.customerId && (
                <p className="mt-1 text-[10px] sm:text-xs text-red-600">{errors.customerId.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5">
                Booking Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register('bookingType', { required: 'Booking type is required' })}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
              >
                <option value="RENT">Rent</option>
                <option value="SALE">Sale</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
              >
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Booking Items Section */}
        <div className="space-y-2 sm:space-y-3 pt-2 sm:pt-3 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2">
            <h4 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800">Booking Items</h4>
            <button
              type="button"
              onClick={() => appendItem({ variantId: '', quantity: 1, unitPrice: 0, rentalStart: '', rentalEnd: '', subtotal: 0 })}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-primary-600 text-white text-[10px] sm:text-xs font-medium rounded-lg hover:bg-primary-700 transition-all shadow-sm"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          {itemFields.map((field, index) => {
            const isExpanded = expandedItems.has(index)
            const variant = getVariantInfo(items[index]?.variantId)
            return (
              <div key={field.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-gray-300 transition-colors">
                <div className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 flex items-center justify-between border-b border-gray-100 flex-wrap gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => toggleItem(index)}
                    className="flex-1 flex items-center gap-1 sm:gap-2 text-left min-w-0 flex-wrap"
                  >
                    <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-600 flex-shrink-0" />
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-800">Item {index + 1}</span>
                    {variant && (
                      <span className="text-[10px] sm:text-xs text-gray-600 truncate hidden sm:inline">
                        {variant.productName} ({variant.sizeCode || 'N/A'})
                      </span>
                    )}
                    {items[index]?.quantity && (
                      <span className="text-[10px] sm:text-xs text-gray-500 ml-auto">
                        {items[index].quantity}×₹{items[index]?.unitPrice || 0} = ₹{calculateSubtotal(index).toFixed(2)}
                      </span>
                    )}
                  </button>
                  <div className="flex items-center gap-1 ml-auto sm:ml-2">
                    {itemFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-0.5 sm:p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                        title="Remove item"
                      >
                        <X className="w-3 h-3 sm:w-3 sm:h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleItem(index)}
                      className="p-0.5 sm:p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-all"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="p-2 sm:p-3 space-y-2 sm:space-y-2.5 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-1.5">
                          Product Variant <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register(`items.${index}.variantId`, {
                            required: 'Variant is required',
                            valueAsNumber: true
                          })}
                          onChange={(e) => handleVariantChange(index, e.target.value)}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
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
                      </div>
                      <div>
                        <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-1.5">
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          {...register(`items.${index}.quantity`, {
                            required: 'Quantity is required',
                            valueAsNumber: true,
                            min: 1
                          })}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-1.5">
                          Unit Price <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.unitPrice`, {
                            required: 'Unit price is required',
                            valueAsNumber: true
                          })}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        />
                      </div>
                      {bookingType === 'RENT' && (
                        <>
                          <div>
                            <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-1.5">
                              Rental Start Date
                            </label>
                            <input
                              type="date"
                              {...register(`items.${index}.rentalStart`)}
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-1.5">
                              Rental End Date
                            </label>
                            <input
                              type="date"
                              {...register(`items.${index}.rentalEnd`)}
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                            />
                          </div>
                        </>
                      )}
                      <div className="sm:col-span-2 lg:col-span-3 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-600" />
                            <span className="text-[10px] sm:text-xs font-semibold text-gray-700">Subtotal:</span>
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-primary-700">₹{calculateSubtotal(index).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Transactions Section */}
        <div className="space-y-2 sm:space-y-3 pt-2 sm:pt-3 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2">
            <h4 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800">Inventory Transactions</h4>
            <button
              type="button"
              onClick={() => appendTransaction({
                variantId: '',
                transactionType: 'RENT_OUT',
                quantity: 1,
                expectedReturnDate: '',
                actualReturnDate: '',
                status: 'ACTIVE',
                notes: '',
                damageRecords: [],
              })}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-primary-600 text-white text-[10px] sm:text-xs font-medium rounded-lg hover:bg-primary-700 transition-all shadow-sm"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Add Transaction</span>
            </button>
          </div>

          {transactionFields.map((field, index) => {
            const transaction = watch(`transactions.${index}`) || transactions[index]
            const isDamageType = transaction?.transactionType === 'DAMAGE'
            const damageRecords = watch(`transactions.${index}.damageRecords`) || transaction?.damageRecords || []
            const isExpanded = expandedTransactions.has(index)
            const variant = getVariantInfo(transaction?.variantId)
            return (
              <div key={field.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-gray-300 transition-colors">
                <div className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 flex items-center justify-between border-b border-gray-100 flex-wrap gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => toggleTransaction(index)}
                    className="flex-1 flex items-center gap-1 sm:gap-2 flex-wrap text-left min-w-0"
                  >
                    <Receipt className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-600 flex-shrink-0" />
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-800">Transaction {index + 1}</span>
                    {variant && (
                      <span className="text-[10px] sm:text-xs text-gray-600 truncate hidden sm:inline">
                        {variant.productName} ({variant.sizeCode || 'N/A'})
                      </span>
                    )}
                    {transaction?.transactionType && (
                      <span className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                        {transaction.transactionType}
                      </span>
                    )}
                    {transaction?.status && (
                      <span className={`text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full font-medium ${
                        transaction.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        transaction.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                        transaction.status === 'REPORTED' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {transaction.status}
                      </span>
                    )}
                    {transaction?.quantity && (
                      <span className="text-[10px] sm:text-xs text-gray-500">Qty: {transaction.quantity}</span>
                    )}
                  </button>
                  <div className="flex items-center gap-1 ml-auto sm:ml-2">
                    <button
                      type="button"
                      onClick={() => removeTransaction(index)}
                      className="p-0.5 sm:p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                      title="Remove transaction"
                    >
                      <X className="w-3 h-3 sm:w-3 sm:h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleTransaction(index)}
                      className="p-0.5 sm:p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-all"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="p-2 sm:p-3 space-y-2 sm:space-y-2.5 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-1.5">
                          Variant <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register(`transactions.${index}.variantId`, {
                            required: 'Variant is required',
                            valueAsNumber: true
                          })}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                        >
                          <option value="">Select Variant</option>
                          {allVariants.map((variant) => (
                            <option key={variant.variantId} value={variant.variantId}>
                              {variant.productName} - Size: {variant.sizeCode || 'N/A'}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Transaction Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register(`transactions.${index}.transactionType`, {
                            required: 'Transaction type is required'
                          })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                        >
                          <option value="RENT_OUT">Rent Out</option>
                          <option value="RETURN">Return</option>
                          <option value="SALE">Sale</option>
                          <option value="DAMAGE">Damage</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          {...register(`transactions.${index}.quantity`, {
                            required: 'Quantity is required',
                            valueAsNumber: true,
                            min: 1
                          })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Status
                        </label>
                        <select
                          {...register(`transactions.${index}.status`)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="REPORTED">Reported</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>
                      </div>
                      {bookingType === 'RENT' && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                              Expected Return Date
                            </label>
                            <input
                              type="date"
                              {...register(`transactions.${index}.expectedReturnDate`)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                              Actual Return Date
                            </label>
                            <input
                              type="date"
                              {...register(`transactions.${index}.actualReturnDate`)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                            />
                          </div>
                        </>
                      )}
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Notes
                        </label>
                        <textarea
                          {...register(`transactions.${index}.notes`)}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                        />
                      </div>
                    </div>

                    {/* Damage Records Section (only for DAMAGE transactions) */}
                    {isDamageType && (
                      <div className="border-t border-gray-100 pt-2.5 mt-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-semibold text-gray-700">Damage Records</h5>
                          <button
                            type="button"
                            onClick={() => addDamageRecord(index)}
                            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 px-2 py-1 rounded-md hover:bg-primary-50 transition-all font-medium"
                          >
                            <PlusCircle size={12} />
                            <span>Add Damage</span>
                          </button>
                        </div>
                        {damageRecords && damageRecords.length > 0 ? (
                          damageRecords.map((damage, damageIndex) => (
                            <div key={damageIndex} className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                              <div className="flex justify-between items-start mb-2 pb-2 border-b border-red-200">
                                <div className="flex items-center gap-2">
                                  <AlertCircle size={12} className="text-red-600" />
                                  <span className="text-xs font-semibold text-gray-700">Damage {damageIndex + 1}</span>
                                  {damage.repairCost > 0 && (
                                    <span className="text-xs text-red-700 font-medium">₹{damage.repairCost}</span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeDamageRecord(index, damageIndex)}
                                  className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-all"
                                  title="Remove damage record"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Description
                                  </label>
                                  <input
                                    type="text"
                                    {...register(`transactions.${index}.damageRecords.${damageIndex}.description`)}
                                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Repair Cost
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    {...register(`transactions.${index}.damageRecords.${damageIndex}.repairCost`, {
                                      valueAsNumber: true
                                    })}
                                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                  />
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-500 text-center py-2">
                            No damage records added yet
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Total Amount */}
        <div className="pt-2 sm:pt-3 border-t border-gray-200">
          <div className="bg-gradient-to-r from-primary-50 via-primary-100 to-primary-50 border border-primary-200 rounded-lg px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <DollarSign className="w-4 h-4 sm:w-4 sm:h-4 text-primary-600" />
                <span className="text-xs sm:text-sm font-semibold text-gray-700">Total Amount:</span>
              </div>
              <span className="text-base sm:text-lg md:text-xl font-bold text-primary-700">
                ₹{watch('totalAmount')?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/bookings')}
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 text-xs sm:text-sm font-medium transition-all w-full sm:w-auto"
          >
            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Cancel</span>
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 text-xs sm:text-sm font-medium transition-all shadow-sm hover:shadow w-full sm:w-auto"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
              </>
            ) : (
              <>
                <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{isEditMode ? 'Update Booking' : 'Create Booking'}</span>
              </>
            )}
          </button>
        </div>
        </FormContainer>
      </form>
    </PageContainer>
  )
}

export default BookingDetails

