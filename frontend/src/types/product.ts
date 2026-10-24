export interface Product {
  id: number
  name: string
  sku: string
  description: string | null
  category: string | null
  quantity: number
  price: number
  created_at: string
}

export interface ProductInput {
  name: string
  sku: string
  description: string
  category: string
  quantity: number
  price: number
}
