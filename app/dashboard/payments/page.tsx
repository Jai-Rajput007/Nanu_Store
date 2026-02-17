'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CreditCard, CheckCircle, XCircle, Clock, Eye, Download, Loader2, FileText } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { formatPrice } from '@/lib/utils'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import type { Order } from '@/types'

const supabase = createBrowserSupabaseClient()

interface PaymentRecord {
  id: string
  orderId: string
  order_id_display: string
  amount: number
  status: 'pending' | 'verified' | 'rejected'
  method: 'qr_code' | 'cash_on_delivery'
  proofUrl?: string
  createdAt: string
}

export default function MyPaymentsPage() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProof, setSelectedProof] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
        return
      }

      const paymentRecords: PaymentRecord[] = (orders || []).map((order: Order) => ({
        id: order.id,
        orderId: order.id,
        order_id_display: order.order_id || order.id.slice(0, 8).toUpperCase(),
        amount: order.total,
        status: order.payment_status as 'pending' | 'verified' | 'rejected',
        method: order.payment_method,
        proofUrl: order.payment_proof_url,
        createdAt: order.created_at,
      }))

      setPayments(paymentRecords)
    } catch (err) {
      console.error('Error fetching payments:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-yellow-100 text-yellow-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified'
      case 'rejected':
        return 'Rejected'
      default:
        return 'Pending'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    )
  }

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
          <h1 className="text-2xl font-bold text-slate-900">My Payments</h1>
          <p className="text-slate-600">View your payment history and proof uploads</p>
        </div>
      </div>

      {/* Payments List */}
      {payments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No payments yet</h3>
          <p className="text-slate-500 mb-4">You haven't placed any orders yet.</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900">{payment.order_id_display}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(payment.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-sm">
                        {payment.method === 'qr_code' ? (
                          <>
                            <CreditCard className="w-4 h-4" />
                            QR Code
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4" />
                            Cash on Delivery
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {formatPrice(payment.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        {getStatusText(payment.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {payment.proofUrl ? (
                        <button
                          onClick={() => setSelectedProof(payment.proofUrl!)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View Proof
                        </button>
                      ) : payment.method === 'qr_code' ? (
                        <span className="text-sm text-slate-400">No proof uploaded</span>
                      ) : (
                        <span className="text-sm text-slate-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Proof Modal */}
      {selectedProof && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Payment Proof</h3>
              <button
                onClick={() => setSelectedProof(null)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="relative rounded-lg overflow-hidden border border-slate-200">
              <Image
                src={selectedProof}
                alt="Payment proof"
                width={500}
                height={400}
                className="w-full h-auto object-contain max-h-[60vh]"
              />
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <a
                href={selectedProof}
                download
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
              <button
                onClick={() => setSelectedProof(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
