import api from './api'

export const sizeService = {
  getAll: async () => {
    try {
      const response = await api.get('/sizes')
      return response.data
    } catch (error) {
      // If sizes endpoint doesn't exist, return empty array
      // This allows the app to work even if sizes API is not implemented yet
      console.warn('Sizes endpoint not available:', error)
      return { success: true, data: [] }
    }
  },
}

