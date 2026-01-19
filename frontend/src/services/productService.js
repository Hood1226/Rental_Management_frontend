import api from './api'

export const productService = {
  getAll: async () => {
    const response = await api.get('/products')
    return response.data
  },
  
  getById: async (id) => {
    const response = await api.get(`/products/${id}`)
    return response.data
  },
  
  create: async (product) => {
    const response = await api.post('/products', product)
    return response.data
  },
  
  update: async (id, product) => {
    const response = await api.put(`/products/${id}`, product)
    return response.data
  },
  
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`)
    return response.data
  },
}


