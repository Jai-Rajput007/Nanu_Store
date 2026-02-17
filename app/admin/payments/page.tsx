'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { CheckCircle, XCircle, Eye, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatPrice, cn } from '@/lib/utils'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { Order, PaymentStatus } from '@/types'

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

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected'>('pending')
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null)
  const [updating, setUpdating] = useState(false)
  const [stats, setStats] = useState({ pending: 0, verified: 0, rejected: 0, totalAmount: 0 })

  const supabase = createBrowserSupabaseClient()

  const fetchOrders = async () => {
    setLoading(true)
    
    // Fetch all QR code orders to calculate stats
    const { data: allOrdersData, error: allOrdersError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_method', 'qr_code')
      .order('created_at', { ascending: false })

    if (allOrdersError || !allOrdersData) {
      setLoading(false)
      return
    }

    // Calculate stats
    const pendingCount = allOrdersData.filter((o: Order) => o.payment_status === 'pending').length
    const verifiedCount = allOrdersData.filter((o: Order) => o.payment_status === 'verified').length
    const rejectedCount = allOrdersData.filter((o: Order) => o.payment_status === 'rejected').length
    const verifiedToday = allOrdersData.filter((o: Order) => 
      o.payment_status === 'verified' && 
      o.updated_at && 
      new Date(o.updated_at).toDateString() === new Date().toDateString()
    )
    const totalAmount = verifiedToday.reduce((sum: number, o: Order) => sum + Number(o.total), 0)

    setStats({
      pending: pendingCount,
      verified: verifiedCount,
      rejected: rejectedCount,
      totalAmount
    })

    // Filter by active tab
    let filteredIds: string[] = []
    if (activeTab === 'pending') {
      filteredIds = allOrdersData
        .filter((o: Order) => o.payment_status === 'pending')
        .map((o: Order) => o.id)
    } else if (activeTab === 'verified') {
      filteredIds = allOrdersData
        .filter((o: Order) => o.payment_status === 'verified')
        .map((o: Order) => o.id)
    } else {
      filteredIds = allOrdersData
        .filter((o: Order) => o.payment_status === 'rejected')
        .map((o: Order) => o.id)
    }

    if (filteredIds.length === 0) {
      setOrders([])
      setLoading(false)
      return
    }

    // Fetch filtered orders with items
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
      .in('id', filteredIds)
      .order('created_at', { ascending: false })

    if (ordersError || !ordersData) {
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

  const updatePaymentStatus = async (orderId: string, newStatus: PaymentStatus) => {
    setUpdating(true)
    try {
      const updates: Partial<Order> = { 
        payment_status: newStatus,
        status: newStatus === 'verified' ? 'payment_verified' : 'pending_payment'
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
        const messages: Record<PaymentStatus, string> = {
          pending: 'Your payment is pending verification.',
          verified: 'Your payment has been verified! We are preparing your order.',
          rejected: 'Your payment proof was rejected. Please upload a valid proof.',
        }
        
        await supabase.from('notifications').insert({
          user_id: order.user_id,
          type: newStatus === 'verified' ? 'payment_verified' : 'payment_rejected',
          title: newStatus === 'verified' ? 'Payment Verified' : 'Payment Rejected',
          message: messages[newStatus],
          data: { order_id: orderId, payment_status: newStatus },
          read: false,
        })
      }

      toast.success(newStatus === 'verified' ? 'Payment verified' : 'Payment rejected')
      setSelectedOrder(null)
      fetchOrders()
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payment Verification</h1>
        <p className="text-slate-600">Verify customer QR code payments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
          <p className="text-sm text-yellow-600">Pending Verification</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-2xl font-bold text-green-700">{stats.verified}</p>
          <p className="text-sm text-green-600">Verified Payments</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
          <p className="text-sm text-red-600">Rejected Payments</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-2xl font-bold text-blue-700">{formatPrice(stats.totalAmount)}</p>
          <p className="text-sm text-blue-600">Verified Today</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['pending', 'verified', 'rejected'] as const).map((tab) => (
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
            {tab}
            <span className={cn('ml-2 px-2 py-0.5 rounded-full text-xs', activeTab === tab ? 'bg-white/20' : 'bg-slate-100')}>
              {tab === 'pending' ? stats.pending : tab === 'verified' ? stats.verified : stats.rejected}
            </span>
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
          <p className="text-slate-600">No {activeTab} payments found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Proof</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Date</th>
                  {activeTab === 'pending' && <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orders.map((order) => {
                  const displayId = order.order_id || order.id.slice(0, 8)
                  const hasProof = !!order.payment_proof_url

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
                        <span className="font-bold text-slate-900">{formatPrice(order.total)}</span>
                      </td>
                      <td className="px-4 py-3">
                        {hasProof ? (
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">View Proof</span>
                          </button>
                        ) : (
                          <span className="text-sm text-red-500">No proof uploaded</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {new Date(order.created_at).toLocaleString('en-IN')}
                      </td>
                      {activeTab === 'pending' && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => updatePaymentStatus(order.id, 'verified')}
                              disabled={!hasProof || updating}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => updatePaymentStatus(order.id, 'rejected')}
                              disabled={updating}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Proof Modal */}
      {selectedOrder && selectedOrder.payment_proof_url && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Payment Proof</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Order Info */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Order ID</p>
                    <p className="font-medium">{selectedOrder.order_id || selectedOrder.id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Amount</p>
                    <p className="font-bold text-slate-900">{formatPrice(selectedOrder.total)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Customer</p>
                    <p className="font-medium">{selectedOrder.user?.full_name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Phone</p>
                    <p className="font-medium">{selectedOrder.phone}</p>
                  </div>
                </div>
              </div>

              {/* Proof Image */}
              <div>
                <p className="text-sm text-slate-500 mb-2">Payment Screenshot</p>
                <div className="rounded-lg overflow-hidden border border-slate-200">
                  <Image
                    src={selectedOrder.payment_proof_url}
                    alt="Payment proof"
                    width={400}
                    height={400}
                    className="w-full object-contain max-h-80"
                  />
                </div>
                <a
                  href={selectedOrder.payment_proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 mt-2"
                >
                  <Download className="w-4 h-4" />
                  Open in new tab
                </a>
              </div>

              {/* Action Buttons for Pending */}
              {selectedOrder.payment_status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => updatePaymentStatus(selectedOrder.id, 'verified')}
                    disabled={updating}
                  >
                    {updating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-1" />
                    )}
                    Verify Payment
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => updatePaymentStatus(selectedOrder.id, 'rejected')}
                    disabled={updating}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}

              {/* Status Badge for Verified/Rejected */}
              {selectedOrder.payment_status !== 'pending' && (
                <div className="pt-4 border-t">
                  <span className={cn(
                    'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
                    selectedOrder.payment_status === 'verified'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  )}>
                    {selectedOrder.payment_status === 'verified' ? (
                      <><CheckCircle className="w-4 h-4" /> Verified</>
                    ) : (
                      <><XCircle className="w-4 h-4" /> Rejected</>
                    )}
                  </span>
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
