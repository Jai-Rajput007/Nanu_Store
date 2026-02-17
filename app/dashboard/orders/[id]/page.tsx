'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Package, MapPin, Phone, CreditCard, Truck, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatPrice, cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { Order, OrderStatus } from '@/types'

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  pending_payment: { label: 'Pending Payment Verification', color: 'bg-yellow-100 text-yellow-700' },
  payment_verified: { label: 'Payment Verified', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-700' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-700' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-600' },
}

const statusSteps: OrderStatus[] = ['pending_payment', 'payment_verified', 'processing', 'out_for_delivery', 'delivered']

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !params.id) return

    const supabase = createBrowserSupabaseClient()
    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            total,
            product:products(id, name, name_hindi, image_url, unit)
          )
        `)
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        setOrder(null)
      } else {
        setOrder(data as Order)
      }
      setLoading(false)
    }

    fetchOrder()
  }, [user, params.id])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Order not found.</p>
        <Link href="/dashboard/orders">
          <Button variant="outline" className="mt-4">Back to Orders</Button>
        </Link>
      </div>
    )
  }

  const displayId = order.order_id || order.id.slice(0, 8)
  const status = statusConfig[order.status] || statusConfig.pending_payment
  const items = (order as any).order_items || order.items || []
  const currentStepIndex = statusSteps.indexOf(order.status)

  return (
    <div className="space-y-6">
      <Link href="/dashboard/orders" className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600">
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order {displayId}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <span className={cn('inline-flex px-3 py-1.5 text-sm font-medium rounded-full', status.color)}>
          {status.label}
        </span>
      </div>

      {/* Progress steps */}
      {order.status !== 'cancelled' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Order Status</h2>
          <div className="relative flex justify-between">
            {/* Line behind steps */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200" style={{ marginLeft: '1rem', marginRight: '1rem' }} />
            <div
              className="absolute top-4 left-0 h-0.5 bg-indigo-600 transition-all"
              style={{
                marginLeft: '1rem',
                width: `calc(${(currentStepIndex / (statusSteps.length - 1)) * 100}% - 2rem)`,
              }}
            />
            {statusSteps.map((step, i) => {
              const isDone = i <= currentStepIndex
              const isCurrent = order.status === step
              return (
                <div key={step} className="relative z-10 flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm',
                      isDone ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                    )}
                  >
                    {isDone ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={cn(
                    'mt-2 text-xs text-center max-w-[4rem]',
                    isCurrent ? 'font-medium text-indigo-600' : 'text-slate-500'
                  )}>
                    {step === 'pending_payment' ? 'Payment' : step === 'payment_verified' ? 'Verified' : step === 'out_for_delivery' ? 'Delivery' : step === 'delivered' ? 'Done' : step}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Items */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            Order Items
          </h2>
          <div className="space-y-3">
            {items.map((oi: any) => (
              <div key={oi.id} className="flex gap-3 py-2 border-b border-slate-100 last:border-0">
                <div className="w-14 h-14 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                  {oi.product?.image_url ? (
                    <Image src={oi.product.image_url} alt={oi.product.name} width={56} height={56} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No img</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{oi.product?.name || 'Product'}</p>
                  <p className="text-sm text-slate-500">Qty: {oi.quantity} × {formatPrice(oi.price)}</p>
                </div>
                <span className="font-medium text-slate-900">{formatPrice(oi.total)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Delivery</span>
              <span>{order.delivery_fee === 0 ? 'Free' : formatPrice(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-2">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery & Payment */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Delivery Address
            </h2>
            <p className="text-slate-700">{order.address}</p>
            <p className="text-slate-600 mt-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {order.phone}
            </p>
            {order.delivery_instructions && (
              <p className="text-sm text-slate-500 mt-2">Note: {order.delivery_instructions}</p>
            )}
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Payment
            </h2>
            <p className="text-slate-700">
              {order.payment_method === 'qr_code' ? 'PhonePe QR Code' : 'Cash on Delivery'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Status: {order.payment_status === 'verified' ? 'Verified' : order.payment_status === 'rejected' ? 'Rejected' : 'Pending'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
