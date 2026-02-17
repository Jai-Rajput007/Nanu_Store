import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: 'Shree Bhagvan Singh Kirana Store - Your Trusted Local Store Online',
  description: 'Your trusted local kirana store, now online. Fresh groceries, grains, pulses, spices, oil, snacks, beverages, dairy & household items delivered to your doorstep.',
  keywords: 'kirana store, grocery, online shopping, grains, pulses, spices, dairy, household items, Rajasthan',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-[#FEFCE8]">
        <DirectionProvider direction="ltr">
          <AuthProvider>
            <CartProvider>
              <NotificationProvider>
                <Navbar />
                <main className="min-h-screen bg-[#FEFCE8]">
                  {children}
                </main>
                <Footer />
                <Toaster 
                  position="top-right" 
                  richColors 
                  closeButton
                />
              </NotificationProvider>
            </CartProvider>
          </AuthProvider>
        </DirectionProvider>
      </body>
    </html>
  )
}
