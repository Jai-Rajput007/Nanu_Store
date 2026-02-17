'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Minus, Plus, ShoppingCart, Heart, Share2, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import ProductCard from '@/components/ProductCard'
import { useCart } from '@/contexts/CartContext'
import { formatPrice, getCategoryColor, cn } from '@/lib/utils'
import { Category } from '@/types'
import { toast } from 'sonner'

// Sample product data (in real app, fetch from API)
const sampleProduct = {
  id: '1',
  name: 'HMT Rice',
  name_hindi: 'एचएमटी चावल',
  category: 'grains' as Category,
  price: 45,
  unit: 'kg',
  stock: 50,
  description: 'Premium quality HMT rice, perfect for daily meals. This rice is sourced from the finest farms and processed with care to retain its natural flavor and nutrients.',
  image_url: undefined,
  featured: true,
  tags: ['rice', 'staple', 'premium'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const relatedProducts = [
  {
    id: '5',
    name: 'Khanda Rice',
    name_hindi: 'खंडा चावल',
    category: 'grains' as Category,
    price: 40,
    unit: 'kg',
    stock: 45,
    description: 'Traditional khanda rice',
    featured: false,
    tags: ['rice', 'staple'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Basmati Rice',
    name_hindi: 'बासमती चावल',
    category: 'grains' as Category,
    price: 80,
    unit: 'kg',
    stock: 35,
    description: 'Long grain basmati rice',
    featured: false,
    tags: ['rice', 'premium'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Wheat Flour',
    name_hindi: 'गेहूं का आटा',
    category: 'grains' as Category,
    price: 32,
    unit: 'kg',
    stock: 60,
    description: 'Fresh wheat flour',
    featured: false,
    tags: ['flour', 'staple'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export default function ProductDetailPage() {
  const params = useParams()
  const [quantity, setQuantity] = useState(1)
  const { addItem, isInCart } = useCart()
  const [activeImage, setActiveImage] = useState(0)

  // In real app, fetch product by ID
  const product = sampleProduct
  const inCart = isInCart(product.id)

  const handleAddToCart = async () => {
    await addItem(product, quantity)
  }

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(prev => prev + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Link href="/shop" className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Shop
      </Link>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden relative">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-200">
                <span className="text-slate-400 text-lg">{product.name}</span>
              </div>
            )}
          </div>
          {/* Thumbnails */}
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((index) => (
              <button
                key={index}
                onClick={() => setActiveImage(index)}
                className={cn(
                  'w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors',
                  activeImage === index ? 'border-indigo-600' : 'border-slate-200'
                )}
              >
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <span className="text-xs text-slate-400">{index + 1}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn('text-xs px-2 py-1 rounded-full', getCategoryColor(product.category))}>
                {product.category}
              </span>
              {product.stock <= 10 && product.stock > 0 && (
                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                  Only {product.stock} left
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
            <p className="text-lg text-slate-500">{product.name_hindi}</p>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{formatPrice(product.price)}</span>
            <span className="text-slate-500">per {product.unit}</span>
          </div>

          <p className="text-slate-600 leading-relaxed">{product.description}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Quantity & Add to Cart */}
          <div className="flex items-center gap-4 pt-4">
            <div className="flex items-center gap-3">
              <button
                onClick={decrementQuantity}
                disabled={quantity <= 1}
                className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center hover:border-indigo-600 hover:text-indigo-600 transition-colors disabled:opacity-50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-medium text-lg">{quantity}</span>
              <button
                onClick={incrementQuantity}
                disabled={quantity >= product.stock}
                className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center hover:border-indigo-600 hover:text-indigo-600 transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || inCart}
              className={cn(
                'flex-1 gap-2',
                inCart && 'bg-green-600 hover:bg-green-700'
              )}
              size="lg"
            >
              {inCart ? (
                <>
                  <Check className="w-5 h-5" />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </>
              )}
            </Button>

            <button className="w-12 h-12 border border-slate-300 rounded-lg flex items-center justify-center text-slate-600 hover:border-red-300 hover:text-red-600 transition-colors">
              <Heart className="w-5 h-5" />
            </button>

            <button className="w-12 h-12 border border-slate-300 rounded-lg flex items-center justify-center text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2 text-sm">
            <div className={cn(
              'w-2 h-2 rounded-full',
              product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
            )} />
            <span className="text-slate-600">
              {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
            </span>
          </div>

          {/* Additional Info */}
          <div className="border-t border-slate-200 pt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Category</span>
              <span className="font-medium text-slate-900 capitalize">{product.category}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Unit</span>
              <span className="font-medium text-slate-900">{product.unit}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Delivery</span>
              <span className="font-medium text-slate-900">Free over ₹500</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Related Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  )
}
