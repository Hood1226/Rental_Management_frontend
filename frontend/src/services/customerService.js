import api from './api'

export const customerService = {
  getAll: async () => {
    const response = await api.get('/customers')
    return response.data
  },
  
  getById: async (id) => {
    const response = await api.get(`/customers/${id}`)
    return response.data
  },
  
  create: async (customer) => {
    const response = await api.post('/customers', customer)
    return response.data
  },
  
  update: async (id, customer) => {
    const response = await api.put(`/customers/${id}`, customer)
    return response.data
  },
}


