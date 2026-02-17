'use client'

import { useEffect, useState, useCallback } from 'react'
import { TrendingUp, DollarSign, ShoppingBag, Users, ArrowUp, ArrowDown } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { createBrowserSupabaseClient } from '@/lib/supabase'

const supabase = createBrowserSupabaseClient()

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  newCustomers: number
  revenueChange: number
  ordersChange: number
  avgOrderChange: number
  customersChange: number
  dailyRevenue: { day: string; amount: number }[]
  topProducts: { name: string; sales: number; revenue: number }[]
  categorySales: { category: string; percentage: number; color: string; amount: number }[]
}

const categoryColors: Record<string, string> = {
  grains: 'bg-amber-500',
  pulses: 'bg-green-500',
  spices: 'bg-red-500',
  oil: 'bg-yellow-500',
  dairy: 'bg-cyan-500',
  snacks: 'bg-purple-500',
  beverages: 'bg-pink-500',
  others: 'bg-gray-500',
}

const categoryNames: Record<string, string> = {
  grains: 'Grains',
  pulses: 'Pulses',
  spices: 'Spices',
  oil: 'Oil',
  dairy: 'Dairy',
  snacks: 'Snacks',
  beverages: 'Beverages',
  others: 'Others',
}

// Simple date helpers (no date-fns dependency)
const subDays = (date: Date, days: number) => {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

const formatDay = (date: Date) => {
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | 'all'>('7days')

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const now = new Date()
      const daysBack = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 365
      const startDate = timeRange === 'all' ? subDays(now, 365) : subDays(now, daysBack)
      const prevStartDate = subDays(startDate, daysBack)

      // Fetch orders within date range
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      // Fetch previous period orders for comparison
      const { data: prevOrders } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString())

      // Fetch all order items with product details
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*, products(name, category)')

      if (itemsError) throw itemsError

      // Fetch users created in range
      const { data: newUsers } = await supabase
        .from('profiles')
        .select('*')
        .gte('created_at', startDate.toISOString())

      // Calculate stats
      const totalRevenue = orders?.reduce((sum: number, o: any) => sum + (o.total || 0), 0) || 0
      const totalOrders = orders?.length || 0
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
      const newCustomers = newUsers?.length || 0

      // Previous period stats for comparison
      const prevRevenue = prevOrders?.reduce((sum: number, o: any) => sum + (o.total || 0), 0) || 0
      const prevOrderCount = prevOrders?.length || 0

      const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0
      const ordersChange = prevOrderCount > 0 ? ((totalOrders - prevOrderCount) / prevOrderCount) * 100 : 0

      // Daily revenue for chart
      const dailyRevenue: { day: string; amount: number }[] = []
      const daysToShow = 7
      for (let i = daysToShow - 1; i >= 0; i--) {
        const day = subDays(now, i)
        const dayOrders = orders?.filter((o: any) => isSameDay(new Date(o.created_at), day)) || []
        const dayRevenue = dayOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)
        dailyRevenue.push({
          day: formatDay(day),
          amount: dayRevenue
        })
      }

      // Top products
      const productSales: Record<string, { name: string; sales: number; revenue: number }> = {}
      orderItems?.forEach((item: any) => {
        const productName = item.products?.name || 'Unknown'
        if (!productSales[productName]) {
          productSales[productName] = { name: productName, sales: 0, revenue: 0 }
        }
        productSales[productName].sales += item.quantity || 0
        productSales[productName].revenue += (item.price || 0) * (item.quantity || 0)
      })
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)

      // Category sales
      const categoryTotals: Record<string, number> = {}
      let totalCategoryAmount = 0
      orderItems?.forEach((item: any) => {
        const category = item.products?.category || 'others'
        const amount = (item.price || 0) * (item.quantity || 0)
        categoryTotals[category] = (categoryTotals[category] || 0) + amount
        totalCategoryAmount += amount
      })

      const categorySales = Object.entries(categoryTotals)
        .map(([category, amount]) => ({
          category: categoryNames[category] || category,
          percentage: totalCategoryAmount > 0 ? Math.round((amount / totalCategoryAmount) * 100) : 0,
          color: categoryColors[category] || 'bg-gray-500',
          amount
        }))
        .sort((a, b) => b.amount - a.amount)

      setData({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        newCustomers,
        revenueChange,
        ordersChange,
        avgOrderChange: 0,
        customersChange: 0,
        dailyRevenue,
        topProducts,
        categorySales
      })
    } catch (err) {
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
            <p className="text-slate-600">Track your store performance and insights</p>
          </div>
          <div className="animate-pulse bg-slate-200 h-10 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 animate-pulse">
              <div className="h-12 w-12 bg-slate-200 rounded-lg" />
              <div className="mt-4 h-8 w-24 bg-slate-200 rounded" />
              <div className="mt-2 h-4 w-32 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Failed to load analytics data</p>
      </div>
    )
  }

  const stats = [
    {
      label: 'Total Revenue',
      value: data.totalRevenue,
      change: `${data.revenueChange >= 0 ? '+' : ''}${data.revenueChange.toFixed(1)}%`,
      trend: data.revenueChange >= 0 ? 'up' : 'down' as const,
      icon: DollarSign,
      color: 'bg-green-100 text-green-600'
    },
    {
      label: 'Total Orders',
      value: data.totalOrders,
      change: `${data.ordersChange >= 0 ? '+' : ''}${data.ordersChange.toFixed(1)}%`,
      trend: data.ordersChange >= 0 ? 'up' : 'down' as const,
      icon: ShoppingBag,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      label: 'Average Order Value',
      value: data.avgOrderValue,
      change: '+0%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-600',
      isPrice: true
    },
    {
      label: 'New Customers',
      value: data.newCustomers,
      change: `${data.customersChange >= 0 ? '+' : ''}${data.customersChange.toFixed(1)}%`,
      trend: data.customersChange >= 0 ? 'up' : 'down' as const,
      icon: Users,
      color: 'bg-orange-100 text-orange-600'
    },
  ]

  const maxRevenue = Math.max(...data.dailyRevenue.map(d => d.amount), 1)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="text-slate-600">Track your store performance and insights</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {(stat as any).isPrice || stat.label.includes('Revenue') || stat.label.includes('Value')
                    ? formatPrice(stat.value)
                    : stat.value}
                </span>
                <span className={`flex items-center text-xs font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-sm text-slate-600">{stat.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Revenue ({timeRange === '7days' ? 'Last 7 Days' : timeRange === '30days' ? 'Last 30 Days' : 'All Time'})</h2>
          <div className="space-y-4">
            {data.dailyRevenue.map((day) => (
              <div key={day.day} className="flex items-center gap-4">
                <span className="w-8 text-sm text-slate-600">{day.day}</span>
                <div className="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: `${(day.amount / maxRevenue) * 100}%` }}
                  />
                </div>
                <span className="w-16 text-sm font-medium text-slate-900 text-right">
                  {formatPrice(day.amount)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total Revenue</span>
              <span className="text-xl font-bold text-slate-900">
                {formatPrice(data.dailyRevenue.reduce((sum, d) => sum + d.amount, 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Top Selling Products</h2>
          {data.topProducts.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-4">
              {data.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center gap-4">
                  <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium text-slate-600">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="text-sm text-slate-500">{product.sales} units sold</p>
                  </div>
                  <span className="font-medium text-slate-900">{formatPrice(product.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Sales by Category</h2>
        {data.categorySales.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No category data yet</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              {data.categorySales.map((cat) => (
                <div key={cat.category} className="flex items-center gap-4">
                  <span className="w-24 text-sm text-slate-600">{cat.category}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cat.color} rounded-full`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                  <span className="w-10 text-sm font-medium text-slate-900">{cat.percentage}%</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {data.categorySales.map((cat) => (
                <div key={cat.category} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{cat.category}</p>
                    <p className="text-xs text-slate-500">{cat.percentage}% of sales</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
