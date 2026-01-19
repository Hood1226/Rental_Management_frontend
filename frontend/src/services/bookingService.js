import api from './api'

export const bookingService = {
  getAll: async () => {
    const response = await api.get('/bookings')
    return response.data
  },
  
  getById: async (id) => {
    const response = await api.get(`/bookings/${id}`)
    return response.data
  },
  
  create: async (booking) => {
    const response = await api.post('/bookings', booking)
    return response.data
  },
  
  update: async (id, booking) => {
    const response = await api.put(`/bookings/${id}`, booking)
    return response.data
  },
}


