import { useState, useEffect } from 'react'
import axios from 'axios'
import { useCallback, useMemo } from 'react'
import ProductsPage from './components/ProductsPage'
import OrdersPage from './components/OrdersPage'
import WorkspacePage, { type AppSection } from './components/WorkspacePage'
import { productsApi } from './services/products'
import type { Product } from './types/product'

function App() {
  const [page, setPage] = useState<AppSection>('dashboard')
  const [healthStatus, setHealthStatus] = useState<string>('Checking...')
  const [dbStatus, setDbStatus] = useState<string>('Checking...')
  const [products, setProducts] = useState<Product[]>([])
  const [dashboardError, setDashboardError] = useState('')
  const [lowStockThreshold, setLowStockThreshold] = useState(10)
  const unitsInStock = products.reduce((sum, product) => sum + product.quantity, 0)
  const inventoryValue = products.reduce((sum, product) => sum + product.quantity * product.price, 0)
  const lowStock = products.filter((product) => product.quantity <= lowStockThreshold)
  const categoriesCount = new Set(products.map((product) => product.category).filter(Boolean)).size

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await axios.get('/api/v1/health')
        setHealthStatus(response.data.status)
        setDbStatus(response.data.database)
      } catch (error) {
        setHealthStatus('Error')
        setDbStatus('Disconnected')
      }
    }
    checkHealth()
  }, [])

  const loadDashboardProducts = useCallback(async () => {
    try {
      setProducts(await productsApi.list())
      setDashboardError('')
    } catch {
      setDashboardError('Product and inventory summary could not be loaded from the API.')
    }
  }, [])

  useEffect(() => {
    void loadDashboardProducts()
  }, [loadDashboardProducts, page])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('logitest-preferences')
      if (!stored) return
      const preferences: unknown = JSON.parse(stored)
      if (typeof preferences === 'object' && preferences !== null && 'lowStockThreshold' in preferences) {
        const value = preferences.lowStockThreshold
        if (typeof value === 'number' && Number.isInteger(value) && value >= 0) setLowStockThreshold(value)
      }
    } catch {
      setDashboardError('Saved settings could not be read from this browser.')
    }
  }, [page])

  const dashboardMetrics = useMemo(() => [
    { title: 'Products', value: products.length, icon: '📦' },
    { title: 'Units in stock', value: unitsInStock.toLocaleString(), icon: '🏭' },
    { title: 'Inventory value', value: inventoryValue.toLocaleString(undefined, { style: 'currency', currency: 'USD' }), icon: '💰' },
    { title: 'Low stock (≤ 10)', value: lowStock.length, icon: '⚠️' },
  ], [inventoryValue, lowStock.length, products.length, unitsInStock])

  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-primary-900 flex flex-col fixed h-full">
        <div className="p-6 border-b border-primary-700">
          <h1 className="text-2xl font-bold text-white">LogiTest Pro</h1>
          <p className="text-sm text-primary-300 mt-1">Logistics Management</p>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {([
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'products', label: 'Products', icon: '📦' },
              { id: 'inventory', label: 'Inventory', icon: '📋' },
              { id: 'warehouses', label: 'Warehouses', icon: '🏭' },
              { id: 'orders', label: 'Orders', icon: '🧾' },
              { id: 'analytics', label: 'Analytics', icon: '📈' },
              { id: 'settings', label: 'Settings', icon: '⚙️' },
            ] satisfies { id: AppSection; label: string; icon: string }[]).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setPage(item.id)}
                  aria-current={page === item.id ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                    page === item.id ? 'bg-primary-700 text-white' : 'text-primary-300 hover:bg-primary-800'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-primary-700">
          <div className="relative rounded-xl overflow-hidden h-24 mb-3">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 to-primary-700/50"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl mb-1">🚛</div>
                <p className="text-white font-bold text-sm">LogiTest Pro</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              AT
            </div>
            <div>
              <p className="text-white font-medium">Alper Türk</p>
              <p className="text-xs text-primary-300">Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {page === 'dashboard' ? (
          <>
        {/* Hero Banner */}
        <div className="relative h-72 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/95 via-primary-800/85 to-primary-700/75"></div>
          </div>
          
          <div className="relative container mx-auto px-8 h-full flex items-center">
            <div className="text-white max-w-2xl">
              <p className="text-lg text-primary-200 mb-2">Welcome back,</p>
              <h1 className="text-4xl md:text-5xl font-bold mb-3">Alper Türk</h1>
              <h2 className="text-2xl md:text-3xl font-semibold mb-2 text-primary-100">Smart Logistics. Real-Time Visibility.</h2>
              <p className="text-base text-primary-200">Professional Logistics Management System with advanced tracking and analytics</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-8 py-8">
          {/* KPI Cards */}
          {dashboardError && <div role="alert" className="mb-5 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-300">{dashboardError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {dashboardMetrics.map((metric) => (
              <div key={metric.title} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg hover:shadow-xl hover:border-blue-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">{metric.title}</h3>
                  <span className="text-3xl">{metric.icon}</span>
                </div>
                <p className="text-4xl font-bold text-white">{metric.value}</p>
                <p className="text-gray-400 text-sm mt-2">SQLite data</p>
              </div>
            ))}
          </div>

          {/* Active Shipments */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">🚚 Shipment Preview</h3>
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">Sample data</span>
            </div>
            <div className="space-y-4">
              {[
                { id: 'LTX-4592', route: 'Warehouse A → DC B', progress: 75, eta: '2h 15m', status: 'on-time' },
                { id: 'LTX-4593', route: 'Warehouse C → DC A', progress: 45, eta: '4h 30m', status: 'delayed' },
                { id: 'LTX-4594', route: 'Warehouse B → DC C', progress: 90, eta: '45m', status: 'on-time' }
              ].map((shipment) => (
                <div key={shipment.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🚚</span>
                      <div>
                        <p className="text-white font-medium">Truck #{shipment.id}</p>
                        <p className="text-sm text-gray-400">{shipment.route}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{shipment.progress}%</p>
                      <p className="text-sm text-gray-400">ETA: {shipment.eta}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        shipment.status === 'on-time' ? 'bg-gradient-to-r from-green-400 to-blue-500' : 'bg-gradient-to-r from-yellow-400 to-orange-500'
                      }`}
                      style={{ width: `${shipment.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      shipment.status === 'on-time' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {shipment.status === 'on-time' ? 'On Time' : 'Delayed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-4 text-center">Demo Data</p>
          </div>

          {/* Delivery Route with Animation */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">📍 Delivery Route</h3>
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">Sample route</span>
            </div>
            <div className="relative bg-gray-700/50 rounded-lg p-6 border border-gray-600/50 overflow-hidden">
              {/* Route Line */}
              <div className="absolute top-1/2 left-4 right-4 h-1 bg-gray-600 rounded -translate-y-1/2"></div>
              
              {/* Route Points */}
              <div className="relative flex justify-between items-center">
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">A</div>
                  <p className="text-white text-sm mt-2 font-medium">Warehouse A</p>
                  <p className="text-gray-400 text-xs">09:00 AM</p>
                </div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-sm">B</div>
                  <p className="text-white text-sm mt-2 font-medium">DC B</p>
                  <p className="text-gray-400 text-xs">11:15 AM</p>
                </div>
              </div>

              {/* Animated Truck */}
              <div className="absolute top-1/2 left-0 -translate-y-1/2 animate-truck" style={{ animationDuration: '10s' }}>
                <div className="text-3xl">🚛</div>
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-4 text-center">Demo Data - Live tracking coming soon</p>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Warehouse Capacity */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4">🏭 Stock health</h3>
              <div className="relative pt-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="#374151"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="#10B981"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(products.length ? (products.length - lowStock.length) / products.length : 0) * 440} 440`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">{products.length ? Math.round((products.length - lowStock.length) / products.length * 100) : 0}%</span>
                    </div>
                  </div>
                </div>
                <div className="text-center text-gray-400 text-sm">Products above low-stock threshold</div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4">⚡ System Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌐</span>
                    <span className="text-white">API Status</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${healthStatus === 'healthy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {healthStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🗄️</span>
                    <span className="text-white">Database</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${dbStatus === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {dbStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔒</span>
                    <span className="text-white">Security</span>
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4">🗂️ Catalog Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between rounded-lg bg-gray-700 p-3"><span className="text-gray-300">Categories</span><span className="font-medium text-white">{categoriesCount}</span></div>
                <div className="flex justify-between rounded-lg bg-gray-700 p-3"><span className="text-gray-300">Products with stock</span><span className="font-medium text-white">{products.filter((product) => product.quantity > 0).length}</span></div>
                <div className="flex justify-between rounded-lg bg-gray-700 p-3"><span className="text-gray-300">Orders saved</span><span className="font-medium text-yellow-300">Not available</span></div>
              </div>
              <p className="text-gray-500 text-xs mt-4 text-center">Catalog values are loaded from the API.</p>
            </div>
          </div>

          {/* Critical Stock Table */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">⚠️ Low stock (≤ {lowStockThreshold})</h3>
              <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">Requires Attention</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Product</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">SKU</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Current Stock</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Alert Threshold</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((item) => (
                    <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                      <td className="py-3 px-4 text-white">{item.name}</td>
                      <td className="py-3 px-4 text-gray-300">{item.sku}</td>
                      <td className="py-3 px-4 text-white font-medium">{item.quantity}</td>
                      <td className="py-3 px-4 text-gray-300">{lowStockThreshold}</td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300">
                          Low stock
                        </span>
                      </td>
                    </tr>
                  ))}
                  {lowStock.length === 0 && <tr><td colSpan={5} className="py-8 px-4 text-center text-gray-400">No products are at or below the threshold.</td></tr>}
                </tbody>
              </table>
            </div>
            <p className="text-gray-500 text-xs mt-4 text-center">Real product quantities; alert threshold is currently 10 units.</p>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm mt-8">
            <p>LogiTest Pro - Logistics Management System</p>
            <p className="mt-1">Version 1.0.0 | Status: Development</p>
          </div>
        </div>
          </>
        ) : page === 'products' ? (
          <ProductsPage />
        ) : page === 'orders' ? (
          <OrdersPage />
        ) : (
          <WorkspacePage page={page} />
        )}
      </div>
      
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .animate-truck {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export default App
