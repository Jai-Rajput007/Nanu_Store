import { createBrowserSupabaseClient } from '@/lib/supabase'

const supabase = createBrowserSupabaseClient()

interface StoreSettings {
  delivery_fee: number
  store_name: string
  contact_phone: string
  enable_cod: boolean
  enable_qr_payment: boolean
}

export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .single()

    if (error || !data) {
      // Return default settings if not found
      return {
        delivery_fee: 20,
        store_name: 'Shree Bhagvan Singh Kirana Store',
        contact_phone: '7828303292',
        enable_cod: true,
        enable_qr_payment: true,
      }
    }

    return {
      delivery_fee: data.delivery_fee ?? 20,
      store_name: data.store_name ?? 'Shree Bhagvan Singh Kirana Store',
      contact_phone: data.contact_phone ?? '7828303292',
      enable_cod: data.enable_cod !== false,
      enable_qr_payment: data.enable_qr_payment !== false,
    }
  } catch (err) {
    console.error('Error fetching store settings:', err)
    return {
      delivery_fee: 20,
      store_name: 'Shree Bhagvan Singh Kirana Store',
      contact_phone: '7828303292',
      enable_cod: true,
      enable_qr_payment: true,
    }
  }
}

// Global cache for settings to avoid repeated fetches
let cachedSettings: StoreSettings | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 60000 // 1 minute

export async function getCachedStoreSettings(): Promise<StoreSettings> {
  const now = Date.now()
  if (cachedSettings && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedSettings
  }
  
  cachedSettings = await getStoreSettings()
  cacheTimestamp = now
  return cachedSettings
}

export function clearSettingsCache() {
  cachedSettings = null
  cacheTimestamp = 0
}
