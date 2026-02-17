'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Check } from 'lucide-react'
import { Product } from '@/types'
import { formatPrice, getCategoryColor } from '@/lib/utils'
import { useCart } from '@/contexts/CartContext'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ProductCardProps {
  product: Product
  variant?: 'default' | 'compact'
}

export default function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const { addItem, isInCart } = useCart()

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await addItem(product, 1)
  }

  const inCart = isInCart(product.id)

  if (variant === 'compact') {
    return (
      <div className="group relative bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300">
        <Link href={`/product/${product.id}`}>
          <div className="aspect-square relative bg-slate-100">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-200">
                <span className="text-slate-400 text-sm">No Image</span>
              </div>
            )}
          </div>
          <div className="p-3">
            <span className={cn('text-xs px-2 py-0.5 rounded-full', getCategoryColor(product.category))}>
              {product.category}
            </span>
            <h3 className="mt-2 font-medium text-sm text-slate-900 line-clamp-1">{product.name}</h3>
            <p className="text-xs text-slate-500">{product.name_hindi}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-semibold text-sm text-slate-900">{formatPrice(product.price)}</span>
              <span className="text-xs text-slate-500">/{product.unit}</span>
            </div>
          </div>
        </Link>
      </div>
    )
  }

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
      <Link href={`/product/${product.id}`}>
        <div className="aspect-[4/3] relative bg-slate-100 overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-200">
              <span className="text-slate-400">No Image</span>
            </div>
          )}
          {product.featured && (
            <span className="absolute top-3 left-3 px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
              Featured
            </span>
          )}
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', getCategoryColor(product.category))}>
            {product.category}
          </span>
        </div>

        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-slate-500">{product.name_hindi}</p>
        </Link>

        <p className="mt-2 text-sm text-slate-600 line-clamp-2">{product.description}</p>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-slate-900">{formatPrice(product.price)}</span>
            <span className="text-sm text-slate-500">/{product.unit}</span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={inCart}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
              inCart
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            )}
          >
            {inCart ? (
              <>
                <Check className="w-4 h-4" />
                Added
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
