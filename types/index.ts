export type UserRole = 'customer' | 'admin'

export interface User {
  id: string
  email: string
  phone: string
  full_name: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  full_name: string
  phone: string
  email?: string
  address?: string
  city?: string
  pincode?: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at: string
}

export type Category = 
  | 'grains' 
  | 'pulses' 
  | 'spices' 
  | 'oil' 
  | 'snacks' 
  | 'beverages' 
  | 'dairy' 
  | 'household'

export interface Product {
  id: string
  name: string
  name_hindi: string
  category: Category
  price: number
  unit: string
  stock: number
  description: string
  image_url?: string
  featured: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

export type OrderStatus = 
  | 'pending_payment' 
  | 'payment_verified' 
  | 'processing' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'cancelled'

export type PaymentMethod = 'qr_code' | 'cash_on_delivery'

export type PaymentStatus = 'pending' | 'verified' | 'rejected'

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product: Product
  quantity: number
  price: number
  total: number
}

export interface Order {
  id: string
  order_id: string | null
  user_id: string
  user?: Profile
  status: OrderStatus
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  payment_proof_url?: string
  items?: OrderItem[]
  subtotal: number
  delivery_fee: number
  total: number
  address: string
  phone: string
  delivery_instructions?: string
  delivery_date?: string
  delivered_at?: string
  created_at: string
  updated_at: string
}

export type NotificationType = 
  | 'order_status' 
  | 'payment_verified' 
  | 'payment_rejected' 
  | 'stock_back' 
  | 'new_order' 
  | 'low_stock'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  created_at: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface CategoryInfo {
  id: Category
  name: string
  nameHindi: string
  icon: string
  color: string
}
