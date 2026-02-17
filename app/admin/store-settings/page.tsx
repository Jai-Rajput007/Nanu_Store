'use client'

import { useState, useEffect } from 'react'
import { Save, Truck, Store, CreditCard, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { toast } from 'sonner'

const supabase = createBrowserSupabaseClient()

interface StoreSettings {
  delivery_fee: number
  store_name: string
  contact_phone: string
  enable_cod: boolean
  enable_qr_payment: boolean
}

export default function StoreSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>({
    delivery_fee: 20,
    store_name: 'Shree Bhagvan Singh Kirana Store',
    contact_phone: '7828303292',
    enable_cod: true,
    enable_qr_payment: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error)
        return
      }

      if (data) {
        setSettings({
          delivery_fee: data.delivery_fee || 20,
          store_name: data.store_name || 'Shree Bhagvan Singh Kirana Store',
          contact_phone: data.contact_phone || '7828303292',
          enable_cod: data.enable_cod !== false,
          enable_qr_payment: data.enable_qr_payment !== false,
        })
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('store_settings')
        .upsert({
          id: 1,
          delivery_fee: settings.delivery_fee,
          store_name: settings.store_name,
          contact_phone: settings.contact_phone,
          enable_cod: settings.enable_cod,
          enable_qr_payment: settings.enable_qr_payment,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Settings saved successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Store Settings</h1>
        <p className="text-slate-600">Manage delivery charges and store configuration</p>
      </div>

      {/* Settings Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Delivery Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Delivery Settings</h2>
              <p className="text-sm text-slate-500">Configure delivery charges</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Delivery Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={settings.delivery_fee}
                onChange={(e) => setSettings(prev => ({ ...prev, delivery_fee: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-sm text-slate-500 mt-1">
                Set to 0 for free delivery
              </p>
            </div>
          </div>
        </div>

        {/* Store Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Store Information</h2>
              <p className="text-sm text-slate-500">Basic store details</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Store Name
              </label>
              <input
                type="text"
                value={settings.store_name}
                onChange={(e) => setSettings(prev => ({ ...prev, store_name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contact Phone
              </label>
              <input
                type="text"
                value={settings.contact_phone}
                onChange={(e) => setSettings(prev => ({ ...prev, contact_phone: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Payment Options</h2>
              <p className="text-sm text-slate-500">Enable/disable payment methods</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={settings.enable_cod}
                onChange={(e) => setSettings(prev => ({ ...prev, enable_cod: e.target.checked }))}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <div>
                <p className="font-medium text-slate-900">Cash on Delivery</p>
                <p className="text-sm text-slate-500">Allow COD payments</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={settings.enable_qr_payment}
                onChange={(e) => setSettings(prev => ({ ...prev, enable_qr_payment: e.target.checked }))}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <div>
                <p className="font-medium text-slate-900">QR Code Payment</p>
                <p className="text-sm text-slate-500">Allow QR/UPI payments</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          isLoading={saving}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}
