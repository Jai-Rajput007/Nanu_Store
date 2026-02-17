'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { 
  ShoppingBag, 
  MapPin, 
  CreditCard, 
  User, 
  Bell, 
  Heart,
  LogOut,
  LayoutDashboard
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const sidebarLinks = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/orders', label: 'My Orders', icon: ShoppingBag },
  { href: '/dashboard/track', label: 'Track Delivery', icon: MapPin },
  { href: '/dashboard/payments', label: 'My Payments', icon: CreditCard },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut, isLoading, isAdmin } = useAuth()

  // Protect dashboard routes - only authenticated customers can access
  useEffect(() => {
    if (isLoading) return

    // Not logged in → send to login
    if (!user) {
      router.replace('/login')
      return
    }

    // Admin users should use admin panel, not customer dashboard
    if (isAdmin) {
      router.replace('/admin')
      return
    }
  }, [user, isLoading, isAdmin, router])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <LayoutDashboard className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated or is admin (will redirect)
  if (!user || isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
            {/* User Info */}
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-purple-600">
              <p className="text-white font-semibold">{user?.full_name}</p>
              <p className="text-white/80 text-sm">{user?.phone}</p>
            </div>

            {/* Navigation */}
            <nav className="p-2">
              {sidebarLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                )
              })}

              <button
                onClick={signOut}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full mt-4"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
