import api from './api'

export const shopService = {
  getShops: async () => {
    const response = await api.get('/shops')
    return response.data
  },
  createShop: async (payload) => {
    const response = await api.post('/shops', payload)
    return response.data
  },
  getBranches: async (shopId) => {
    const query = shopId ? `?shopId=${shopId}` : ''
    const response = await api.get(`/branches${query}`)
    return response.data
  },
  createBranch: async (payload) => {
    const response = await api.post('/branches', payload)
    return response.data
  },
}
