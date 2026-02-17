'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MapPin, Phone, CreditCard, Upload, Check, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { uploadPaymentProof } from '@/lib/storage'
import { notifyOrderPlaced, notifyPaymentProofUploaded } from '@/lib/notifications'

const checkoutSchema = z.object({
  address: z.string().min(10, 'Please enter a complete address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  delivery_instructions: z.string().optional(),
  payment_method: z.enum(['qr_code', 'cash_on_delivery']),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, subtotal, deliveryFee, clearCart } = useCart()
  const { user, profile, isAuthenticated } = useAuth()
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      address: profile?.address || '',
      phone: profile?.phone || '',
      payment_method: 'qr_code',
    },
  })

  const paymentMethod = watch('payment_method')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout')
      return
    }
    if (items.length === 0 && !orderPlaced) {
      router.push('/cart')
    }
  }, [isAuthenticated, items.length, orderPlaced, router])

  const onSubmit = async (data: CheckoutForm) => {
    if (!user) {
      toast.error('Please sign in to place an order')
      router.push('/login?redirect=/checkout')
      return
    }
    if (paymentMethod === 'qr_code' && !paymentProof) {
      toast.error('Please upload payment screenshot')
      return
    }

    setIsSubmitting(true)
    const supabase = createBrowserSupabaseClient()

    try {
      const displayOrderId = 'SBK-' + Date.now().toString(36).toUpperCase()

      let paymentProofUrl: string | null = null
      if (paymentMethod === 'qr_code' && paymentProof) {
        paymentProofUrl = await uploadPaymentProof(paymentProof, displayOrderId)
      }

      const { data: orderRow, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_id: displayOrderId,
          user_id: user.id,
          status: paymentMethod === 'cash_on_delivery' ? 'payment_verified' : 'pending_payment',
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cash_on_delivery' ? 'verified' : 'pending',
          payment_proof_url: paymentProofUrl,
          subtotal: total,
          delivery_fee: deliveryFee,
          total: total,
          address: data.address,
          phone: data.phone,
          delivery_instructions: data.delivery_instructions || null,
        })
        .select('id')
        .single()

      if (orderError) {
        toast.error(orderError.message || 'Failed to create order')
        setIsSubmitting(false)
        return
      }

      const orderUuid = orderRow.id

      for (const item of items) {
        const itemTotal = item.product.price * item.quantity
        await supabase.from('order_items').insert({
          order_id: orderUuid,
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          total: itemTotal,
        })
      }

      // Send notifications
      await notifyOrderPlaced({
        id: orderUuid,
        order_id: displayOrderId,
        user_id: user.id,
        total: total,
        payment_method: paymentMethod,
        user_name: profile?.full_name,
      })

      // If QR code payment, notify admins about payment proof
      if (paymentMethod === 'qr_code' && paymentProofUrl) {
        await notifyPaymentProofUploaded({
          id: orderUuid,
          order_id: displayOrderId,
          user_id: user.id,
          total: total,
          user_name: profile?.full_name,
        })
      }

      await clearCart()
      setOrderId(displayOrderId)
      setOrderPlaced(true)
      toast.success('Order placed successfully!')
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      setPaymentProof(file)
    }
  }

  if (orderPlaced) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Order Placed!</h2>
          <p className="mt-2 text-slate-600">
            Your order <span className="font-semibold">{orderId}</span> has been placed successfully.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            {paymentMethod === 'qr_code' 
              ? 'Your payment is pending verification. You will receive a notification once verified.'
              : 'Pay cash on delivery when your order arrives.'}
          </p>
          <div className="mt-8 space-y-3">
            <Link href="/dashboard/orders">
              <Button className="w-full">View My Orders</Button>
            </Link>
            <Link href="/shop">
              <Button variant="outline" className="w-full">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/cart" className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Cart
      </Link>

      <h1 className="text-3xl font-bold text-slate-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Delivery & Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Details */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Delivery Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Full Address</label>
                <textarea
                  {...register('address')}
                  rows={3}
                  placeholder="Enter your complete delivery address"
                  className="mt-1 w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Phone Number</label>
                <div className="mt-1 relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    {...register('phone')}
                    type="tel"
                    placeholder="Enter phone number for delivery"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Delivery Instructions (Optional)</label>
                <input
                  {...register('delivery_instructions')}
                  type="text"
                  placeholder="Any special instructions for delivery"
                  className="mt-1 w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Payment Method
            </h2>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border-2 border-indigo-600 rounded-xl cursor-pointer bg-indigo-50">
                <input
                  {...register('payment_method')}
                  type="radio"
                  value="qr_code"
                  className="mt-1 w-4 h-4 text-indigo-600"
                />
                <div>
                  <span className="font-medium text-slate-900">PhonePe QR Code (Recommended)</span>
                  <p className="text-sm text-slate-600">Scan and pay using any UPI app</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300">
                <input
                  {...register('payment_method')}
                  type="radio"
                  value="cash_on_delivery"
                  className="mt-1 w-4 h-4 text-indigo-600"
                />
                <div>
                  <span className="font-medium text-slate-900">Cash on Delivery</span>
                  <p className="text-sm text-slate-600">Pay when you receive your order</p>
                </div>
              </label>
            </div>

            {/* QR Code Display */}
            {paymentMethod === 'qr_code' && (
              <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 pt-20">
                <p className="text-sm font-medium text-slate-700 mb-4">
                  Scan this QR code with any UPI app and pay exactly {formatPrice(total)}
                </p>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-sm">
                    <Image
                      src="/payment-qr.jpg"
                      alt="Payment QR Code"
                      width={200}
                      height={200}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-600">Pay to: Komal Singh Rajput</p>
                    <p className="text-lg font-bold text-slate-900">{formatPrice(total)}</p>
                  </div>
                </div>

                {/* Upload Payment Proof */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Upload Payment Screenshot
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="payment-proof"
                    />
                    <label
                      htmlFor="payment-proof"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-sm text-slate-600">
                        {paymentProof ? paymentProof.name : 'Click to upload screenshot'}
                      </span>
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Max file size: 5MB (JPG, PNG)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{item.product.name}</p>
                    <p className="text-slate-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-medium">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Delivery Fee</span>
                <span className="font-medium">
                  {deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-xl font-bold text-slate-900">{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-6"
              size="lg"
              isLoading={isSubmitting}
              disabled={paymentMethod === 'qr_code' && !paymentProof}
            >
              {paymentMethod === 'qr_code' ? 'Place Order & Upload Proof' : 'Place Order (Cash on Delivery)'}
            </Button>

            {paymentMethod === 'qr_code' && !paymentProof && (
              <p className="mt-2 text-xs text-red-600 text-center">
                Please upload payment screenshot to continue
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
