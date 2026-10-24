import axios from 'axios'
import type { Order, OrderCreateInput, OrderListItem, OrderStatus } from '../types/order'

const endpoint = '/api/v1/orders'

export const ordersApi = {
  async list(search = ''): Promise<OrderListItem[]> {
    const response = await axios.get<OrderListItem[]>(endpoint, {
      params: search ? { search } : undefined,
    })
    return response.data
  },

  async get(id: number): Promise<Order> {
    const response = await axios.get<Order>(`${endpoint}/${id}`)
    return response.data
  },

  async create(order: OrderCreateInput): Promise<Order> {
    const response = await axios.post<Order>(endpoint, order)
    return response.data
  },

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    const response = await axios.patch<Order>(`${endpoint}/${id}/status`, { status })
    return response.data
  },
}
