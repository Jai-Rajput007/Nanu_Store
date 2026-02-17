'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/contexts/CartContext'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'

export default function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeItem, subtotal, deliveryFee, total, itemCount } = useCart()

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 pt-24">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Your cart is empty</h2>
          <p className="mt-2 text-slate-600">
            Looks like you haven&apos;t added anything to your cart yet.
          </p>
          <Link href="/shop">
            <Button className="mt-6" size="lg">
              Start Shopping
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex gap-4"
            >
              {/* Product Image */}
              <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.product.image_url ? (
                  <Image
                    src={item.product.image_url}
                    alt={item.product.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200">
                    <span className="text-slate-400 text-xs">No Image</span>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <Link
                      href={`/product/${item.product.id}`}
                      className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-slate-500">{item.product.name_hindi}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      {formatPrice(item.product.price)}/{item.product.unit}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:border-indigo-600 hover:text-indigo-600 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:border-indigo-600 hover:text-indigo-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Total */}
                  <p className="font-bold text-slate-900">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <Link href="/shop">
            <Button variant="outline" className="gap-2">
              Continue Shopping
            </Button>
          </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal ({itemCount} items)</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Delivery Fee</span>
                <span className="font-medium">
                  {formatPrice(deliveryFee)}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200 mt-4 pt-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-xl font-bold text-slate-900">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Promo Code */}
            <div className="mt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter promo code"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button variant="outline" size="sm">
                  Apply
                </Button>
              </div>
            </div>

            <Button
              className="w-full mt-6 gap-2"
              size="lg"
              onClick={() => router.push('/checkout')}
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </Button>

            <p className="mt-4 text-xs text-slate-500 text-center">
              Shipping & taxes calculated at checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
