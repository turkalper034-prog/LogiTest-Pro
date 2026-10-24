import { useEffect, useState, type FormEvent } from 'react'
import axios from 'axios'
import { inventoryApi } from '../services/inventory'
import { ordersApi } from '../services/orders'
import { productsApi } from '../services/products'
import type { Warehouse } from '../types/inventory'
import type { Order, OrderCreateInput, OrderListItem, OrderStatus } from '../types/order'
import type { Product } from '../types/product'

const transitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail: unknown = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) return detail.map((item) => item.msg).filter(Boolean).join(' ')
    if (!error.response) return 'Could not connect to the API. Check that the backend is running.'
  }
  return 'The operation failed. Please try again.'
}

function OrdersPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [search, setSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [warehouseId, setWarehouseId] = useState(0)
  const [items, setItems] = useState([{ product_id: 0, quantity: 1 }])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    Promise.all([ordersApi.list(search.trim()), productsApi.list(), inventoryApi.listWarehouses()])
      .then(([orderData, productData, warehouseData]) => {
        if (!active) return
        setOrders(orderData)
        setProducts(productData)
        setWarehouses(warehouseData)
        setWarehouseId((current) => current || warehouseData[0]?.id || 0)
        setItems((current) => current.map((item, index) => ({
          ...item,
          product_id: item.product_id || (index === 0 ? productData[0]?.id || 0 : 0),
        })))
      })
      .catch((loadError: unknown) => {
        if (active) setError(getErrorMessage(loadError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [search, refreshKey])

  const loadOrderDetails = async (id: number) => {
    setError('')
    try {
      setSelectedOrder(await ordersApi.get(id))
    } catch (detailError) {
      setError(getErrorMessage(detailError))
    }
  }

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload: OrderCreateInput = { warehouse_id: warehouseId, items }
      const created = await ordersApi.create(payload)
      setFormOpen(false)
      setItems([{ product_id: products[0]?.id || 0, quantity: 1 }])
      setMessage(`Order ${created.order_number} created successfully.`)
      setRefreshKey((current) => current + 1)
      setSelectedOrder(created)
    } catch (createError) {
      setError(getErrorMessage(createError))
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (order: Order, nextStatus: OrderStatus) => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const updated = await ordersApi.updateStatus(order.id, nextStatus)
      setSelectedOrder(updated)
      setMessage(`Order ${updated.order_number} is now ${statusLabels[updated.status]}.`)
      setRefreshKey((current) => current + 1)
    } catch (statusError) {
      setError(getErrorMessage(statusError))
    } finally {
      setSaving(false)
    }
  }

  const addItem = () => {
    const usedProducts = new Set(items.map((item) => item.product_id))
    const availableProduct = products.find((product) => !usedProducts.has(product.id))
    if (availableProduct) setItems((current) => [...current, { product_id: availableProduct.id, quantity: 1 }])
  }

  const updateItem = (index: number, update: Partial<(typeof items)[number]>) => {
    setItems((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, ...update } : item))
  }

  const orderTotal = items.reduce((total, item) => {
    const product = products.find((candidate) => candidate.id === item.product_id)
    return total + (product?.price ?? 0) * item.quantity
  }, 0)

  return (
    <section className="container mx-auto px-8 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-primary-300">Order management</p>
          <h1 className="mt-1 text-3xl font-bold text-white">Orders</h1>
          <p className="mt-2 text-gray-400">Create orders and track their status through shipment and delivery.</p>
        </div>
        <button type="button" onClick={() => { setError(''); setMessage(''); setFormOpen((open) => !open) }} disabled={!products.length || !warehouses.length} className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
          + Create order
        </button>
      </div>

      {error && <div role="alert" className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-300">{error}</div>}
      {message && <div role="status" className="mb-4 rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-green-300">{message}</div>}

      {(!products.length || !warehouses.length) && !loading && (
        <p className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-200">
          {products.length ? 'Create a warehouse before creating an order.' : 'Add products and a warehouse before creating an order.'}
        </p>
      )}

      {formOpen && (
        <form onSubmit={submitOrder} className="mb-6 rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
          <div className="mb-5 flex items-center justify-between">
            <div><h2 className="text-xl font-semibold text-white">New order</h2><p className="mt-1 text-sm text-gray-400">Stock is deducted only when the order is shipped.</p></div>
            <button type="button" onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-white" aria-label="Close order form">✕</button>
          </div>
          <label className="block max-w-md text-sm text-gray-300">Fulfillment warehouse *
            <select required value={warehouseId || ''} onChange={(event) => setWarehouseId(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white">
              <option value="" disabled>Select a warehouse</option>
              {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
            </select>
          </label>
          <div className="mt-5 space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
                <label className="text-sm text-gray-300">Product
                  <select required value={item.product_id || ''} onChange={(event) => updateItem(index, { product_id: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white">
                    <option value="" disabled>Select a product</option>
                    {products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.sku} · {product.quantity} in stock</option>)}
                  </select>
                </label>
                <label className="text-sm text-gray-300">Quantity
                  <input type="number" min="1" step="1" required value={item.quantity} onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white" />
                </label>
                {items.length > 1 && <button type="button" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="self-end rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-red-500/10">Remove</button>}
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={addItem} disabled={items.length >= products.length} className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 disabled:opacity-50">+ Add product</button>
            <p className="text-gray-300">Estimated total: <strong className="text-white">{orderTotal.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</strong></p>
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-700">Cancel</button>
            <button disabled={saving} type="submit" className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-500 disabled:opacity-60">{saving ? 'Creating...' : 'Create order'}</button>
          </div>
        </form>
      )}

      <div className={`grid gap-6 ${selectedOrder ? 'xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]' : 'grid-cols-1'}`}>
        <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800/70 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-700 p-5">
            <div><h2 className="text-lg font-semibold text-white">Order list</h2><p className="mt-1 text-sm text-gray-400">{orders.length} order{orders.length === 1 ? '' : 's'}</p></div>
            <label className="w-full sm:w-80"><span className="sr-only">Search order number</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order number..." className="w-full rounded-lg border border-gray-600 bg-gray-900 px-4 py-2 text-white outline-none focus:border-blue-500" /></label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead className="bg-gray-900/60 text-xs uppercase tracking-wide text-gray-400"><tr><th className="px-5 py-4">Order</th><th className="px-5 py-4">Date</th><th className="px-5 py-4">Warehouse</th><th className="px-5 py-4">Items</th><th className="px-5 py-4 text-right">Total</th><th className="px-5 py-4">Status</th></tr></thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">Loading orders...</td></tr>
                  : orders.length === 0 ? <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">{search ? 'No orders match your search.' : 'No orders yet. Create an order to get started.'}</td></tr>
                    : orders.map((order) => (
                      <tr key={order.id} onClick={() => void loadOrderDetails(order.id)} className={`cursor-pointer hover:bg-gray-700/40 ${selectedOrder?.id === order.id ? 'bg-gray-700/50' : ''}`}>
                        <td className="px-5 py-4 font-mono text-sm font-medium text-blue-300">{order.order_number}</td>
                        <td className="px-5 py-4 text-sm text-gray-300">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-4 text-sm text-gray-300">{order.warehouse_name}</td>
                        <td className="px-5 py-4 text-sm text-gray-300">{order.item_count}</td>
                        <td className="px-5 py-4 text-right text-sm text-white">{order.total.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                        <td className="px-5 py-4"><OrderStatusBadge status={order.status} /></td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedOrder && (
          <aside className="h-fit rounded-xl border border-gray-700 bg-gray-800/70 p-5">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-sm text-gray-400">Order details</p><h2 className="mt-1 font-mono text-lg font-semibold text-white">{selectedOrder.order_number}</h2></div>
              <button type="button" onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white" aria-label="Close order details">✕</button>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><OrderStatusBadge status={selectedOrder.status} /><span className="text-sm text-gray-400">{new Date(selectedOrder.created_at).toLocaleString()}</span></div>
            <p className="mt-3 text-sm text-gray-300">Warehouse: {selectedOrder.warehouse_name}</p>
            <div className="mt-5 space-y-3 border-y border-gray-700 py-4">
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-3 text-sm">
                  <div><p className="text-white">{item.product_name}</p><p className="mt-1 text-gray-400">{item.product_sku} · {item.quantity} × {item.unit_price.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</p></div>
                  <span className="text-gray-200">{item.line_total.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between font-semibold text-white"><span>Total</span><span>{selectedOrder.total.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span></div>
            {transitions[selectedOrder.status].length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {transitions[selectedOrder.status].map((nextStatus) => (
                  <button key={nextStatus} type="button" disabled={saving} onClick={() => void changeStatus(selectedOrder, nextStatus)} className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 ${nextStatus === 'cancelled' ? 'border border-red-500/40 text-red-300 hover:bg-red-500/10' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
                    {nextStatus === 'shipped' ? 'Mark as shipped (deduct stock)' : `Mark as ${statusLabels[nextStatus].toLowerCase()}`}
                  </button>
                ))}
              </div>
            )}
            {selectedOrder.status === 'processing' && <p className="mt-3 text-xs text-gray-500">Stock is deducted atomically when the order is marked as shipped.</p>}
          </aside>
        )}
      </div>
    </section>
  )
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const style: Record<OrderStatus, string> = {
    pending: 'bg-gray-500/20 text-gray-300',
    confirmed: 'bg-blue-500/20 text-blue-300',
    processing: 'bg-purple-500/20 text-purple-300',
    shipped: 'bg-orange-500/20 text-orange-300',
    delivered: 'bg-green-500/20 text-green-300',
    cancelled: 'bg-red-500/20 text-red-300',
  }
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${style[status]}`}>{statusLabels[status]}</span>
}

export default OrdersPage
