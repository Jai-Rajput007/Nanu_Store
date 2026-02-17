'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Package, CreditCard, Truck, CheckCircle, X, Eye } from 'lucide-react'
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

const statusTabs = [
  { id: 'all', label: 'All Orders' },
  { id: 'pending_payment', label: 'Pending Payment' },
  { id: 'payment_verified', label: 'Verified' },
  { id: 'processing', label: 'Processing' },
  { id: 'out_for_delivery', label: 'Out for Delivery' },
  { id: 'delivered', label: 'Delivered' },
]

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: typeof Package }> = {
  pending_payment: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700', icon: CreditCard },
  payment_verified: { label: 'Verified', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-700', icon: Package },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-700', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-600', icon: Package },
}

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null)
  const [updating, setUpdating] = useState(false)

  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: ordersData, error: ordersError } = await supabase
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

      if (ordersError || !ordersData) {
        setLoading(false)
        return
      }

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

    fetchOrders()
  }, [])

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status === activeTab)

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdating(true)
    try {
      const updates: Partial<Order> = { status: newStatus }
      if (newStatus === 'delivered') {
        updates.delivered_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)

      if (error) {
        toast.error(error.message)
        return
      }

      const order = orders.find(o => o.id === orderId)
      if (order?.user_id) {
        const messages: Record<OrderStatus, string> = {
          pending_payment: 'Your order is pending payment verification.',
          payment_verified: 'Your payment has been verified. We are preparing your order.',
          processing: 'Your order is being processed.',
          out_for_delivery: 'Your order is out for delivery!',
          delivered: 'Your order has been delivered. Thank you!',
          cancelled: 'Your order was cancelled.',
        }
        await supabase.from('notifications').insert({
          user_id: order.user_id,
          type: 'order_status',
          title: 'Order update',
          message: messages[newStatus] || `Order status: ${newStatus}`,
          data: { order_id: orderId, status: newStatus },
          read: false,
        })
      }

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o))
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, ...updates } : null)
      }
      toast.success('Order updated')
    } finally {
      setUpdating(false)
    }
  }

  const tabCounts = statusTabs.map(tab => ({
    ...tab,
    count: tab.id === 'all' ? orders.length : orders.filter(o => o.status === tab.id).length,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders Management</h1>
        <p className="text-slate-600">View and manage customer orders</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabCounts.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            )}
          >
            {tab.label}
            <span className={cn('ml-2 px-2 py-0.5 rounded-full text-xs', activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100')}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredOrders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.pending_payment
                  const displayId = order.order_id || order.id.slice(0, 8)
                  const customer = order.user || (order as any).profiles
                  const name = customer?.full_name ?? '—'
                  const phone = order.phone || customer?.phone || '—'
                  const itemCount = Array.isArray(order.order_items) ? order.order_items.length : 0

                  return (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{displayId}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900">{name}</p>
                          <p className="text-sm text-slate-500">{phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{itemCount} items</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{formatPrice(order.total)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full', status.color)}>
                          <status.icon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {new Date(order.created_at).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Order {selectedOrder.order_id || selectedOrder.id.slice(0, 8)}
              </h2>
              <button onClick={() => setSelectedOrder(null)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Customer</p>
                <p className="font-medium">{selectedOrder.user?.full_name ?? '—'}</p>
                <p className="text-sm">{selectedOrder.phone}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Delivery Address</p>
                <p className="text-sm">{selectedOrder.address}</p>
                {selectedOrder.delivery_instructions && (
                  <p className="text-sm text-slate-500 mt-1">Note: {selectedOrder.delivery_instructions}</p>
                )}
              </div>

              {selectedOrder.payment_method === 'qr_code' && selectedOrder.payment_proof_url && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Payment Proof</p>
                  <a href={selectedOrder.payment_proof_url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-slate-200">
                    <Image
                      src={selectedOrder.payment_proof_url}
                      alt="Payment proof"
                      width={280}
                      height={200}
                      className="w-full object-contain max-h-48"
                    />
                  </a>
                </div>
              )}

              <div>
                <p className="text-sm text-slate-500">Status</p>
                <span className={cn('inline-flex px-2 py-1 text-xs rounded-full', statusConfig[selectedOrder.status]?.color || statusConfig.pending_payment.color)}>
                  {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                </span>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-slate-500 mb-2">Order Items</p>
                <div className="space-y-2">
                  {(selectedOrder.order_items || []).map((oi: any) => (
                    <div key={oi.id} className="flex justify-between text-sm">
                      <span>{oi.product?.name || 'Product'} × {oi.quantity}</span>
                      <span>{formatPrice(oi.total)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-2 pt-2 flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Delivery</span>
                  <span>{selectedOrder.delivery_fee === 0 ? 'Free' : formatPrice(selectedOrder.delivery_fee)}</span>
                </div>
                <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                {selectedOrder.status === 'pending_payment' && (
                  <Button className="flex-1" onClick={() => updateOrderStatus(selectedOrder.id, 'payment_verified')} disabled={updating}>
                    Verify Payment
                  </Button>
                )}
                {selectedOrder.status === 'payment_verified' && (
                  <Button className="flex-1" onClick={() => updateOrderStatus(selectedOrder.id, 'processing')} disabled={updating}>
                    Mark Processing
                  </Button>
                )}
                {selectedOrder.status === 'processing' && (
                  <Button className="flex-1" onClick={() => updateOrderStatus(selectedOrder.id, 'out_for_delivery')} disabled={updating}>
                    Out for Delivery
                  </Button>
                )}
                {selectedOrder.status === 'out_for_delivery' && (
                  <Button className="flex-1" onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')} disabled={updating}>
                    Mark Delivered
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
