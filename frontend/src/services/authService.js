import api from './api'

export const authService = {
  login: async (identifier, password) => {
    // identifier can be either email or mobile number
    // Send as emailOrMobile to match backend expectation
    const payload = {
      emailOrMobile: identifier,
      password
    }
    
    const response = await api.post('/auth/login', payload)
    return response.data
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },
  
  logout: async () => {
    // Clear token on backend
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // Even if logout fails, continue with local logout
      console.error('Logout error:', error)
    }
    return Promise.resolve()
  },
}


