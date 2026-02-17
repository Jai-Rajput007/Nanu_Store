'use client'

import { useEffect, useState } from 'react'
import { CreditCard, CheckCircle2, XCircle, Clock, Receipt } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { formatPrice, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

interface Payment {
  id: string
  order_id: string
  amount: number
  status: 'pending' | 'verified' | 'rejected'
  payment_method: string
  payment_proof_url?: string
  created_at: string
  order?: {
    order_id: string
    total_amount: number
  }
}

export default function PaymentsPage() {
  const { user, isAuthenticated } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsLoading(false)
      return
    }

    loadPayments()
  }, [isAuthenticated, user])

  const loadPayments = async () => {
    if (!user) return

    try {
      // Fetch orders with payment information
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform orders into payment records
      const paymentRecords: Payment[] = (orders || []).map((order: any) => ({
        id: order.id,
        order_id: order.order_id,
        amount: order.total,
        status: order.payment_status === 'verified' ? 'verified' : order.payment_status === 'rejected' ? 'rejected' : 'pending',
        payment_method: order.payment_method || 'QR Code',
        payment_proof_url: order.payment_proof_url,
        created_at: order.created_at,
        order: {
          order_id: order.order_id,
          total_amount: order.total,
        },
      }))

      setPayments(paymentRecords)
    } catch (error) {
      console.error('Error loading payments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 pt-24">
        <div className="max-w-md mx-auto text-center">
          <CreditCard className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-6">Please log in to view your payment history.</p>
          <Link href="/login">
            <Button variant="primary">Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 pt-24">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 border border-slate-200 h-32" />
          ))}
        </div>
      </div>
    )
  }

  const pendingPayments = payments.filter(p => p.status === 'pending')
  const verifiedPayments = payments.filter(p => p.status === 'verified')
  const rejectedPayments = payments.filter(p => p.status === 'rejected')

  return (
    <div className="container mx-auto px-4 py-16 pt-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Payments</h1>
        <p className="text-slate-600">View and manage your payment history</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-slate-900">{pendingPayments.length}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Verified</p>
              <p className="text-2xl font-bold text-slate-900">{verifiedPayments.length}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Rejected</p>
              <p className="text-2xl font-bold text-slate-900">{rejectedPayments.length}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Pending Verification</h2>
          <div className="space-y-4">
            {pendingPayments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white rounded-lg p-6 border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-orange-500" />
                      <h3 className="font-semibold text-slate-900">Order {payment.order_id}</h3>
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                        Pending
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">
                      Amount: <span className="font-semibold text-slate-900">{formatPrice(payment.amount)}</span>
                    </p>
                    <p className="text-sm text-slate-600 mb-1">
                      Method: {payment.payment_method}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(payment.created_at)}
                    </p>
                  </div>
                  {payment.payment_proof_url && (
                    <a
                      href={payment.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      View Proof
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified Payments */}
      {verifiedPayments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Verified Payments</h2>
          <div className="space-y-4">
            {verifiedPayments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white rounded-lg p-6 border border-green-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <h3 className="font-semibold text-slate-900">Order {payment.order_id}</h3>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                        Verified
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">
                      Amount: <span className="font-semibold text-slate-900">{formatPrice(payment.amount)}</span>
                    </p>
                    <p className="text-sm text-slate-600 mb-1">
                      Method: {payment.payment_method}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(payment.created_at)}
                    </p>
                  </div>
                  <Receipt className="w-5 h-5 text-green-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejected Payments */}
      {rejectedPayments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Rejected Payments</h2>
          <div className="space-y-4">
            {rejectedPayments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white rounded-lg p-6 border border-red-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <h3 className="font-semibold text-slate-900">Order {payment.order_id}</h3>
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                        Rejected
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">
                      Amount: <span className="font-semibold text-slate-900">{formatPrice(payment.amount)}</span>
                    </p>
                    <p className="text-sm text-slate-600 mb-1">
                      Method: {payment.payment_method}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(payment.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {payments.length === 0 && (
        <div className="bg-white rounded-lg p-12 border border-slate-200 text-center">
          <CreditCard className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Payments Yet</h3>
          <p className="text-slate-600 mb-6">Your payment history will appear here once you place an order.</p>
          <Link href="/shop">
            <Button variant="primary">Start Shopping</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
