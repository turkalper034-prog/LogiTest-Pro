export interface StockMovement {
  id: number
  product_id: number
  product_name: string
  product_sku: string
  warehouse_id: number
  warehouse_name: string
  movement_type: 'inbound' | 'outbound'
  quantity: number
  previous_quantity: number
  new_quantity: number
  note: string | null
  created_at: string
}

export interface Warehouse {
  id: number
  name: string
  location: string | null
  created_at: string
  movement_count: number
}

export interface Analytics {
  products_count: number
  units_in_stock: number
  inventory_value: number
  low_stock_count: number
  categories_count: number
  stock_movements_count: number
}
