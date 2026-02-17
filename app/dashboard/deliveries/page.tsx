'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Truck, Calendar, MapPin, Phone, Package, CheckCircle, Clock, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { formatPrice } from '@/lib/utils'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import type { Order, Profile } from '@/types'

const supabase = createBrowserSupabaseClient()

interface DeliveryOrder extends Omit<Order, 'user'> {
  user?: Pick<Profile, 'full_name' | 'phone'>
}

export default function MyDeliveriesPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDeliveries = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['out_for_delivery', 'delivered', 'processing', 'payment_verified'])
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching deliveries:', error)
        return
      }

      setOrders(ordersData as DeliveryOrder[] || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchDeliveries()
  }, [fetchDeliveries])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'out_for_delivery':
        return <Truck className="w-5 h-5 text-orange-600" />
      default:
        return <Clock className="w-5 h-5 text-blue-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700'
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-blue-100 text-blue-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Delivered'
      case 'out_for_delivery':
        return 'Out for Delivery'
      case 'processing':
        return 'Processing'
      default:
        return 'Preparing'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    )
  }

  const activeDeliveries = orders.filter(o => o.status !== 'delivered')
  const pastDeliveries = orders.filter(o => o.status === 'delivered')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Deliveries</h1>
          <p className="text-slate-600">Track your orders and view delivery details</p>
        </div>
      </div>

      {/* Active Deliveries */}
      {activeDeliveries.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              Active Deliveries ({activeDeliveries.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-200">
            {activeDeliveries.map((order) => (
              <div key={order.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-medium text-slate-900">Order #{order.order_id || order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm text-slate-500">
                      Placed on {new Date(order.created_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {getStatusText(order.status)}
                  </span>
                </div>

                {/* Delivery Info Card */}
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  {order.delivery_date && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Expected Delivery Date</p>
                        <p className="font-semibold text-slate-900">
                          {new Date(order.delivery_date).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Delivery Address</p>
                      <p className="font-medium text-slate-900">{order.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Contact Number</p>
                      <p className="font-medium text-slate-900">{order.phone}</p>
                    </div>
                  </div>

                  {order.delivery_instructions && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Delivery Instructions</p>
                        <p className="font-medium text-slate-900">{order.delivery_instructions}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="font-medium text-slate-900">Total: {formatPrice(order.total)}</p>
                  <Link
                    href={`/dashboard/orders`}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    View Order Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Deliveries */}
      {pastDeliveries.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Delivered Orders ({pastDeliveries.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-200">
            {pastDeliveries.map((order) => (
              <div key={order.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <p className="font-medium text-slate-900">Order #{order.order_id || order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-sm text-slate-500">
                    {order.delivered_at
                      ? `Delivered on ${new Date(order.delivered_at).toLocaleDateString('en-IN')}`
                      : 'Delivered'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900">{formatPrice(order.total)}</p>
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3" />
                    Delivered
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {orders.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No deliveries yet</h3>
          <p className="text-slate-500 mb-4">You don't have any active or past deliveries.</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      )}
    </div>
  )
}
