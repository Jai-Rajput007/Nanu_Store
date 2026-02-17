'use client'

import { useEffect, useState, useCallback, memo } from 'react'
import Image from 'next/image'
import { Plus, Search, Edit2, Trash2, Filter, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatPrice, getCategoryColor, cn } from '@/lib/utils'
import { Category, Product } from '@/types'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { uploadProductImage } from '@/lib/storage'
import { toast } from 'sonner'

const supabase = createBrowserSupabaseClient()

type CategoryRecord = {
  id: string
  name: string
  name_hindi?: string
  icon?: string
}

const initialProductState = {
  name: '',
  name_hindi: '',
  category: '' as Category,
  price: '',
  unit: 'kg',
  description: '',
  featured: false,
}

// Extracted ProductForm component to prevent re-renders causing focus loss
interface ProductFormProps {
  productForm: typeof initialProductState
  setProductForm: React.Dispatch<React.SetStateAction<typeof initialProductState>>
  imagePreview: string | null
  setProductImage: (file: File | null) => void
  setImagePreview: (url: string | null) => void
  categoriesList: CategoryRecord[]
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  submitting: boolean
  title: string
}

const ProductForm = memo(function ProductForm({
  productForm,
  setProductForm,
  imagePreview,
  setProductImage,
  setImagePreview,
  categoriesList,
  onSubmit,
  onClose,
  submitting,
  title,
}: ProductFormProps) {
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }
      setProductImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Product Image</label>
        <div className="flex items-center gap-4">
          {imagePreview ? (
            <div className="relative w-24 h-24">
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                className="object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => { setProductImage(null); setImagePreview(null) }}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <label className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors">
              <Upload className="w-6 h-6 text-slate-400" />
              <span className="text-xs text-slate-500 mt-1">Upload</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
          <div className="text-sm text-slate-500">
            <p>Max size: 5MB</p>
            <p>Formats: JPG, PNG</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Name (English) *</label>
          <input
            type="text"
            value={productForm.name}
            onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Name (Hindi)</label>
          <input
            type="text"
            value={productForm.name_hindi}
            onChange={(e) => setProductForm(prev => ({ ...prev, name_hindi: e.target.value }))}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Category *</label>
          <select
            value={productForm.category}
            onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value as Category }))}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">Select Category</option>
            {categoriesList.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Unit</label>
          <select
            value={productForm.unit}
            onChange={(e) => setProductForm(prev => ({ ...prev, unit: e.target.value }))}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="kg">kg</option>
            <option value="g">g</option>
            <option value="liter">liter</option>
            <option value="ml">ml</option>
            <option value="pack">pack</option>
            <option value="piece">piece</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Price (₹) *</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={productForm.price}
          onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
          className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={productForm.description}
          onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="featured"
          checked={productForm.featured}
          onChange={(e) => setProductForm(prev => ({ ...prev, featured: e.target.checked }))}
          className="w-4 h-4 text-indigo-600 rounded"
        />
        <label htmlFor="featured" className="text-sm text-slate-700">Featured Product</label>
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={submitting}>
          {title}
        </Button>
      </div>
    </form>
  )
})

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [categoriesList, setCategoriesList] = useState<CategoryRecord[]>([])
  
  // Product form state
  const [productForm, setProductForm] = useState(initialProductState)
  const [productImage, setProductImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  // Category form state
  const [newCatName, setNewCatName] = useState('')
  const [newCatNameHindi, setNewCatNameHindi] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('')
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)

  // Fetch products and categories
  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setProducts(data as Product[])
      }
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('name')
      if (!error && data) setCategoriesList(data as CategoryRecord[])
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.name_hindi?.includes(searchTerm)
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const resetForm = () => {
    setProductForm(initialProductState)
    setProductImage(null)
    setImagePreview(null)
    setEditingProduct(null)
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productForm.name || !productForm.category || !productForm.price) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      let imageUrl = null
      
      // Upload image if selected
      if (productImage) {
        const tempId = 'temp-' + Date.now()
        imageUrl = await uploadProductImage(productImage, tempId)
      }

      const { data: newProduct, error } = await supabase
        .from('products')
        .insert({
          name: productForm.name,
          name_hindi: productForm.name_hindi,
          category: productForm.category,
          price: Number(productForm.price),
          unit: productForm.unit,
          stock: 999999, // Unlimited stock
          description: productForm.description,
          featured: productForm.featured,
          image_url: imageUrl,
        })
        .select()
        .single()

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Product added successfully!')
      setIsAddModalOpen(false)
      resetForm()
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    setSubmitting(true)
    try {
      let imageUrl = editingProduct.image_url
      
      // Upload new image if selected
      if (productImage) {
        imageUrl = await uploadProductImage(productImage, editingProduct.id)
      }

      const { error } = await supabase
        .from('products')
        .update({
          name: productForm.name,
          name_hindi: productForm.name_hindi,
          category: productForm.category,
          price: Number(productForm.price),
          unit: productForm.unit,
          description: productForm.description,
          featured: productForm.featured,
          image_url: imageUrl,
        })
        .eq('id', editingProduct.id)

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Product updated successfully!')
      setIsEditModalOpen(false)
      resetForm()
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return
    }

    try {
      const { error } = await supabase.from('products').delete().eq('id', product.id)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Product deleted successfully!')
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product')
    }
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      name_hindi: product.name_hindi || '',
      category: product.category,
      price: String(product.price),
      unit: product.unit,
      description: product.description || '',
      featured: product.featured,
    })
    setImagePreview(product.image_url || null)
    setIsEditModalOpen(true)
  }

  const handleAddCategory = async () => {
    const id = newCatName.trim().toLowerCase().replace(/\s+/g, '-')
    if (!id || !newCatName.trim()) return

    try {
      const { error } = await supabase.from('categories').insert([{
        id,
        name: newCatName.trim(),
        name_hindi: newCatNameHindi.trim(),
        icon: newCatIcon.trim(),
      }])
      
      if (!error) {
        setCategoriesList(prev => [...prev, {
          id,
          name: newCatName.trim(),
          name_hindi: newCatNameHindi.trim(),
          icon: newCatIcon.trim(),
        }])
        setNewCatName('')
        setNewCatNameHindi('')
        setNewCatIcon('')
        toast.success('Category added successfully!')
      } else {
        toast.error(error.message || 'Failed to add category')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error adding category')
    }
  }

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"?`)) return

    setDeletingCategoryId(categoryId)
    try {
      const { error } = await supabase.from('categories').delete().eq('id', categoryId)
      if (!error) {
        setCategoriesList(prev => prev.filter(c => c.id !== categoryId))
        toast.success('Category deleted successfully!')
      } else {
        toast.error(error.message || 'Failed to delete category')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting category')
    } finally {
      setDeletingCategoryId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-600">Manage your products</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddCategoryOpen(true)} variant="outline">
            Manage Categories
          </Button>
          <Button onClick={() => { resetForm(); setIsAddModalOpen(true) }}>
            <Plus className="w-4 h-4 mr-1" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
          >
            <option value="All">All Categories</option>
            {categoriesList.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      No products found. Add your first product!
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 bg-slate-100 rounded-lg overflow-hidden">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                                No Img
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{product.name}</p>
                            <p className="text-sm text-slate-500">{product.name_hindi}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-1 text-xs rounded-full', getCategoryColor(product.category))}>
                          {categoriesList.find(c => c.id === product.category)?.name || product.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{formatPrice(product.price)}</p>
                        <p className="text-sm text-slate-500">/{product.unit}</p>
                      </td>
                      <td className="px-4 py-3">
                        {product.featured ? (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">Featured</span>
                        ) : (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">Regular</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Product</h2>
            <ProductForm
              productForm={productForm}
              setProductForm={setProductForm}
              imagePreview={imagePreview}
              setProductImage={setProductImage}
              setImagePreview={setImagePreview}
              categoriesList={categoriesList}
              onSubmit={handleAddProduct}
              onClose={() => setIsAddModalOpen(false)}
              submitting={submitting}
              title="Add Product"
            />
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Product</h2>
            <ProductForm
              productForm={productForm}
              setProductForm={setProductForm}
              imagePreview={imagePreview}
              setProductImage={setProductImage}
              setImagePreview={setImagePreview}
              categoriesList={categoriesList}
              onSubmit={handleEditProduct}
              onClose={() => setIsEditModalOpen(false)}
              submitting={submitting}
              title="Save Changes"
            />
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Manage Categories</h2>
            <div className="space-y-3">
              <input
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                placeholder="Emoji (e.g. 🌾)"
                className="w-full p-2 border rounded"
              />
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category name (English)"
                className="w-full p-2 border rounded"
              />
              <input
                value={newCatNameHindi}
                onChange={(e) => setNewCatNameHindi(e.target.value)}
                placeholder="Category name (Hindi)"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>Close</Button>
              <Button onClick={handleAddCategory}>Add Category</Button>
            </div>
            <div className="mt-6">
              <h3 className="font-medium mb-3 text-slate-900">Existing categories ({categoriesList.length})</h3>
              <div className="space-y-2 max-h-64 overflow-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
                {categoriesList.length > 0 ? (
                  categoriesList.map(c => (
                    <div key={c.id} className="flex items-center justify-between border border-slate-200 rounded-lg p-3 bg-white">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{c.icon || '◻️'}</span>
                        <div>
                          <div className="font-medium text-slate-900">{c.name}</div>
                          <div className="text-sm text-slate-500">{c.name_hindi || '-'}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(c.id, c.name)}
                        disabled={deletingCategoryId === c.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">No categories yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
