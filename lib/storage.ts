import { createBrowserSupabaseClient } from './supabase'

const BUCKET_PRODUCTS = 'product-images'
const BUCKET_PAYMENT_PROOFS = 'payment-proofs'

/**
 * Upload product image to Supabase Storage.
 */
export async function uploadProductImage(file: File, productId: string): Promise<string> {
  const supabase = createBrowserSupabaseClient()
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${productId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET_PRODUCTS).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  })

  if (error) throw error

  const { data: urlData } = supabase.storage.from(BUCKET_PRODUCTS).getPublicUrl(path)
  return urlData.publicUrl
}

/**
 * Upload payment proof image to Supabase Storage.
 */
export async function uploadPaymentProof(file: File, orderId: string): Promise<string> {
  const supabase = createBrowserSupabaseClient()
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${orderId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET_PAYMENT_PROOFS).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw error

  const { data: urlData } = supabase.storage.from(BUCKET_PAYMENT_PROOFS).getPublicUrl(path)
  return urlData.publicUrl
}
