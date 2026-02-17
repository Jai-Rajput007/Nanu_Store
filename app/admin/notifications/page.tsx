'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, Package, UserPlus, CreditCard, AlertTriangle, Truck, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/contexts/NotificationContext'
import { Notification, NotificationType } from '@/types'
import Link from 'next/link'

const notificationIcons: Record<NotificationType, any> = {
  order_status: Truck,
  payment_verified: CreditCard,
  payment_rejected: CreditCard,
  stock_back: Package,
  new_order: Package,
  low_stock: AlertTriangle,
}

const notificationColors: Record<NotificationType, string> = {
  order_status: 'bg-blue-100 text-blue-700',
  payment_verified: 'bg-green-100 text-green-700',
  payment_rejected: 'bg-red-100 text-red-700',
  stock_back: 'bg-purple-100 text-purple-700',
  new_order: 'bg-indigo-100 text-indigo-700',
  low_stock: 'bg-orange-100 text-orange-700',
}

export default function AdminNotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = useNotifications()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all')

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.read) return false
    if (selectedType !== 'all' && n.type !== selectedType) return false
    return true
  })

  const stats = {
    all: notifications.length,
    unread: unreadCount,
    new_order: notifications.filter(n => n.type === 'new_order').length,
    payment_verified: notifications.filter(n => n.type === 'payment_verified').length,
    low_stock: notifications.filter(n => n.type === 'low_stock').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-600">Manage your notifications and alerts</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refreshNotifications}
            className="text-sm"
          >
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={markAllAsRead}
              className="text-sm"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button
          onClick={() => { setFilter('all'); setSelectedType('all') }}
          className={cn(
            'bg-white rounded-xl p-4 border transition-colors text-left',
            filter === 'all' && selectedType === 'all' ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300'
          )}
        >
          <p className="text-2xl font-bold text-slate-900">{stats.all}</p>
          <p className="text-sm text-slate-600">All</p>
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            'bg-white rounded-xl p-4 border transition-colors text-left',
            filter === 'unread' ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300'
          )}
        >
          <p className="text-2xl font-bold text-indigo-600">{stats.unread}</p>
          <p className="text-sm text-slate-600">Unread</p>
        </button>
        <button
          onClick={() => { setFilter('all'); setSelectedType('new_order') }}
          className={cn(
            'bg-white rounded-xl p-4 border transition-colors text-left',
            selectedType === 'new_order' ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300'
          )}
        >
          <p className="text-2xl font-bold text-indigo-600">{stats.new_order}</p>
          <p className="text-sm text-slate-600">New Orders</p>
        </button>
        <button
          onClick={() => { setFilter('all'); setSelectedType('payment_verified') }}
          className={cn(
            'bg-white rounded-xl p-4 border transition-colors text-left',
            selectedType === 'payment_verified' ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300'
          )}
        >
          <p className="text-2xl font-bold text-green-600">{stats.payment_verified}</p>
          <p className="text-sm text-slate-600">Payments</p>
        </button>
        <button
          onClick={() => { setFilter('all'); setSelectedType('low_stock') }}
          className={cn(
            'bg-white rounded-xl p-4 border transition-colors text-left',
            selectedType === 'low_stock' ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300'
          )}
        >
          <p className="text-2xl font-bold text-orange-600">{stats.low_stock}</p>
          <p className="text-sm text-slate-600">Low Stock</p>
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No notifications found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredNotifications.map((notification) => {
              const Icon = notificationIcons[notification.type] || Info
              const colorClass = notificationColors[notification.type] || 'bg-slate-100 text-slate-700'
              const isUnread = !notification.read

              return (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors',
                    isUnread && 'bg-indigo-50/50'
                  )}
                >
                  {/* Icon */}
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', colorClass)}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className={cn('text-sm font-medium', isUnread ? 'text-slate-900' : 'text-slate-700')}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {new Date(notification.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Data / Actions */}
                    {notification.data && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {notification.data.order_id && (
                          <Link
                            href={`/admin/orders`}
                            className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full hover:bg-indigo-200"
                          >
                            View Order
                          </Link>
                        )}
                        {notification.data.product_id && (
                          <Link
                            href={`/admin/inventory`}
                            className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full hover:bg-orange-200"
                          >
                            View Product
                          </Link>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Mark as read button */}
                  {isUnread && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="flex-shrink-0 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination / Load More placeholder */}
      {filteredNotifications.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-slate-500">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </p>
        </div>
      )}
    </div>
  )
}
