import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { bookingService } from '../../services/bookingService'
import { customerService } from '../../services/customerService'
import { productService } from '../../services/productService'
import { shopService } from '../../services/shopService'
import { useAuth } from '../../context/AuthContext'
import { ArrowLeft, Plus, X, CheckCircle2, Loader2, Package, Receipt, AlertCircle, Calendar, DollarSign, Hash, PlusCircle, ChevronDown, ChevronUp, Save, Trash2, Search } from 'lucide-react'
import PageContainer from '../../components/common/PageContainer'
import FormContainer from '../../components/common/FormContainer'
import FormSection from '../../components/common/FormSection'
import { grids, spacing, inputClasses, textSizes, iconSizes } from '../../utils/responsive'

function BookingDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('BOOKING_MANAGEMENT', 'CREATE')
  const canUpdate = hasPermission('BOOKING_MANAGEMENT', 'UPDATE')
  const isEditMode = !!id && id !== 'new'

  useEffect(() => {
    if (!isEditMode && !canCreate) navigate('/bookings')
  }, [isEditMode, canCreate, navigate])

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
      shopId: '',
      branchId: '',
      bookingType: 'RENT',
      status: 'PENDING',
      totalAmount: 0,
      isAdvanceBooking: false,
      scheduledDate: '',
      advancePaymentAmount: 0,
      items: [],
      additionalTransactions: [],
    },
  })

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: 'items',
  })

  const { fields: additionalTransactionFields, append: appendAdditionalTransaction, remove: removeAdditionalTransaction } = useFieldArray({
    control,
    name: 'additionalTransactions',
  })

  const bookingType = watch('bookingType')
  const items = watch('items')
  const isAdvanceBooking = watch('isAdvanceBooking')
  const selectedShopId = watch('shopId')

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

  const { data: shopsData } = useQuery({
    queryKey: ['shops'],
    queryFn: () => shopService.getShops(),
  })

  const { data: branchesData } = useQuery({
    queryKey: ['branches', selectedShopId],
    queryFn: () => shopService.getBranches(selectedShopId),
    enabled: !!selectedShopId,
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

  const [expandedItems, setExpandedItems] = useState(new Set())
  const [expandedTransactions, setExpandedTransactions] = useState(new Set())
  const [expandedDerivedTransactions, setExpandedDerivedTransactions] = useState(new Set())

  // Handle unit price mapping based on booking type
  const getUnitPrice = (variantId) => {
    const variant = allVariants.find(v => v.variantId === parseInt(variantId))
    if (!variant) return 0
    return bookingType === 'RENT' ? variant.rentPrice : variant.salePrice
  }

  // Handle variant change independently
  const handleVariantChange = (index, variantId) => {
    const variant = allVariants.find(v => v.variantId === parseInt(variantId))
    if (variant) {
      const price = bookingType === 'RENT' ? variant.rentPrice : variant.salePrice
      if (price) {
        const product = productsData?.data?.find(p => p.productId === variant.productId)
        const discountPercent = product?.discountPercent || 0
        const discountAmount = (price * discountPercent) / 100
        const finalUnitPrice = price - discountAmount
        
        setValue(`items.${index}.unitPrice`, price, { shouldValidate: true })
        setValue(`items.${index}.discountPercent`, discountPercent, { shouldValidate: true })
        
        const quantity = watch(`items.${index}.quantity`) || 1
        
        // These will be overridden by the watch effect anyway, but setting them here
        // avoids a slightly delayed visual update before calculateTotals runs
        setValue(`items.${index}.finalUnitPrice`, finalUnitPrice, { shouldValidate: false })
        setValue(`items.${index}.discountAmount`, discountAmount * quantity, { shouldValidate: false })
        setValue(`items.${index}.subtotal`, quantity * finalUnitPrice, { shouldValidate: false })
        
        // Trigger a calculation of totals immediately 
        setTimeout(calculateTotals, 0)
      }
    }
  }

  useEffect(() => {
    if (isEditMode && bookingData?.data) {
      const booking = bookingData.data
      const extraTrans = (booking.transactions || []).filter(
        (t) => t.transactionType === 'RETURN' || t.transactionType === 'DAMAGE'
      )
      reset({
        customerId: booking.customerId || '',
        shopId: booking.shopId || '',
        branchId: booking.branchId || '',
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
            discountPercent: item.discountPercent || 0,
            discountAmount: item.discountAmount || 0,
            finalUnitPrice: item.finalUnitPrice || item.unitPrice || 0,
            rentalStart: item.rentalStart || '',
            rentalEnd: item.rentalEnd || '',
            subtotal: item.subtotal || 0,
          }))
          : [],
        additionalTransactions: extraTrans.length > 0
          ? extraTrans.map(trans => ({
            transactionId: trans.transactionId || null,
            variantId: trans.variantId || '',
            transactionType: trans.transactionType || 'RETURN',
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
      } else if (bookingData?.data?.customerName && bookingData?.data?.mobileNumber) {
        setCustomerSearchQuery(`${bookingData.data.customerName} - ${bookingData.data.mobileNumber}`)
      } else if (bookingData?.data?.customerName) {
        setCustomerSearchQuery(bookingData.data.customerName)
      }
    } else if (!isEditMode) {
      reset({
        customerId: '',
        shopId: '',
        branchId: '',
        bookingType: 'RENT',
        status: 'PENDING',
        totalAmount: 0,
        isAdvanceBooking: false,
        scheduledDate: '',
        advancePaymentAmount: 0,
        items: [{ variantId: '', quantity: 1, unitPrice: 0, discountPercent: 0, discountAmount: 0, finalUnitPrice: 0, rentalStart: '', rentalEnd: '', subtotal: 0 }],
        additionalTransactions: [],
      })
      setCustomerSearchQuery('')
    }
  }, [bookingData, customerData, isEditMode, reset])
  // Keep transactions in sync: derived from items + additional (RETURN/DAMAGE) only
  const derivedTransactions = useMemo(() => {
    if (!items?.length) return []
    const type = bookingType === 'SALE' ? 'SALE' : 'RENT_OUT'
    return items
      .filter((i) => i?.variantId)
      .map((item) => {
        const existing = isEditMode && bookingData?.data?.transactions?.find(
          (t) => t.variantId === item.variantId && ['RENT_OUT', 'SALE'].includes(t.transactionType)
        )
        return {
          transactionId: existing?.transactionId ?? null,
          variantId: item.variantId,
          transactionType: type,
          quantity: item.quantity ?? 1,
          expectedReturnDate: item.rentalEnd || null,
          actualReturnDate: existing?.actualReturnDate || null,
          status: existing?.status || 'ACTIVE',
          notes: existing?.notes || '',
          damageRecords: existing?.damageRecords || [],
        }
      })
  }, [items, bookingType, isEditMode, bookingData?.data?.transactions])
  const additionalTransactions = watch('additionalTransactions') || []

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
    if (!selectedShopId) {
      setValue('branchId', '')
    }
  }, [selectedShopId, setValue])

  // Calculate totals - extracted to a separate function to avoid infinite loops in watch
  const calculateTotals = () => {
    // Avoid accessing watch() directly inside since we're calling this from the watch callback
    const currentItems = watch('items') || []
    let total = 0

    currentItems.forEach((item, idx) => {
      const quantity = item.quantity || 0
      const baseUnit = item.unitPrice || 0
      const discountPercent = item.discountPercent || 0
      const discountUnit = (baseUnit * discountPercent) / 100
      const finalUnit = baseUnit - discountUnit
      const subtotal = quantity * finalUnit
      
      total += subtotal

      // Only update if values have changed to prevent infinite loops
      if (item.finalUnitPrice !== finalUnit) {
        setValue(`items.${idx}.finalUnitPrice`, finalUnit, { shouldValidate: false, shouldDirty: false })
      }
      if (item.discountAmount !== (discountUnit * quantity)) {
        setValue(`items.${idx}.discountAmount`, discountUnit * quantity, { shouldValidate: false, shouldDirty: false })
      }
      if (item.subtotal !== subtotal) {
        setValue(`items.${idx}.subtotal`, subtotal, { shouldValidate: false, shouldDirty: false })
      }
    })

    if (watch('totalAmount') !== total) {
      setValue('totalAmount', total, { shouldValidate: false, shouldDirty: true })
    }
  }

  // Set up the watcher just once
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      // Prevent loop by only triggering calculation when user explicitly changes relevant fields
      if (name?.startsWith('items.') && (
        name.endsWith('.quantity') || 
        name.endsWith('.unitPrice') || 
        name.endsWith('.discountPercent')
      )) {
         calculateTotals()
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
    const payload = { ...data }
    if (!Number.isFinite(payload.shopId)) delete payload.shopId
    if (!Number.isFinite(payload.branchId)) delete payload.branchId
    if (isEditMode) {
      payload.transactions = [
        ...derivedTransactions.map((t) => ({
          transactionId: t.transactionId,
          variantId: t.variantId,
          transactionType: t.transactionType,
          quantity: t.quantity,
          expectedReturnDate: t.expectedReturnDate || undefined,
          actualReturnDate: t.actualReturnDate || undefined,
          status: t.status,
          notes: t.notes,
          damageRecord: t.damageRecords?.[0] ? { description: t.damageRecords[0].description, repairCost: t.damageRecords[0].repairCost, damageId: t.damageRecords[0].damageId } : undefined,
        })),
        ...(data.additionalTransactions || []).map((t) => ({
          transactionId: t.transactionId,
          variantId: t.variantId,
          transactionType: t.transactionType,
          quantity: t.quantity,
          expectedReturnDate: t.expectedReturnDate || undefined,
          actualReturnDate: t.actualReturnDate || undefined,
          status: t.status,
          notes: t.notes,
          damageRecord: t.damageRecords?.[0] ? { description: t.damageRecords[0].description, repairCost: t.damageRecords[0].repairCost, damageId: t.damageRecords[0].damageId } : undefined,
        })),
      ]
    } else {
      payload.transactions = (data.additionalTransactions || []).map((t) => ({
        variantId: t.variantId,
        transactionType: t.transactionType,
        quantity: t.quantity,
        expectedReturnDate: t.expectedReturnDate || undefined,
        actualReturnDate: t.actualReturnDate || undefined,
        status: t.status,
        notes: t.notes,
        damageRecord: t.damageRecords?.[0] ? { description: t.damageRecords[0].description, repairCost: t.damageRecords[0].repairCost } : undefined,
      }))
    }
    delete payload.additionalTransactions
    mutation.mutate(payload)
  }

  const getVariantInfo = (variantId) => {
    return allVariants.find(v => v.variantId === variantId)
  }

  const calculateSubtotal = (index) => {
    const item = items[index]
    if (item) {
      const quantity = parseFloat(item.quantity) || 0
      const finalUnitPrice = parseFloat(item.finalUnitPrice ?? item.unitPrice) || 0
      return quantity * finalUnitPrice
    }
    return 0
  }

  const addDamageRecord = (transactionIndex) => {
    const current = watch('additionalTransactions')
    const updated = [...(current || [])]
    if (!updated[transactionIndex].damageRecords) {
      updated[transactionIndex].damageRecords = []
    }
    updated[transactionIndex] = {
      ...updated[transactionIndex],
      damageRecords: [
        ...updated[transactionIndex].damageRecords,
        {
          description: '',
          repairCost: 0,
        }
      ]
    }
    setValue('additionalTransactions', updated, { shouldDirty: true })
  }

  const removeDamageRecord = (transactionIndex, damageIndex) => {
    const current = watch('additionalTransactions')
    const updated = [...(current || [])]
    if (updated[transactionIndex].damageRecords) {
      updated[transactionIndex] = {
        ...updated[transactionIndex],
        damageRecords: updated[transactionIndex].damageRecords.filter((_, idx) => idx !== damageIndex)
      }
      setValue('additionalTransactions', updated, { shouldDirty: true })
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
  const shops = shopsData?.data || []
  const branches = branchesData?.data || []

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

  const toggleDerivedTransaction = (key) => {
    const newExpanded = new Set(expandedDerivedTransactions)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedDerivedTransactions(newExpanded)
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
          <div>
            <h4 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
              {isEditMode ? 'Edit Booking' : 'Create Booking'}
            </h4>
            {isEditMode && bookingData?.data?.bookingNo && (
              <p className="text-xs text-gray-500 mt-0.5">Booking No: {bookingData.data.bookingNo}</p>
            )}
          </div>
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
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5">
                Shop
              </label>
              <select
                {...register('shopId', { valueAsNumber: true, required: 'Shop is required' })}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
              >
                <option value="">Select Shop</option>
                {shops.map((shop) => (
                  <option key={shop.shopId} value={shop.shopId}>
                    {shop.shopName} ({shop.shopCode})
                  </option>
                ))}
              </select>
              {errors.shopId && (
                <p className="mt-1 text-[10px] sm:text-xs text-red-600">{errors.shopId.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5">
                Branch
              </label>
              <select
                {...register('branchId', { valueAsNumber: true, required: 'Branch is required' })}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
              >
                <option value="">Select Branch</option>
                {branches.map((branch) => (
                  <option key={branch.branchId} value={branch.branchId}>
                    {branch.branchName} ({branch.branchCode})
                  </option>
                ))}
              </select>
              {errors.branchId && (
                <p className="mt-1 text-[10px] sm:text-xs text-red-600">{errors.branchId.message}</p>
              )}
            </div>
            <div className="flex flex-col justify-end gap-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isAdvanceBooking')}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-xs sm:text-sm font-semibold text-gray-700">Advance booking</span>
              </label>
              {isAdvanceBooking && (
                <>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Scheduled date</label>
                    <input
                      type="date"
                      {...register('scheduledDate')}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Advance payment (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('advancePaymentAmount', { valueAsNumber: true, min: 0 })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Booking Items Section */}
        <div className="space-y-2 sm:space-y-3 pt-2 sm:pt-3 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2">
            <h4 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800">Booking Items</h4>
            {(canCreate || canUpdate) && (
              <button
                type="button"
                onClick={() => appendItem({ variantId: '', quantity: 1, unitPrice: 0, discountPercent: 0, discountAmount: 0, finalUnitPrice: 0, rentalStart: '', rentalEnd: '', subtotal: 0 })}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-primary-600 text-white text-[10px] sm:text-xs font-medium rounded-lg hover:bg-primary-700 transition-all shadow-sm"
              >
                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Add Item</span>
              </button>
            )}
          </div>

          {itemFields.map((field, index) => {
            const isExpanded = expandedItems.has(index)
            const variant = getVariantInfo(items[index]?.variantId)
            const selectedProduct = productsData?.data?.find((p) => p.productId === variant?.productId)
            const maxDiscountPercent = selectedProduct?.maxDiscountPercent ?? 0
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
                        {items[index].quantity}×₹{items[index]?.finalUnitPrice || items[index]?.unitPrice || 0} = ₹{calculateSubtotal(index).toFixed(2)}
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
                      <div>
                        <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-1.5">
                          Discount % (max {maxDiscountPercent})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`items.${index}.discountPercent`, {
                            valueAsNumber: true,
                            validate: (value) =>
                              value <= maxDiscountPercent || `Discount cannot exceed ${maxDiscountPercent}%`
                          })}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-1.5">
                          Final Unit Price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.finalUnitPrice`, { valueAsNumber: true })}
                          readOnly
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 bg-gray-100 rounded-lg"
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

        {/* Inventory Transactions: auto from items + additional (Return/Damage) */}
        <div className="space-y-2 sm:space-y-3 pt-2 sm:pt-3 border-t border-gray-200">
          <h4 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800">Inventory Transactions</h4>
          {derivedTransactions.length > 0 && (
            <div>
              <p className="text-[10px] sm:text-xs text-gray-600 mb-1.5">From booking items (auto)</p>
              <div className="space-y-1.5">
                {derivedTransactions.map((t, idx) => {
                  const variant = getVariantInfo(t.variantId)
                  const derivedKey = `derived-${t.variantId}-${idx}`
                  const isExpanded = expandedDerivedTransactions.has(derivedKey)
                  return (
                    <div
                      key={derivedKey}
                      className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-gray-300 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => toggleDerivedTransaction(derivedKey)}
                        className="w-full flex flex-wrap items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 hover:bg-gray-100 text-left"
                      >
                        <Receipt className="w-3 h-3 text-primary-600 flex-shrink-0" />
                        {variant && (
                          <span className="font-medium text-gray-800 text-[10px] sm:text-xs">
                            {variant.productName} ({variant.sizeCode || 'N/A'})
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium text-[10px] sm:text-xs">{t.transactionType}</span>
                        <span className="text-gray-600 text-[10px] sm:text-xs">Qty: {t.quantity}</span>
                        {t.expectedReturnDate && (
                          <span className="text-gray-500 text-[10px] sm:text-xs">Expected return: {t.expectedReturnDate}</span>
                        )}
                        <span className="ml-auto">
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="px-2 sm:px-3 py-2 sm:py-2.5 bg-white border-t border-gray-100 text-[10px] sm:text-xs text-gray-600 space-y-1">
                          <div><span className="font-semibold text-gray-700">Status:</span> {t.status || 'ACTIVE'}</div>
                          {t.expectedReturnDate && <div><span className="font-semibold text-gray-700">Expected return:</span> {t.expectedReturnDate}</div>}
                          {t.actualReturnDate && <div><span className="font-semibold text-gray-700">Actual return:</span> {t.actualReturnDate}</div>}
                          {t.notes && <div><span className="font-semibold text-gray-700">Notes:</span> {t.notes}</div>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
              <p className="text-[10px] sm:text-xs text-gray-600">Additional (Return / Damage)</p>
              {(canCreate || canUpdate) && (
              <button
                type="button"
                onClick={() => appendAdditionalTransaction({
                  variantId: '',
                  transactionType: 'RETURN',
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
              )}
            </div>
            {additionalTransactionFields.map((field, index) => {
              const transaction = watch(`additionalTransactions.${index}`) || additionalTransactions[index]
              const isDamageType = transaction?.transactionType === 'DAMAGE'
              const damageRecords = watch(`additionalTransactions.${index}.damageRecords`) || transaction?.damageRecords || []
              const isExpanded = expandedTransactions.has(index)
              const variant = getVariantInfo(transaction?.variantId)
              return (
                <div key={field.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-gray-300 transition-colors">
                  <div className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between border-b border-gray-100 flex-wrap gap-1 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => toggleTransaction(index)}
                      className="flex-1 flex items-center gap-1 sm:gap-2 flex-wrap text-left min-w-0"
                    >
                      <Receipt className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-600 flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs font-semibold text-gray-800">Additional {index + 1}</span>
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
                      {transaction?.quantity && (
                        <span className="text-[10px] sm:text-xs text-gray-500">Qty: {transaction.quantity}</span>
                      )}
                    </button>
                    <div className="flex items-center gap-1 ml-auto sm:ml-2">
                      <button
                        type="button"
                        onClick={() => removeAdditionalTransaction(index)}
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
                            {...register(`additionalTransactions.${index}.variantId`, {
                              required: 'Variant is required',
                              valueAsNumber: true
                            })}
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                          >
                            <option value="">Select Variant</option>
                            {allVariants.map((v) => (
                              <option key={v.variantId} value={v.variantId}>
                                {v.productName} - Size: {v.sizeCode || 'N/A'}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-1.5">
                            Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            {...register(`additionalTransactions.${index}.transactionType`, { required: true })}
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                          >
                            <option value="RETURN">Return</option>
                            <option value="DAMAGE">Damage</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-1.5">
                            Quantity <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            {...register(`additionalTransactions.${index}.quantity`, {
                              required: true,
                              valueAsNumber: true,
                              min: 1
                            })}
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-1.5">Status</label>
                          <select
                            {...register(`additionalTransactions.${index}.status`)}
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="REPORTED">Reported</option>
                            <option value="RESOLVED">Resolved</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-1.5">Expected return</label>
                          <input
                            type="date"
                            {...register(`additionalTransactions.${index}.expectedReturnDate`)}
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-1.5">Actual return</label>
                          <input
                            type="date"
                            {...register(`additionalTransactions.${index}.actualReturnDate`)}
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div className="sm:col-span-2 lg:col-span-3">
                          <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-1.5">Notes</label>
                          <textarea
                            {...register(`additionalTransactions.${index}.notes`)}
                            rows={2}
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                          />
                        </div>
                      </div>
                      {isDamageType && (
                        <div className="border-t border-gray-100 pt-2.5 mt-2.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[10px] sm:text-xs font-semibold text-gray-700">Damage Records</h5>
                            <button
                              type="button"
                              onClick={() => addDamageRecord(index)}
                              className="flex items-center gap-1 text-[10px] sm:text-xs text-primary-600 hover:text-primary-700 px-2 py-1 rounded-md hover:bg-primary-50 font-medium"
                            >
                              <PlusCircle size={12} />
                              <span>Add Damage</span>
                            </button>
                          </div>
                          {damageRecords?.length > 0 ? (
                            damageRecords.map((damage, damageIndex) => (
                              <div key={damageIndex} className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                                <div className="flex justify-between items-start mb-2 pb-2 border-b border-red-200">
                                  <div className="flex items-center gap-2">
                                    <AlertCircle size={12} className="text-red-600" />
                                    <span className="text-[10px] sm:text-xs font-semibold text-gray-700">Damage {damageIndex + 1}</span>
                                    {damage.repairCost > 0 && (
                                      <span className="text-[10px] sm:text-xs text-red-700 font-medium">₹{damage.repairCost}</span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeDamageRecord(index, damageIndex)}
                                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-all"
                                    title="Remove damage record"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1">Description</label>
                                    <input
                                      type="text"
                                      {...register(`additionalTransactions.${index}.damageRecords.${damageIndex}.description`)}
                                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1">Repair Cost</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      {...register(`additionalTransactions.${index}.damageRecords.${damageIndex}.repairCost`, { valueAsNumber: true })}
                                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-[10px] sm:text-xs text-gray-500 text-center py-2">No damage records added yet</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Total Amount / Advance payment summary */}
        <div className="pt-2 sm:pt-3 border-t border-gray-200">
          <div className="bg-gradient-to-r from-primary-50 via-primary-100 to-primary-50 border border-primary-200 rounded-lg px-3 sm:px-4 py-2 sm:py-3 space-y-2">
            {isAdvanceBooking ? (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-gray-700">Advance payment:</span>
                  <span className="text-sm sm:text-base font-bold text-green-700">
                    ₹{(Number(watch('advancePaymentAmount')) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2 border-t border-primary-200 pt-2">
                  <span className="text-xs sm:text-sm font-semibold text-gray-700">Balance to pay:</span>
                  <span className="text-sm sm:text-base font-bold text-amber-700">
                    ₹{Math.max(0, (Number(watch('totalAmount')) || 0) - (Number(watch('advancePaymentAmount')) || 0)).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2 border-t border-primary-200 pt-2">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <DollarSign className="w-4 h-4 sm:w-4 sm:h-4 text-primary-600" />
                    <span className="text-xs sm:text-sm font-semibold text-gray-700">Total:</span>
                  </div>
                  <span className="text-base sm:text-lg md:text-xl font-bold text-primary-700">
                    ₹{watch('totalAmount')?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1 sm:gap-2">
                  <DollarSign className="w-4 h-4 sm:w-4 sm:h-4 text-primary-600" />
                  <span className="text-xs sm:text-sm font-semibold text-gray-700">Total Amount:</span>
                </div>
                <span className="text-base sm:text-lg md:text-xl font-bold text-primary-700">
                  ₹{watch('totalAmount')?.toFixed(2) || '0.00'}
                </span>
              </div>
            )}
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
          {((isEditMode && canUpdate) || (!isEditMode && canCreate)) && (
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
          )}
        </div>
        </FormContainer>
      </form>
    </PageContainer>
  )
}

export default BookingDetails

