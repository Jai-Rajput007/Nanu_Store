'use client'

import Link from 'next/link'
import { ShoppingBag, MapPin, CreditCard, Package, TrendingUp, User, FileText, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { formatPrice } from '@/lib/utils'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { useEffect, useState, useCallback } from 'react'
import type { Order } from '@/types'

const supabase = createBrowserSupabaseClient()

interface DashboardData {
  totalOrders: number
  activeDeliveries: number
  pendingPayments: number
  recentOrders: Order[]
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { itemCount } = useCart()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      // Fetch user's orders
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
        return
      }

      const ordersList = orders || []
      
      // Calculate stats
      const totalOrders = ordersList.length
      const activeDeliveries = ordersList.filter((o: Order) => 
        o.status === 'processing' || o.status === 'out_for_delivery'
      ).length
      const pendingPayments = ordersList.filter((o: Order) => 
        o.payment_status === 'pending' && o.payment_method === 'qr_code'
      ).length

      setData({
        totalOrders,
        activeDeliveries,
        pendingPayments,
        recentOrders: ordersList.slice(0, 3) as Order[]
      })
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    )
  }

  const stats = [
    { label: 'Total Orders', value: String(data?.totalOrders || 0), icon: ShoppingBag, color: 'bg-blue-100 text-blue-600' },
    { label: 'Active Deliveries', value: String(data?.activeDeliveries || 0), icon: MapPin, color: 'bg-orange-100 text-orange-600' },
    { label: 'Pending Payments', value: String(data?.pendingPayments || 0), icon: CreditCard, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Cart Items', value: String(itemCount || 0), icon: Package, color: 'bg-green-100 text-green-600' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700'
      case 'out_for_delivery': return 'bg-orange-100 text-orange-700'
      case 'processing': return 'bg-purple-100 text-purple-700'
      case 'payment_verified': return 'bg-blue-100 text-blue-700'
      case 'pending_payment': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-slate-100 text-slate-600'
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user?.full_name?.split(' ')[0] || 'User'}!</h1>
        <p className="mt-2 text-white/80">
          You have {itemCount} items in your cart and {data?.activeDeliveries || 0} active orders.
        </p>
        <div className="mt-4 flex gap-3">
          <Link 
            href="/shop" 
            className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-white/90 transition-colors"
          >
            Continue Shopping
          </Link>
          <Link 
            href="/dashboard/orders" 
            className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors"
          >
            View Orders
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-600">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
          <Link 
            href="/dashboard/orders" 
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View All
          </Link>
        </div>
        <div className="divide-y divide-slate-200">
          {data?.recentOrders && data.recentOrders.length > 0 ? (
            data.recentOrders.map((order) => (
              <div key={order.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-medium text-slate-900">{order.order_id || order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-sm text-slate-500">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900">{formatPrice(order.total)}</p>
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-slate-500">No orders yet</p>
              <Link href="/shop" className="text-indigo-600 hover:text-indigo-700 text-sm mt-2 inline-block">
                Start shopping
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link 
          href="/shop" 
          className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
        >
          <TrendingUp className="w-8 h-8 text-indigo-600 mb-3" />
          <h3 className="font-semibold text-slate-900">Browse Shop</h3>
          <p className="text-sm text-slate-600 mt-1">Explore our latest products</p>
        </Link>
        
        <Link 
          href="/dashboard/payments" 
          className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
        >
          <FileText className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="font-semibold text-slate-900">My Payments</h3>
          <p className="text-sm text-slate-600 mt-1">View payment history and proofs</p>
        </Link>
        
        <Link 
          href="/dashboard/profile" 
          className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
        >
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <User className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="font-semibold text-slate-900">My Profile</h3>
          <p className="text-sm text-slate-600 mt-1">View your registration details</p>
        </Link>
      </div>
    </div>
  )
}
