 'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Filter, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import ProductCard from '@/components/ProductCard'
import { Category, Product } from '@/types'
import { getCategoryName, cn } from '@/lib/utils'
import { createBrowserSupabaseClient } from '@/lib/supabase'

const supabase = createBrowserSupabaseClient()

type CategoryRecord = { id: string; name: string }


const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
]

function ShopContent() {
  const searchParams = useSearchParams()
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [sortBy, setSortBy] = useState('featured')
  const [showFilters, setShowFilters] = useState(false)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<CategoryRecord[]>([])

  // Get category from URL
  const categoryParam = searchParams.get('category')
  const featuredParam = searchParams.get('featured')

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
      
      if (!error && data) {
        setAllProducts(data as Product[])
      }
      setLoading(false)
    }

    fetchProducts()
  }, [])

  // Fetch categories from Supabase
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase.from('categories').select('id,name').order('name')
        if (!error && data) setCategories(data as CategoryRecord[])
        else setCategories([])
      } catch (err) {
        setCategories([])
      }
    }
    fetchCategories()
  }, [])

  // Filter and sort products
  useEffect(() => {
    let filtered = [...allProducts]

    // Filter by category from URL
    if (categoryParam) {
      filtered = filtered.filter(p => p.category === categoryParam)
    }

    // Filter by featured
    if (featuredParam === 'true') {
      filtered = filtered.filter(p => p.featured)
    }

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(p => selectedCategories.includes(p.category))
    }

    // Filter by price range
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])

    // Sort
    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      default:
        // Keep featured first
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    }

    setFilteredProducts(filtered)
  }, [categoryParam, featuredParam, selectedCategories, priceRange, sortBy, allProducts])

  // Keep UI checkbox state in sync when navigating with `?category=` link
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategories([categoryParam])
    }
  }, [categoryParam])

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setPriceRange([0, 500])
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 pt-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {categoryParam ? getCategoryName(categoryParam) : featuredParam ? 'Featured Products' : 'All Products'}
        </h1>
        <p className="mt-2 text-slate-600">
          {filteredProducts.length} products available
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg"
        >
          <Filter className="w-4 h-4" />
          Filters
          {selectedCategories.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
              {selectedCategories.length}
            </span>
          )}
        </button>

        {/* Sidebar Filters */}
        <aside className={cn(
          'lg:w-64 space-y-6',
          showFilters ? 'block' : 'hidden lg:block'
        )}>
          {/* Categories */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Categories</h3>
            <div className="space-y-2">
                {categories.length > 0 ? categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">{category.name}</span>
                  </label>
                )) : (
                  <div className="text-sm text-slate-500">No categories</div>
                )}
            </div>
          </div>

          {/* Price Range */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Price Range</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">₹{priceRange[0]}</span>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="flex-1"
                />
                <span className="text-sm text-slate-600">₹{priceRange[1]}</span>
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {(selectedCategories.length > 0 || priceRange[1] < 500) && (
            <button
              onClick={clearFilters}
              className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {/* Sort & Results */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-slate-600">
              Showing {filteredProducts.length} results
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Products */}
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <div className="w-8 h-8 bg-slate-300 rounded" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Loading products...</h3>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No products found</h3>
              <p className="text-slate-600 mt-2">Try adjusting your filters</p>
              <Button onClick={clearFilters} variant="outline" className="mt-4">
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 pt-24">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-slate-300 rounded" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">Loading...</h3>
        </div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  )
}
