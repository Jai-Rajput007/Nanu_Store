'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Bell, ShoppingCart, Truck, User, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const pathname = usePathname()
  const { isAuthenticated, user, signOut, isAdmin } = useAuth()
  const { itemCount } = useCart()
  const { unreadCount } = useNotifications()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: 'Shop' },
    { href: '/payments', label: 'Payments' },
    { href: '/about', label: 'About' },
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo - Left */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg overflow-hidden group-hover:scale-105 transition-transform">
              <Image src="/logo.png" alt="SBK Logo" width={40} height={40} className="object-contain" />
            </div>
            <div className="hidden sm:block">
              <div className="font-serif font-bold text-slate-900 text-sm md:text-base">
                Shree Bhagvan Singh
              </div>
              <div className="text-xs text-slate-600">Kirana Store</div>
            </div>
          </Link>

          {/* Desktop Navigation - Center */}
          <div className="hidden lg:flex items-center flex-1 justify-center">
            <ul className="flex items-center gap-1 list-none">
              {navLinks.map((link) => (
                <li key={`nav-${link.href}`}>
                  <Link
                    href={link.href}
                    className={cn(
                      'px-4 py-2 rounded-md text-sm font-medium transition-colors block',
                      isActive(link.href)
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Right side: Notification, Delivery, Cart, Login/Register */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Notification Button */}
            {isAuthenticated && (
              <Link
                href={isAdmin ? "/admin/notifications" : "/dashboard/notifications"}
                className="relative p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Delivery Button */}
            {isAuthenticated && (
              <Link
                href={isAdmin ? "/admin/deliveries" : "/dashboard/deliveries"}
                className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors hidden sm:flex items-center gap-2"
                aria-label="Deliveries"
              >
                <Truck className="w-5 h-5" />
                <span className="hidden md:inline text-sm font-medium">Delivery</span>
              </Link>
            )}

            {/* Cart Icon */}
            <Link
              href="/cart"
              className="relative p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* Login/Register or User Menu */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium">
                  <User className="w-4 h-4" />
                  <span className="hidden md:inline">{user?.full_name?.split(' ')[0] || 'Account'}</span>
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="p-2">
                    {!isAdmin && (
                      <Link
                        href="/dashboard"
                        className="block px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100"
                      >
                        Dashboard
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="block px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={signOut}
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 inline mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="md">
                  Login / Register
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 py-4">
            <ul className="flex flex-col gap-2 list-none">
              {navLinks.map((link) => (
                <li key={`mobile-${link.href}`}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'block px-4 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive(link.href)
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {isAuthenticated && (
                <>
                  {!isAdmin && (
                    <>
                      <li>
                        <Link
                          href="/dashboard/notifications"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <Bell className="w-4 h-4" />
                          Notifications
                          {unreadCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                              {unreadCount}
                            </span>
                          )}
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/dashboard/deliveries"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <Truck className="w-4 h-4" />
                          My Deliveries
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <User className="w-4 h-4" />
                          Dashboard
                        </Link>
                      </li>
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <li>
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Admin Panel
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/admin/deliveries"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <Truck className="w-4 h-4" />
                          Deliveries
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/admin/notifications"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <Bell className="w-4 h-4" />
                          Notifications
                          {unreadCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                              {unreadCount}
                            </span>
                          )}
                        </Link>
                      </li>
                    </>
                  )}
                  <li>
                    <button
                      onClick={() => {
                        signOut()
                        setMobileMenuOpen(false)
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </nav>
  )
}
