import { createBrowserSupabaseClient } from './supabase'
import { NotificationType } from '@/types'

const supabase = createBrowserSupabaseClient()

// Get admin user IDs
async function getAdminIds(): Promise<string[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
  return (data || []).map(p => p.id)
}

// Create notification for specific user
export async function createNotification({
  userId,
  type,
  title,
  message,
  data,
}: {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
}) {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      data,
      read: false,
    })
    if (error) console.error('Failed to create notification:', error)
  } catch (err) {
    console.error('Notification creation error:', err)
  }
}

// Notify all admins
export async function notifyAdmins({
  type,
  title,
  message,
  data,
}: {
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
}) {
  const adminIds = await getAdminIds()
  for (const adminId of adminIds) {
    await createNotification({ userId: adminId, type, title, message, data })
  }
}

// Notify specific user
export async function notifyUser({
  userId,
  type,
  title,
  message,
  data,
}: {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
}) {
  await createNotification({ userId, type, title, message, data })
}

// Helper: New order placed → notify admins and user
export async function notifyOrderPlaced(order: {
  id: string
  order_id: string
  user_id: string
  total: number
  payment_method: string
  user_name?: string
}) {
  // Notify user
  await notifyUser({
    userId: order.user_id,
    type: 'order_status',
    title: 'Order Placed Successfully',
    message: `Your order ${order.order_id} has been placed. ${order.payment_method === 'qr_code' ? 'Please complete the payment.' : 'Pay on delivery.'}`,
    data: { order_id: order.id, order_display_id: order.order_id, total: order.total },
  })

  // Notify admins
  await notifyAdmins({
    type: 'new_order',
    title: 'New Order Received',
    message: `Order ${order.order_id} from ${order.user_name || 'a customer'} for ${order.total}`,
    data: { order_id: order.id, order_display_id: order.order_id, total: order.total, user_id: order.user_id },
  })
}

// Helper: Payment proof uploaded → notify admins
export async function notifyPaymentProofUploaded(order: {
  id: string
  order_id: string
  user_id: string
  total: number
  user_name?: string
}) {
  await notifyAdmins({
    type: 'payment_verified',
    title: 'Payment Proof Uploaded',
    message: `Payment proof uploaded for order ${order.order_id} by ${order.user_name || 'a customer'}`,
    data: { order_id: order.id, order_display_id: order.order_id, total: order.total, user_id: order.user_id },
  })
}

// Helper: New user registered → notify admins
export async function notifyNewUser(user: {
  id: string
  full_name: string
  email: string
  phone: string
}) {
  await notifyAdmins({
    type: 'new_order', // reusing type or could add 'new_user' to types
    title: 'New User Registered',
    message: `${user.full_name} just registered with email ${user.email}`,
    data: { user_id: user.id, full_name: user.full_name, email: user.email, phone: user.phone },
  })
}

// Helper: Low stock alert → notify admins
export async function notifyLowStock(product: {
  id: string
  name: string
  stock: number
  threshold?: number
}) {
  await notifyAdmins({
    type: 'low_stock',
    title: 'Low Stock Alert',
    message: `${product.name} is running low. Only ${product.stock} units left.`,
    data: { product_id: product.id, product_name: product.name, stock: product.stock },
  })
}
