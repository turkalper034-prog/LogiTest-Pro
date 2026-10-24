import { useEffect, useState, type FormEvent } from 'react'
import type { ReactNode } from 'react'
import axios from 'axios'
import { inventoryApi } from '../services/inventory'
import { productsApi } from '../services/products'
import type { Analytics, StockMovement, Warehouse } from '../types/inventory'
import type { Product } from '../types/product'

export type AppSection = 'dashboard' | 'products' | 'inventory' | 'warehouses' | 'orders' | 'analytics' | 'settings'

interface Preferences {
  workspaceName: string
  lowStockThreshold: number
  stockAlerts: boolean
}

const defaultPreferences: Preferences = {
  workspaceName: 'LogiTest Pro',
  lowStockThreshold: 10,
  stockAlerts: true,
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail: unknown = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (!error.response) return 'Could not connect to the API. Check that the backend is running.'
  }
  return 'The operation failed. Please try again.'
}

function WorkspacePage({ page }: { page: Exclude<AppSection, 'dashboard' | 'products'> }) {
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(page !== 'settings' && page !== 'orders')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [preferences, setPreferences] = useState(defaultPreferences)
  const [saved, setSaved] = useState(false)
  const [movementForm, setMovementForm] = useState({
    product_id: 0,
    warehouse_id: 0,
    movement_type: 'inbound' as 'inbound' | 'outbound',
    quantity: 1,
    note: '',
  })
  const [warehouseForm, setWarehouseForm] = useState({ name: '', location: '' })

  useEffect(() => {
    try {
      const stored = localStorage.getItem('logitest-preferences')
      if (stored) setPreferences({ ...defaultPreferences, ...JSON.parse(stored) as Partial<Preferences> })
    } catch {
      setError('Saved settings could not be read from this browser.')
    }
  }, [])

  useEffect(() => {
    let active = true
    setError('')
    setMessage('')
    if (page === 'orders' || page === 'settings') {
      setLoading(false)
      return () => {
        active = false
      }
    }

    setLoading(true)
    const load = async () => {
      try {
        if (page === 'inventory') {
          const [productData, warehouseData, movementData] = await Promise.all([
            productsApi.list(),
            inventoryApi.listWarehouses(),
            inventoryApi.listMovements(),
          ])
          if (active) {
            setProducts(productData)
            setWarehouses(warehouseData)
            setMovements(movementData)
            setMovementForm((current) => ({
              ...current,
              product_id: current.product_id || productData[0]?.id || 0,
              warehouse_id: current.warehouse_id || warehouseData[0]?.id || 0,
            }))
          }
        } else if (page === 'warehouses') {
          const warehouseData = await inventoryApi.listWarehouses()
          if (active) setWarehouses(warehouseData)
        } else if (page === 'analytics') {
          const result = await inventoryApi.analytics(preferences.lowStockThreshold)
          if (active) setAnalytics(result)
        }
      } catch (loadError) {
        if (active) setError(getErrorMessage(loadError))
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [page, preferences.lowStockThreshold])

  const submitMovement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      await inventoryApi.createMovement(movementForm)
      const [productData, movementData] = await Promise.all([
        productsApi.list(),
        inventoryApi.listMovements(),
      ])
      setProducts(productData)
      setMovements(movementData)
      setMessage('Stock movement saved and product quantity updated.')
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    }
  }

  const submitWarehouse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      await inventoryApi.createWarehouse(warehouseForm)
      setWarehouses(await inventoryApi.listWarehouses())
      setWarehouseForm({ name: '', location: '' })
      setMessage('Warehouse saved successfully.')
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    }
  }

  const savePreferences = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSaved(false)
    try {
      localStorage.setItem('logitest-preferences', JSON.stringify(preferences))
      setSaved(true)
    } catch {
      setError('Settings could not be saved in this browser.')
    }
  }

  const headings: Record<typeof page, [string, string]> = {
    inventory: ['Inventory', 'Record stock received and dispatched against products and warehouses.'],
    warehouses: ['Warehouses', 'Manage warehouse records and review their stock movement history.'],
    orders: ['Orders', 'Order management is not connected to an API or database yet.'],
    analytics: ['Analytics', 'Product and inventory metrics are calculated from SQLite records.'],
    settings: ['Settings', 'Manage workspace and low-stock alert preferences.'],
  }
  const heading = headings[page]

  return (
    <section className="container mx-auto px-8 py-8">
      <div className="mb-6">
        <p className="text-sm text-primary-300">{preferences.workspaceName}</p>
        <h1 className="mt-1 text-3xl font-bold text-white">{heading[0]}</h1>
        <p className="mt-2 text-gray-400">{heading[1]}</p>
      </div>
      {error && <div role="alert" className="mb-5 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-300">{error}</div>}
      {message && <div role="status" className="mb-5 rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-green-300">{message}</div>}
      {loading && <p className="text-gray-400">Loading data...</p>}

      {!loading && page === 'inventory' && (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <MetricCard title="Product types" value={products.length} icon="📦" />
            <MetricCard title="Total stock units" value={products.reduce((sum, product) => sum + product.quantity, 0)} icon="🏭" />
            <MetricCard title="Recorded movements" value={movements.length} icon="↕️" />
          </div>
          <form onSubmit={submitMovement} className="mb-6 rounded-xl border border-gray-700 bg-gray-800/70 p-5">
            <h2 className="mb-4 font-semibold text-white">Record a stock movement</h2>
            {warehouses.length === 0 && <p className="mb-4 text-sm text-orange-300">Create at least one warehouse on the Warehouses screen first.</p>}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <label className="text-sm text-gray-300">Product
                <select required value={movementForm.product_id || ''} onChange={(event) => setMovementForm((current) => ({ ...current, product_id: Number(event.target.value) }))} className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white">
                  <option value="" disabled>Select a product</option>
                  {products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.quantity})</option>)}
                </select>
              </label>
              <label className="text-sm text-gray-300">Warehouse
                <select required disabled={!warehouses.length} value={movementForm.warehouse_id || ''} onChange={(event) => setMovementForm((current) => ({ ...current, warehouse_id: Number(event.target.value) }))} className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white">
                  <option value="" disabled>Select a warehouse</option>
                  {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                </select>
              </label>
              <label className="text-sm text-gray-300">Movement type
                <select value={movementForm.movement_type} onChange={(event) => setMovementForm((current) => ({ ...current, movement_type: event.target.value as 'inbound' | 'outbound' }))} className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white">
                  <option value="inbound">Stock received</option>
                  <option value="outbound">Stock dispatched</option>
                </select>
              </label>
              <label className="text-sm text-gray-300">Quantity
                <input type="number" min="1" step="1" required value={movementForm.quantity} onChange={(event) => setMovementForm((current) => ({ ...current, quantity: Number(event.target.value) }))} className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white" />
              </label>
              <label className="text-sm text-gray-300">Note
                <input maxLength={500} value={movementForm.note} onChange={(event) => setMovementForm((current) => ({ ...current, note: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white" />
              </label>
            </div>
            <button type="submit" disabled={!products.length || !warehouses.length} className="mt-4 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">Save movement</button>
            <p className="mt-3 text-xs text-gray-500">Quantities update the product's total stock. The warehouse records where a movement took place; on-hand stock is not yet tracked separately per warehouse.</p>
          </form>
          <DataTable title="Movement history" empty="No stock movements recorded yet." hasRows={movements.length > 0}>
            <thead className="text-xs uppercase tracking-wide text-gray-400"><tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Product</th><th className="px-5 py-3">Warehouse</th><th className="px-5 py-3">Movement</th><th className="px-5 py-3 text-right">Change</th><th className="px-5 py-3 text-right">New stock</th></tr></thead>
            <tbody className="divide-y divide-gray-700">
              {movements.map((movement) => (
                <tr key={movement.id}>
                  <td className="px-5 py-4 text-gray-400">{new Date(movement.created_at).toLocaleString()}</td>
                  <td className="px-5 py-4 text-white">{movement.product_name}<span className="ml-2 font-mono text-xs text-gray-500">{movement.product_sku}</span></td>
                  <td className="px-5 py-4 text-gray-300">{movement.warehouse_name}</td>
                  <td className="px-5 py-4 text-gray-300">{movement.movement_type === 'inbound' ? 'Received' : 'Dispatched'}{movement.note ? ` · ${movement.note}` : ''}</td>
                  <td className={`px-5 py-4 text-right ${movement.movement_type === 'inbound' ? 'text-green-300' : 'text-orange-300'}`}>{movement.movement_type === 'inbound' ? '+' : '−'}{movement.quantity}</td>
                  <td className="px-5 py-4 text-right text-white">{movement.new_quantity}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          <div className="mt-6 rounded-xl border border-gray-700 bg-gray-800/70 p-5">
            <h2 className="font-semibold text-white">Current product stock</h2>
            <div className="mt-3 flex flex-wrap gap-2">{products.map((product) => <span key={product.id} className="rounded-lg bg-gray-700 px-3 py-2 text-sm text-gray-200">{product.name}: {product.quantity}</span>)}</div>
            {products.length === 0 && <p className="mt-2 text-sm text-gray-400">Add a product on the Products screen first.</p>}
          </div>
        </>
      )}

      {!loading && page === 'warehouses' && (
        <>
          <form onSubmit={submitWarehouse} className="mb-6 max-w-2xl rounded-xl border border-gray-700 bg-gray-800/70 p-5">
            <h2 className="mb-4 font-semibold text-white">Add a warehouse</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-gray-300">Warehouse name *
                <input required maxLength={120} value={warehouseForm.name} onChange={(event) => setWarehouseForm((current) => ({ ...current, name: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white" />
              </label>
              <label className="text-sm text-gray-300">Location
                <input maxLength={200} value={warehouseForm.location} onChange={(event) => setWarehouseForm((current) => ({ ...current, location: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white" />
              </label>
            </div>
            <button type="submit" className="mt-4 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-500">Save warehouse</button>
          </form>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {warehouses.map((warehouse) => (
              <article key={warehouse.id} className="rounded-xl border border-gray-700 bg-gray-800/70 p-5">
                <div className="flex items-start justify-between"><div><h2 className="font-semibold text-white">{warehouse.name}</h2><p className="mt-1 text-sm text-gray-400">{warehouse.location || 'No location specified'}</p></div><span className="text-2xl" aria-hidden="true">🏭</span></div>
                <p className="mt-5 text-sm text-gray-300">{warehouse.movement_count} recorded stock movements</p>
              </article>
            ))}
            {warehouses.length === 0 && <p className="text-gray-400">No warehouses yet. Add one to record stock movements.</p>}
          </div>
          <p className="mt-5 text-sm text-gray-500">Warehouse records are saved to SQLite. Stock totals are tracked per product; movements record the warehouse, but on-hand quantities are not yet split by warehouse.</p>
        </>
      )}

      {!loading && page === 'analytics' && analytics && (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard title="Products" value={analytics.products_count} icon="📦" />
            <MetricCard title="Total stock units" value={analytics.units_in_stock.toLocaleString()} icon="🏭" />
            <MetricCard title="Inventory value" value={analytics.inventory_value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })} icon="💰" />
            <MetricCard title={`Low stock (≤ ${preferences.lowStockThreshold})`} value={preferences.stockAlerts ? analytics.low_stock_count : 0} icon="⚠️" />
            <MetricCard title="Product categories" value={analytics.categories_count} icon="🗂️" />
            <MetricCard title="Stock movements" value={analytics.stock_movements_count} icon="↕️" />
          </div>
          <p className="text-sm text-gray-500">Metrics are calculated by the API from SQLite records.</p>
        </>
      )}

      {page === 'settings' && (
        <form onSubmit={savePreferences} className="max-w-2xl rounded-xl border border-gray-700 bg-gray-800/70 p-6">
          <h2 className="text-lg font-semibold text-white">Workspace preferences</h2>
          <p className="mt-1 text-sm text-gray-400">These preferences are saved in this browser's localStorage only; they are not stored in SQLite or linked to an account.</p>
          <label className="mt-5 block text-sm text-gray-300">Workspace name
            <input value={preferences.workspaceName} onChange={(event) => setPreferences((current) => ({ ...current, workspaceName: event.target.value }))} maxLength={100} required className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500" />
          </label>
          <label className="mt-4 block text-sm text-gray-300">Low-stock threshold (units)
            <input type="number" min="0" step="1" value={preferences.lowStockThreshold} onChange={(event) => setPreferences((current) => ({ ...current, lowStockThreshold: Number(event.target.value) }))} className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500" />
          </label>
          <label className="mt-4 flex items-center gap-3 text-sm text-gray-300">
            <input type="checkbox" checked={preferences.stockAlerts} onChange={(event) => setPreferences((current) => ({ ...current, stockAlerts: event.target.checked }))} className="h-4 w-4 accent-blue-500" />
            Enable low-stock alerts
          </label>
          <div className="mt-6 flex items-center gap-4">
            <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-500">Save settings</button>
            {saved && <span role="status" className="text-sm text-green-300">Settings saved.</span>}
          </div>
        </form>
      )}
    </section>
  )
}

function DataTable({ title, empty, hasRows, children }: { title: string; empty: string; hasRows: boolean; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800/70">
      <div className="border-b border-gray-700 p-5"><h2 className="font-semibold text-white">{title}</h2></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left">
          {children}
          {!hasRows && <tbody><tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">{empty}</td></tr></tbody>}
        </table>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon }: { title: string; value: string | number; icon: string }) {
  return (
    <article className="rounded-xl border border-gray-700 bg-gray-800/70 p-5">
      <div className="flex items-center justify-between text-gray-400"><span>{title}</span><span className="text-2xl" aria-hidden="true">{icon}</span></div>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
    </article>
  )
}

export default WorkspacePage
