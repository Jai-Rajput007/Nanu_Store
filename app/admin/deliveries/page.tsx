'use client'

import { useState, useEffect } from 'react'
import { Truck, CheckCircle, MapPin, Phone, Package, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatPrice, cn } from '@/lib/utils'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { Order, OrderStatus } from '@/types'

type OrderRow = Order & {
  user?: { full_name?: string | null; phone?: string | null }
  order_items?: Array<{
    id: string
    quantity: number
    price: number
    total: number
    product: { id: string; name: string; name_hindi?: string; image_url?: string; unit?: string }
  }>
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending_payment: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  payment_verified: { label: 'Payment Verified', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  processing: { label: 'Processing', color: 'bg-indigo-100 text-indigo-700', icon: Package },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-700', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: Clock },
}

export default function AdminDeliveriesPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null)
  const [updating, setUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState<'pending' | 'out_for_delivery' | 'delivered'>('pending')
  const [deliveryDate, setDeliveryDate] = useState('')
  const supabase = createBrowserSupabaseClient()

  const fetchOrders = async () => {
    setLoading(true)
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items(
          id,
          quantity,
          price,
          total,
          product:products(id, name, name_hindi, image_url, unit)
        )
      `)
      .order('created_at', { ascending: false })

    if (activeTab === 'pending') {
      query = query.in('status', ['payment_verified', 'processing'])
    } else if (activeTab === 'out_for_delivery') {
      query = query.eq('status', 'out_for_delivery')
    } else {
      query = query.eq('status', 'delivered')
    }

    const { data: ordersData, error } = await query

    if (error || !ordersData) {
      setLoading(false)
      return
    }

    // Fetch user profiles
    const userIds = [...new Set((ordersData as OrderRow[]).map(o => o.user_id).filter(Boolean))]
    let profilesMap: Record<string, { full_name?: string; phone?: string }> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, phone').in('id', userIds)
      if (profiles) {
        profilesMap = Object.fromEntries(profiles.map(p => [p.id, { full_name: p.full_name, phone: p.phone }]))
      }
    }

    const merged = (ordersData as Order[]).map(o => ({
      ...o,
      user: profilesMap[o.user_id] ? { full_name: profilesMap[o.user_id].full_name, phone: profilesMap[o.user_id].phone } : undefined,
    })) as OrderRow[]

    setOrders(merged)
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [activeTab])

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, deliveryDateVal?: string) => {
    setUpdating(true)
    try {
      const updates: Partial<Order> = { 
        status: newStatus,
        ...(deliveryDateVal && { delivery_date: deliveryDateVal }),
        ...(newStatus === 'delivered' && { delivered_at: new Date().toISOString() }),
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)

      if (error) {
        toast.error(error.message)
        return
      }

      // Send notification to user
      const order = orders.find(o => o.id === orderId)
      if (order?.user_id) {
        const messages: Record<OrderStatus, string> = {
          pending_payment: 'Your order is pending payment.',
          payment_verified: 'Your payment has been verified! We are preparing your order.',
          processing: 'Your order is being processed.',
          out_for_delivery: `Your order is out for delivery!${deliveryDateVal ? ` Expected delivery: ${deliveryDateVal}` : ''}`,
          delivered: 'Your order has been delivered. Thank you for shopping with us!',
          cancelled: 'Your order has been cancelled.',
        }
        
        await supabase.from('notifications').insert({
          user_id: order.user_id,
          type: newStatus === 'delivered' ? 'order_status' : 'order_status',
          title: newStatus === 'out_for_delivery' ? 'Out for Delivery' : newStatus === 'delivered' ? 'Order Delivered' : 'Order Status Updated',
          message: messages[newStatus],
          data: { order_id: orderId, status: newStatus, delivery_date: deliveryDateVal },
          read: false,
        })
      }

      toast.success(`Order ${newStatus.replace('_', ' ')}`)
      setSelectedOrder(null)
      setDeliveryDate('')
      fetchOrders()
    } finally {
      setUpdating(false)
    }
  }

  const stats = {
    pending: orders.filter(o => o.status === 'payment_verified' || o.status === 'processing').length,
    out_for_delivery: orders.filter(o => o.status === 'out_for_delivery').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Delivery Management</h1>
        <p className="text-slate-600">Manage order deliveries and track shipments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-2xl font-bold text-blue-700">{stats.pending}</p>
          <p className="text-sm text-blue-600">Ready for Delivery</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
          <p className="text-2xl font-bold text-orange-700">{stats.out_for_delivery}</p>
          <p className="text-sm text-orange-600">Out for Delivery</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-2xl font-bold text-green-700">{stats.delivered}</p>
          <p className="text-sm text-green-600">Delivered Today</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['pending', 'out_for_delivery', 'delivered'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
              activeTab === tab
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            )}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-600">No {activeTab.replace('_', ' ')} orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orders.map((order) => {
                  const displayId = order.order_id || order.id.slice(0, 8)
                  const status = statusConfig[order.status] || statusConfig.processing
                  const StatusIcon = status.icon
                  const itemCount = Array.isArray(order.order_items) ? order.order_items.length : 0

                  return (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{displayId}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900">{order.user?.full_name ?? '—'}</p>
                          <p className="text-sm text-slate-500">{order.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600">{itemCount} items</span>
                        <p className="text-sm font-medium">{formatPrice(order.total)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-600 max-w-xs truncate">{order.address}</p>
                        {order.delivery_instructions && (
                          <p className="text-xs text-slate-500">Note: {order.delivery_instructions}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', status.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOrder(order)}
                          >
                            View
                          </Button>
                          {order.status === 'payment_verified' || order.status === 'processing' ? (
                            <Button
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Truck className="w-4 h-4 mr-1" />
                              Dispatch
                            </Button>
                          ) : order.status === 'out_for_delivery' ? (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => updateOrderStatus(order.id, 'delivered')}
                              disabled={updating}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Delivered
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Order {selectedOrder.order_id || selectedOrder.id.slice(0, 8)}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Customer Info */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 mb-2">Customer</h3>
                <p className="text-sm"><span className="text-slate-500">Name:</span> {selectedOrder.user?.full_name ?? '—'}</p>
                <p className="text-sm"><span className="text-slate-500">Phone:</span> {selectedOrder.phone}</p>
              </div>

              {/* Address */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Delivery Address
                </h3>
                <p className="text-sm">{selectedOrder.address}</p>
                {selectedOrder.delivery_instructions && (
                  <p className="text-sm text-slate-500 mt-2">Note: {selectedOrder.delivery_instructions}</p>
                )}
              </div>

              {/* Items */}
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.product?.name} x {item.quantity}</span>
                      <span className="font-medium">{formatPrice(item.total)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Actions for Ready Orders */}
              {(selectedOrder.status === 'payment_verified' || selectedOrder.status === 'processing') && (
                <div className="border-t pt-4">
                  <h3 className="font-medium text-slate-900 mb-3">Schedule Delivery</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Expected Delivery Date</label>
                      <input
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <Button
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      onClick={() => {
                        if (!deliveryDate) {
                          toast.error('Please select a delivery date')
                          return
                        }
                        updateOrderStatus(selectedOrder.id, 'out_for_delivery', deliveryDate)
                      }}
                      disabled={updating || !deliveryDate}
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Mark as Out for Delivery
                    </Button>
                  </div>
                </div>
              )}

              {/* Mark Delivered for Out for Delivery */}
              {selectedOrder.status === 'out_for_delivery' && (
                <div className="border-t pt-4">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                    disabled={updating}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Delivered
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
