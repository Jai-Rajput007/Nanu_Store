import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function generateOrderId(): string {
  return `SBK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'grains': 'bg-amber-100 text-amber-800',
    'pulses': 'bg-green-100 text-green-800',
    'spices': 'bg-red-100 text-red-800',
    'oil': 'bg-yellow-100 text-yellow-800',
    'snacks': 'bg-orange-100 text-orange-800',
    'beverages': 'bg-blue-100 text-blue-800',
    'dairy': 'bg-cyan-100 text-cyan-800',
    'household': 'bg-purple-100 text-purple-800',
    'default': 'bg-slate-100 text-slate-800',
  }
  return colors[category.toLowerCase()] || colors['default']
}

export function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    'grains': 'Grains (अनाज)',
    'pulses': 'Pulses (दालें)',
    'spices': 'Spices (मसाले)',
    'oil': 'Oil & Ghee (तेल)',
    'snacks': 'Snacks (नाश्ता)',
    'beverages': 'Beverages (पेय)',
    'dairy': 'Dairy (डेयरी)',
    'household': 'Household (घरेलू)',
  }
  return names[category.toLowerCase()] || category
}
