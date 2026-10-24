import { useEffect, useState, type FormEvent } from 'react'
import axios from 'axios'
import { productsApi } from '../services/products'
import type { Product, ProductInput } from '../types/product'

const emptyProduct: ProductInput = {
  name: '',
  sku: '',
  description: '',
  category: '',
  quantity: 0,
  price: 0,
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail: unknown = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg).filter(Boolean).join(' ')
    }
    if (!error.response) return 'Could not connect to the API. Check that the backend is running.'
  }
  return 'The operation failed. Please try again.'
}

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductInput>(emptyProduct)

  useEffect(() => {
    let active = true
    const loadProducts = async () => {
      setLoading(true)
      setError('')
      try {
        const result = await productsApi.list(search.trim())
        if (active) setProducts(result)
      } catch (loadError) {
        if (active) setError(getErrorMessage(loadError))
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadProducts()
    return () => {
      active = false
    }
  }, [search, refreshKey])

  const openCreateForm = () => {
    setEditingProduct(null)
    setForm(emptyProduct)
    setMessage('')
    setFormOpen(true)
  }

  const openEditForm = (product: Product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      sku: product.sku,
      description: product.description ?? '',
      category: product.category ?? '',
      quantity: product.quantity,
      price: product.price,
    })
    setMessage('')
    setFormOpen(true)
  }

  const submitProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, form)
        setMessage('Product updated successfully.')
      } else {
        await productsApi.create(form)
        setMessage('Product created successfully.')
      }
      setFormOpen(false)
      setRefreshKey((current) => current + 1)
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}" (${product.sku})?`)) return
    setError('')
    setMessage('')
    try {
      await productsApi.remove(product.id)
      setMessage('Product deleted successfully.')
      setRefreshKey((current) => current + 1)
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    }
  }

  const updateForm = (field: keyof ProductInput, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <section className="container mx-auto px-8 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-primary-300">Inventory management</p>
          <h1 className="mt-1 text-3xl font-bold text-white">Products</h1>
          <p className="mt-2 text-gray-400">Manage your catalog and stock in one place.</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500"
        >
          + Add product
        </button>
      </div>

      {error && <div role="alert" className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-300">{error}</div>}
      {message && <div role="status" className="mb-4 rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-green-300">{message}</div>}

      {formOpen && (
        <form onSubmit={submitProduct} className="mb-6 rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">{editingProduct ? 'Edit product' : 'New product'}</h2>
            <button type="button" onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-white" aria-label="Close form">✕</button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm text-gray-300">
              Product name *
              <input required maxLength={200} value={form.name} onChange={(event) => updateForm('name', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500" />
            </label>
            <label className="text-sm text-gray-300">
              SKU *
              <input required maxLength={50} value={form.sku} onChange={(event) => updateForm('sku', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500" />
            </label>
            <label className="text-sm text-gray-300">
              Category
              <input maxLength={100} value={form.category} onChange={(event) => updateForm('category', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500" />
            </label>
            <label className="text-sm text-gray-300">
              Quantity *
              <input required type="number" min="0" step="1" value={form.quantity} readOnly={Boolean(editingProduct)} onChange={(event) => updateForm('quantity', Number(event.target.value))} className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500 read-only:cursor-not-allowed read-only:opacity-60" />
              {editingProduct && <span className="mt-1 block text-xs text-gray-500">Change stock using the movement form on the Inventory screen.</span>}
            </label>
            <label className="text-sm text-gray-300">
              Price *
              <input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateForm('price', Number(event.target.value))} className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500" />
            </label>
            <label className="text-sm text-gray-300 md:col-span-2 lg:col-span-1">
              Description
              <input value={form.description} onChange={(event) => updateForm('description', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500" />
            </label>
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-700">Cancel</button>
            <button disabled={saving} type="submit" className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? 'Saving...' : editingProduct ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800/70 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-700 p-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Product catalog</h2>
            <p className="mt-1 text-sm text-gray-400">{products.length} product{products.length === 1 ? '' : 's'}</p>
          </div>
          <label className="w-full sm:w-80">
            <span className="sr-only">Search products by name or SKU</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or SKU..." className="w-full rounded-lg border border-gray-600 bg-gray-900 px-4 py-2 text-white outline-none focus:border-blue-500" />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-gray-900/60 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">SKU</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4 text-right">Stock</th>
                <th className="px-5 py-4 text-right">Price</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Loading products...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">{search ? 'No products match your search.' : 'No products yet. Add your first product to get started.'}</td></tr>
              ) : products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-700/40">
                  <td className="px-5 py-4">
                    <p className="font-medium text-white">{product.name}</p>
                    {product.description && <p className="mt-1 max-w-xs truncate text-sm text-gray-400">{product.description}</p>}
                  </td>
                  <td className="px-5 py-4 font-mono text-sm text-gray-300">{product.sku}</td>
                  <td className="px-5 py-4 text-gray-300">{product.category || '—'}</td>
                  <td className="px-5 py-4 text-right font-medium text-white">{product.quantity}</td>
                  <td className="px-5 py-4 text-right text-gray-200">{product.price.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                  <td className="px-5 py-4 text-right">
                    <button type="button" onClick={() => openEditForm(product)} className="mr-3 text-sm font-medium text-blue-400 hover:text-blue-300">Edit</button>
                    <button type="button" onClick={() => void deleteProduct(product)} className="text-sm font-medium text-red-400 hover:text-red-300">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default ProductsPage
