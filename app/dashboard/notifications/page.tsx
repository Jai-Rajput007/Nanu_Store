'use client'

import { Bell, Check, CheckCheck, Package, CreditCard, Truck, AlertCircle, Info } from 'lucide-react'
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
  low_stock: AlertCircle,
}

const notificationColors: Record<NotificationType, string> = {
  order_status: 'bg-blue-100 text-blue-700',
  payment_verified: 'bg-green-100 text-green-700',
  payment_rejected: 'bg-red-100 text-red-700',
  stock_back: 'bg-purple-100 text-purple-700',
  new_order: 'bg-indigo-100 text-indigo-700',
  low_stock: 'bg-orange-100 text-orange-700',
}

export default function UserNotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = useNotifications()

  const stats = {
    all: notifications.length,
    unread: unreadCount,
    orders: notifications.filter(n => n.type === 'order_status').length,
    payments: notifications.filter(n => n.type === 'payment_verified' || n.type === 'payment_rejected').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-600">Stay updated on your orders and payments</p>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-2xl font-bold text-slate-900">{stats.all}</p>
          <p className="text-sm text-slate-600">All</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
          <p className="text-2xl font-bold text-indigo-600">{stats.unread}</p>
          <p className="text-sm text-indigo-600">Unread</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-2xl font-bold text-blue-600">{stats.orders}</p>
          <p className="text-sm text-blue-600">Orders</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-2xl font-bold text-green-600">{stats.payments}</p>
          <p className="text-sm text-green-600">Payments</p>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No notifications yet</p>
            <p className="text-sm text-slate-500 mt-2">
              We'll notify you about your orders, payments, and deliveries
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {notifications.map((notification) => {
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
                            href={`/dashboard/orders`}
                            className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full hover:bg-indigo-200"
                          >
                            View Order
                          </Link>
                        )}
                        {notification.data.payment_status === 'rejected' && (
                          <Link
                            href="/payments"
                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full hover:bg-red-200"
                          >
                            Upload New Proof
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
    </div>
  )
}
