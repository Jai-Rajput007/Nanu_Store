import Link from 'next/link'
import Image from 'next/image'
import { Phone, MapPin, Clock, Instagram, Facebook } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    shop: [
      { label: 'All Products', href: '/shop' },
      { label: 'Categories', href: '/shop' },
      { label: 'Featured', href: '/shop?featured=true' },
      { label: 'New Arrivals', href: '/shop?sort=newest' },
    ],
    support: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'FAQs', href: '/faqs' },
      { label: 'Delivery Info', href: '/delivery' },
    ],
    account: [
      { label: 'My Account', href: '/dashboard' },
      { label: 'My Orders', href: '/dashboard/orders' },
      { label: 'Cart', href: '/cart' },
      { label: 'Wishlist', href: '/dashboard/wishlist' },
    ],
  }

  return (
    <footer className="bg-slate-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                <Image src="/logo.png" alt="SBK Logo" width={40} height={40} className="object-contain" />
              </div>
              <div>
                <h3 className="font-semibold">Shree Bhagvan Singh</h3>
                <p className="text-xs text-slate-400">Kirana & General Store</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Your trusted local kirana store, now online. Serving the community with 
              fresh groceries and daily essentials since 2004.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2">
              {footerLinks.shop.map((link, index) => (
                <li key={`shop-${index}`}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link, index) => (
                <li key={`support-${index}`}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-0.5 text-indigo-400" />
                <div>
                  <p className="text-sm text-slate-300">7828303292</p>
                  <p className="text-xs text-slate-500">Mon-Sun, 7AM - 9PM</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-indigo-400" />
                <p className="text-sm text-slate-300">
                  Main Market, Near Bus Stand<br />
                  Rajasthan, India
                </p>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 mt-0.5 text-indigo-400" />
                <div>
                  <p className="text-sm text-slate-300">Open 7 Days</p>
                  <p className="text-xs text-slate-500">7:00 AM - 9:00 PM</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {currentYear} Shree Bhagvan Singh Kirana Store. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-sm text-slate-500 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-slate-500 hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
