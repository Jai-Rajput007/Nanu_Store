'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Product, CartItem } from '@/types'
import { toast } from 'sonner'
import { useAuth } from './AuthContext'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { getCachedStoreSettings } from '@/lib/store-settings'

interface CartContextType {
  items: CartItem[]
  isLoading: boolean
  itemCount: number
  subtotal: number
  deliveryFee: number
  total: number
  addItem: (product: Product, quantity?: number) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  clearCart: () => Promise<void>
  isInCart: (productId: string) => boolean
  getItemQuantity: (productId: string) => number
  refreshDeliveryFee: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'sbk_cart'

// Get user-specific cart key
const getCartKey = (userId?: string) => userId ? `sbk_cart_${userId}` : CART_STORAGE_KEY

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deliveryFee, setDeliveryFee] = useState(20)
  const { user, isAuthenticated } = useAuth()
  const supabase = createBrowserSupabaseClient()

  // Load cart and delivery fee on mount
  useEffect(() => {
    loadCart()
    loadDeliveryFee()
  }, [user?.id])

  const loadDeliveryFee = async () => {
    const settings = await getCachedStoreSettings()
    setDeliveryFee(settings.delivery_fee)
  }

  const refreshDeliveryFee = async () => {
    await loadDeliveryFee()
  }

  const loadCart = async () => {
    setIsLoading(true)
    try {
      // Clear cart first to prevent showing previous user's items
      setItems([])
      
      if (isAuthenticated && user) {
        // Load from database for logged-in user
        const { data, error } = await supabase
          .from('cart_items')
          .select('*, product:products(*)')
          .eq('user_id', user.id)

        if (data && !error) {
          const cartItems = data.map((item: any) => ({
            product: item.product,
            quantity: item.quantity,
          }))
          setItems(cartItems)
          // Sync to user-specific localStorage
          localStorage.setItem(getCartKey(user.id), JSON.stringify(cartItems))
        }
      } else {
        // User logged out - clear cart, don't load from localStorage
        setItems([])
        // Optional: Load guest cart if needed
        const stored = localStorage.getItem(CART_STORAGE_KEY)
        if (stored) {
          setItems(JSON.parse(stored))
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveCart = async (newItems: CartItem[]) => {
    setItems(newItems)
    
    if (isAuthenticated && user) {
      // Save to user-specific localStorage
      localStorage.setItem(getCartKey(user.id), JSON.stringify(newItems))
      // Sync to database
      const { error } = await supabase
        .from('cart_items')
        .upsert(
          newItems.map(item => ({
            user_id: user.id,
            product_id: item.product.id,
            quantity: item.quantity,
          })),
          { onConflict: 'user_id,product_id' }
        )

      if (error) {
        console.error('Error syncing cart:', error)
      }
    } else {
      // Guest cart - save to generic key
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems))
    }
  }

  const addItem = async (product: Product, quantity: number = 1) => {
    const existingIndex = items.findIndex(item => item.product.id === product.id)
    let newItems: CartItem[]

    if (existingIndex >= 0) {
      const newQuantity = items[existingIndex].quantity + quantity
      newItems = items.map((item, index) =>
        index === existingIndex
          ? { ...item, quantity: newQuantity }
          : item
      )
    } else {
      newItems = [...items, { product, quantity }]
    }

    await saveCart(newItems)
    toast.success(`Added ${product.name} to cart`)
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    const item = items.find(i => i.product.id === productId)
    if (!item) return

    if (quantity <= 0) {
      await removeItem(productId)
      return
    }

    const newItems = items.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    )

    await saveCart(newItems)
  }

  const removeItem = async (productId: string) => {
    const newItems = items.filter(item => item.product.id !== productId)
    await saveCart(newItems)
    toast.success('Item removed from cart')
  }

  const clearCart = async () => {
    setItems([])
    
    if (isAuthenticated && user) {
      // Remove user-specific cart from localStorage
      localStorage.removeItem(getCartKey(user.id))
      // Clear from database
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
    } else {
      localStorage.removeItem(CART_STORAGE_KEY)
    }
  }

  const isInCart = (productId: string) => {
    return items.some(item => item.product.id === productId)
  }

  const getItemQuantity = (productId: string) => {
    const item = items.find(item => item.product.id === productId)
    return item?.quantity || 0
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const total = subtotal + deliveryFee

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading,
        itemCount,
        subtotal,
        deliveryFee,
        total,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        isInCart,
        getItemQuantity,
        refreshDeliveryFee,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
