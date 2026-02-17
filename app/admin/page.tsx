'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Package, ShoppingCart, CreditCard, Truck, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import type { Order } from '@/types'

const supabase = createBrowserSupabaseClient()

interface DashboardData {
  todayOrders: number
  pendingPayments: number
  outForDelivery: number
  recentOrders: Order[]
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      // Get today's start
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Fetch today's orders
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .gte('created_at', today.toISOString())

      // Fetch pending payments
      const { data: pendingPayments } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('payment_status', 'pending')

      // Fetch out for delivery
      const { data: outForDelivery } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('status', 'out_for_delivery')

      // Fetch recent orders with user info
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('*, user:profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5)

      setData({
        todayOrders: todayOrders?.length || 0,
        pendingPayments: pendingPayments?.length || 0,
        outForDelivery: outForDelivery?.length || 0,
        recentOrders: (recentOrders as Order[]) || []
      })
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()

    // Set up realtime subscription for orders
    const subscription = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchDashboardData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchDashboardData()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchDashboardData])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 animate-pulse">
              <div className="h-10 w-10 bg-slate-200 rounded-lg" />
              <div className="mt-3 h-8 w-16 bg-slate-200 rounded" />
              <div className="mt-2 h-4 w-24 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
        <div className="animate-pulse bg-slate-200 h-64 rounded-xl" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Failed to load dashboard data</p>
      </div>
    )
  }

  const stats = [
    {
      label: "Today's Orders",
      value: String(data.todayOrders),
      change: data.todayOrders > 0 ? `${data.todayOrders} new` : undefined,
      icon: ShoppingCart,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      label: 'Pending Payments',
      value: String(data.pendingPayments),
      change: data.pendingPayments > 0 ? `${data.pendingPayments} pending` : undefined,
      icon: CreditCard,
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      label: 'Out for Delivery',
      value: String(data.outForDelivery),
      icon: Truck,
      color: 'bg-orange-100 text-orange-600'
    },
    {
      label: 'Ready to Ship',
      value: String(data.pendingPayments),
      icon: Package,
      color: 'bg-purple-100 text-purple-600'
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700'
      case 'out_for_delivery': return 'bg-orange-100 text-orange-700'
      case 'payment_verified': return 'bg-blue-100 text-blue-700'
      case 'pending_payment': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const created = new Date(date)
    const diff = Math.floor((now.getTime() - created.getTime()) / 1000)

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hour ago`
    return `${Math.floor(diff / 86400)} days ago`
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {stat.change && (
                  <span className="text-xs font-medium text-green-600">{stat.change}</span>
                )}
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-600">{stat.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
            <Link href="/admin/orders">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{order.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {(order as any).user?.full_name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{formatPrice(order.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{getTimeAgo(order.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-4">
        <Link href="/admin/inventory" className="block">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow cursor-pointer">
            <Package className="w-8 h-8 mb-3" />
            <h3 className="font-semibold">Add Product</h3>
            <p className="text-sm text-white/80 mt-1">Add new products to inventory</p>
            <Button className="mt-4 w-full bg-white text-indigo-600 hover:bg-white/90" size="sm">
              Add Product
            </Button>
          </div>
        </Link>

        <Link href="/admin/payments" className="block">
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow cursor-pointer">
            <CreditCard className="w-8 h-8 mb-3" />
            <h3 className="font-semibold">Verify Payments</h3>
            <p className="text-sm text-white/80 mt-1">{data.pendingPayments} payments pending verification</p>
            <Button className="mt-4 w-full bg-white text-orange-600 hover:bg-white/90" size="sm">
              Verify Now
            </Button>
          </div>
        </Link>

        <Link href="/admin/deliveries" className="block">
          <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow cursor-pointer">
            <Truck className="w-8 h-8 mb-3" />
            <h3 className="font-semibold">Schedule Deliveries</h3>
            <p className="text-sm text-white/80 mt-1">{data.outForDelivery} orders ready for delivery</p>
            <Button className="mt-4 w-full bg-white text-green-600 hover:bg-white/90" size="sm">
              Schedule
            </Button>
          </div>
        </Link>

        <Link href="/admin/analytics" className="block">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow cursor-pointer">
            <TrendingUp className="w-8 h-8 mb-3" />
            <h3 className="font-semibold">View Analytics</h3>
            <p className="text-sm text-white/80 mt-1">Check sales and performance</p>
            <Button className="mt-4 w-full bg-white text-blue-600 hover:bg-white/90" size="sm">
              View Reports
            </Button>
          </div>
        </Link>
      </div>
    </div>
  )
}
