import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/authService'
import { toast } from 'react-toastify'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [isLoading, setIsLoading] = useState(false)

  const validateEmailOrMobile = (value) => {
    if (!value) {
      return 'Email or mobile number is required'
    }
    // Check if it's a valid email or mobile number (10 digits)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const mobileRegex = /^[0-9]{10}$/
    const cleanValue = value.replace(/\s+/g, '')
    
    if (emailRegex.test(cleanValue) || mobileRegex.test(cleanValue)) {
      return true
    }
    return 'Please enter a valid email or 10-digit mobile number'
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const response = await authService.login(data.identifier, data.password)
      if (response.success) {
        // Extract user data from response.data (userId, userName, email, roleName, etc.)
        const userData = {
          userId: response.data.userId,
          userName: response.data.userName,
          email: response.data.email,
          roleName: response.data.roleName,
        }
        login(userData, response.data.token)
        toast.success('Login successful!')
        navigate('/')
      } else {
        toast.error(response.message || 'Login failed')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Rental Management
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email or Mobile Number
            </label>
            <input
              type="text"
              placeholder="Enter email or mobile number"
              {...register('identifier', { 
                required: 'Email or mobile number is required',
                validate: validateEmailOrMobile
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.identifier && (
              <p className="text-red-500 text-sm mt-1">{errors.identifier.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              You can login with your email address or 10-digit mobile number
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              {...register('password', { required: 'Password is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login


