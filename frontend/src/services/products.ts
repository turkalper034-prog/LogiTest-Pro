import axios from 'axios'
import type { Product, ProductInput } from '../types/product'

const endpoint = '/api/v1/products'

export const productsApi = {
  async list(search = ''): Promise<Product[]> {
    const response = await axios.get<Product[]>(endpoint, {
      params: search ? { search } : undefined,
    })
    return response.data
  },

  async create(product: ProductInput): Promise<Product> {
    const response = await axios.post<Product>(endpoint, product)
    return response.data
  },

  async update(id: number, product: ProductInput): Promise<Product> {
    const response = await axios.put<Product>(`${endpoint}/${id}`, product)
    return response.data
  },

  async remove(id: number): Promise<void> {
    await axios.delete(`${endpoint}/${id}`)
  },
}
