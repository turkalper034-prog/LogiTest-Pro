import axios from 'axios'
import type { Analytics, StockMovement, Warehouse } from '../types/inventory'

const endpoint = '/api/v1/inventory'

export const inventoryApi = {
  async analytics(lowStockThreshold: number): Promise<Analytics> {
    const response = await axios.get<Analytics>(`${endpoint}/analytics`, {
      params: { low_stock_threshold: lowStockThreshold },
    })
    return response.data
  },

  async listMovements(): Promise<StockMovement[]> {
    const response = await axios.get<StockMovement[]>(`${endpoint}/movements`)
    return response.data
  },

  async createMovement(data: {
    product_id: number
    warehouse_id: number
    movement_type: 'inbound' | 'outbound'
    quantity: number
    note: string
  }): Promise<StockMovement> {
    const response = await axios.post<StockMovement>(`${endpoint}/movements`, data)
    return response.data
  },

  async listWarehouses(): Promise<Warehouse[]> {
    const response = await axios.get<Warehouse[]>(`${endpoint}/warehouses`)
    return response.data
  },

  async createWarehouse(data: { name: string; location: string }): Promise<Warehouse> {
    const response = await axios.post<Warehouse>(`${endpoint}/warehouses`, data)
    return response.data
  },
}
