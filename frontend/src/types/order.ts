export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItem {
  id: number
  product_id: number
  product_name: string
  product_sku: string
  quantity: number
  unit_price: number
  line_total: number
}

export interface Order {
  id: number
  order_number: string
  status: OrderStatus
  warehouse_id: number
  warehouse_name: string
  created_at: string
  items: OrderItem[]
  total: number
}

export interface OrderListItem {
  id: number
  order_number: string
  status: OrderStatus
  warehouse_id: number
  warehouse_name: string
  created_at: string
  item_count: number
  total: number
}

export interface OrderCreateInput {
  warehouse_id: number
  items: { product_id: number; quantity: number }[]
}
