import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { customerService } from '../services/customerService'
import Modal from './Modal'

function CustomerModal({ isOpen, onClose, customer = null }) {
  const queryClient = useQueryClient()
  const isEditMode = !!customer
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      customerName: '',
      mobileNumber: '',
      whatsappNumber: '',
      email: '',
      address: '',
      idProofType: '',
      idProofNo: '',
      idProofImg: '',
    },
  })

  useEffect(() => {
    if (customer) {
      reset({
        customerName: customer.customerName || '',
        mobileNumber: customer.mobileNumber || '',
        whatsappNumber: customer.whatsappNumber || '',
        email: customer.email || '',
        address: customer.address || '',
        idProofType: customer.idProofType || '',
        idProofNo: customer.idProofNo || '',
        idProofImg: customer.idProofImg || '',
      })
    } else {
      reset({
        customerName: '',
        mobileNumber: '',
        whatsappNumber: '',
        email: '',
        address: '',
        idProofType: '',
        idProofNo: '',
        idProofImg: '',
      })
    }
  }, [customer, reset, isOpen])

  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEditMode) {
        return customerService.update(customer.customerId, data)
      }
      return customerService.create(data)
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success(
          isEditMode ? 'Customer updated successfully' : 'Customer created successfully'
        )
        queryClient.invalidateQueries({ queryKey: ['customers'] })
        onClose()
      } else {
        toast.error(response.message || 'Operation failed')
      }
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 
        (isEditMode ? 'Failed to update customer' : 'Failed to create customer')
      )
    },
  })

  const onSubmit = (data) => {
    mutation.mutate(data)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Customer' : 'Create New Customer'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('customerName', { required: 'Customer name is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {errors.customerName && (
            <p className="mt-1 text-sm text-red-600">{errors.customerName.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number
            </label>
            <input
              type="text"
              {...register('mobileNumber')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp Number
            </label>
            <input
              type="text"
              {...register('whatsappNumber')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            {...register('email')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            {...register('address')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Proof Type
            </label>
            <select
              {...register('idProofType')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select ID Type</option>
              <option value="Aadhar">Aadhar</option>
              <option value="PAN">PAN</option>
              <option value="Driving License">Driving License</option>
              <option value="Passport">Passport</option>
              <option value="Voter ID">Voter ID</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Proof Number
            </label>
            <input
              type="text"
              {...register('idProofNo')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID Proof Image URL
          </label>
          <input
            type="text"
            {...register('idProofImg')}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
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

export default CustomerModal

