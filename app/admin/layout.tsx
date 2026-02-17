'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { 
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  Truck,
  BarChart3,
  LogOut,
  Store,
  Settings
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/inventory', label: 'Inventory', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/deliveries', label: 'Deliveries', icon: Truck },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/store-settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, signOut, isAdmin, isLoading } = useAuth()
  const router = useRouter()

  // Redirect non-admin users away from admin routes after auth state resolves
  // Protection: Client-side check via AuthContext + login flow requires admin credentials
  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return
    
    // If user is null (not logged in), redirect to login
    if (!user) {
      router.push('/login')
      return
    }
    
    // Only redirect if user is confirmed to be a non-admin (customer)
    // This prevents redirecting during the brief moment when auth state is restoring
    if (!isAdmin) {
      router.push('/')
    }
  }, [isAdmin, isLoading, user, router])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Loading state - verifying admin status from auth context */}
      {isLoading && (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Store className="w-8 h-8 text-white" />
            </div>
            <p className="text-slate-600">Loading admin panel...</p>
          </div>
        </div>
      )}

      {/* Not Authorized - for confirmed non-admin users */}
      {!isLoading && user && !isAdmin && (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
            <p className="text-slate-600 mb-4">You don&apos;t have permission to access the admin panel.</p>
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Admin Panel - only visible if auth is loaded and user is admin */}
      {!isLoading && isAdmin && (
        <>
          {/* Admin Header */}
          <header className="bg-slate-900 text-white sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-bold">Admin Panel</h1>
                  <p className="text-xs text-slate-400">Shree Bhagvan Singh Store</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-300">{user?.full_name}</span>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </header>

          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar */}
              <aside className="lg:w-64 flex-shrink-0">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
                  <nav className="p-2">
                    {sidebarLinks.map((link) => {
                      const Icon = link.icon
                      const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
                      
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
                  </nav>
                </div>
              </aside>

              {/* Main Content */}
              <main className="flex-1">
                {children}
              </main>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
