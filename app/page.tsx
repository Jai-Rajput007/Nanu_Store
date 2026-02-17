'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowRight,
  Search,
  Package,
  RefreshCw,
  Truck,
  Shield,
  Award,
  Users,
  ShoppingBag,
  Phone,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import ProductCard from '@/components/ProductCard'
import { Product } from '@/types'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

const supabase = createBrowserSupabaseClient()

type CategoryRecord = { id: string; name: string; nameHindi?: string; icon?: string; color?: string }

const defaultCategories: CategoryRecord[] = []

const features = [
  { icon: Truck, title: 'Free Delivery', desc: 'Free delivery on orders above ₹500' },
  { icon: Package, title: 'Fresh Stock', desc: 'Daily restocked fresh products' },
  { icon: Shield, title: 'Best Prices', desc: 'Competitive local market rates' },
  { icon: RefreshCw, title: 'Easy Returns', desc: 'Hassle-free return policy' },
]

const whyChooseUs = [
  { icon: Award, text: 'Quality promise on every product' },
  { icon: Users, text: 'Direct sourcing, fair pricing' },
  { icon: Shield, text: 'Trusted by the community since 2004' },
]

const heroWords = 'Your Trusted Local Kirana Store,'.split(' ')
const heroHighlight = 'Now Online'

export default function HomePage() {
  const router = useRouter()
  const heroRef = useRef<HTMLDivElement>(null)
  const heroContentRef = useRef<HTMLDivElement>(null)
  const heroWordsRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const categoriesRef = useRef<HTMLDivElement>(null)
  const productsRef = useRef<HTMLDivElement>(null)
  const whyRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoriesState, setCategoriesState] = useState<CategoryRecord[]>([])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase.from('categories').select('id,name,name_hindi,icon').order('name')
        if (!error && data && Array.isArray(data) && data.length > 0) {
          setCategoriesState((data as any).map((c: any) => ({ id: c.id, name: c.name, nameHindi: c.name_hindi || '', icon: c.icon || '' })))
        } else {
          setCategoriesState([])
        }
      } catch (err) {
        setCategoriesState(defaultCategories)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('featured', true)
        .limit(8)
      if (!error && data) setFeaturedProducts(data)
      setLoading(false)
    }
    fetchFeaturedProducts()
  }, [])

  useEffect(() => {
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      // Hero: staggered word reveal + tagline + search + buttons
      const wordSpans = heroWordsRef.current?.querySelectorAll('.hero-word')
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      if (wordSpans?.length) {
        tl.fromTo(
          wordSpans,
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: prefersReducedMotion ? 0.01 : 0.5, stagger: prefersReducedMotion ? 0 : 0.06 }
        )
      }
      tl.fromTo(
        '.hero-highlight',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: prefersReducedMotion ? 0.01 : 0.5 },
        '-=0.2'
      )
      tl.fromTo(
        '.hero-tagline',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: prefersReducedMotion ? 0.01 : 0.5 },
        '-=0.2'
      )
      tl.fromTo(
        '.hero-search',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: prefersReducedMotion ? 0.01 : 0.4 },
        '-=0.1'
      )
      tl.fromTo(
        '.hero-ctas',
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: prefersReducedMotion ? 0.01 : 0.4 },
        '-=0.1'
      )

      // Features
      gsap.from('.feature-card', {
        y: 50,
        opacity: 0,
        duration: prefersReducedMotion ? 0.01 : 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: featuresRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      })

      // Stats
      gsap.from('.stat-item', {
        scale: 0.8,
        opacity: 0,
        duration: prefersReducedMotion ? 0.01 : 0.5,
        stagger: 0.1,
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
      })

      // Categories
      gsap.from('.category-card', {
        y: 40,
        opacity: 0,
        duration: prefersReducedMotion ? 0.01 : 0.5,
        stagger: 0.06,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: categoriesRef.current,
          start: 'top 82%',
          toggleActions: 'play none none none',
        },
      })

      // Section titles
      gsap.from('.section-title', {
        y: 30,
        opacity: 0,
        duration: prefersReducedMotion ? 0.01 : 0.5,
        scrollTrigger: {
          trigger: categoriesRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      })

      // Featured products
      gsap.from('.product-card', {
        y: 45,
        opacity: 0,
        duration: prefersReducedMotion ? 0.01 : 0.5,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: productsRef.current,
          start: 'top 82%',
          toggleActions: 'play none none none',
        },
      })

      // Why Choose Us
      gsap.from('.why-item', {
        x: -30,
        opacity: 0,
        duration: prefersReducedMotion ? 0.01 : 0.5,
        stagger: 0.1,
        scrollTrigger: {
          trigger: whyRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      })

      // About preview
      gsap.from('.about-content', {
        x: -40,
        opacity: 0,
        duration: prefersReducedMotion ? 0.01 : 0.6,
        scrollTrigger: {
          trigger: aboutRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      })
      gsap.from('.about-image', {
        x: 40,
        opacity: 0,
        duration: prefersReducedMotion ? 0.01 : 0.6,
        scrollTrigger: {
          trigger: aboutRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      })
    }, heroRef.current ?? undefined)

    return () => ctx.revert()
  }, [])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push('/shop')
    }
  }

  return (
    <div className="space-y-0 pb-16">
      {/* Banner only – full image, no overlay content */}
      <section className="relative w-full bg-[var(--warm-cream,#FEFCE8)] pt-16 sm:pt-20 pb-6 sm:pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative w-full max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-indigo-600/10 to-amber-200/10 p-2 sm:p-3">
            <Image
              src="/banner.jpg"
              alt="Shree Bhagvan Singh Kirana & General Store Banner"
              width={1920}
              height={600}
              className="w-full h-auto object-contain rounded-2xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* Hero content (text, search, CTAs) below banner */}
      <section
        ref={heroRef}
        className="bg-[var(--warm-cream,#FEFCE8)] pb-12 sm:pb-16 lg:pb-20"
      >
        <div
          ref={heroContentRef}
          className="container mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight font-serif">
              <span ref={heroWordsRef} className="inline-flex flex-wrap gap-x-2 gap-y-1">
                {heroWords.map((word, i) => (
                  <span key={i} className="hero-word inline-block">
                    {word}
                  </span>
                ))}
              </span>
              <br />
              <span className="hero-highlight text-orange-500">{heroHighlight}</span>
            </h1>
            <p className="hero-tagline mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-slate-700 max-w-xl">
              Fresh groceries, daily essentials, and more delivered to your doorstep.
              Serving the community with quality products since 2004.
            </p>

            <div className="hero-search mt-6 sm:mt-8 flex flex-wrap items-center gap-2 bg-white rounded-full p-2 max-w-xl border border-slate-200 shadow-sm">
              <Search className="w-5 h-5 text-slate-500 ml-3 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for products..."
                className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none px-2 text-sm sm:text-base min-w-0"
              />
              <Button onClick={handleSearch} className="rounded-full px-4 sm:px-6 flex-shrink-0">
                Search
              </Button>
            </div>

            <div className="hero-ctas mt-6 sm:mt-8 flex flex-wrap gap-3 sm:gap-4">
              <Link href="/shop">
                <Button size="lg" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                  Shop Now
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/shop">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-300 text-slate-800 hover:bg-slate-100"
                >
                  View Categories
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="container mx-auto px-4 py-16 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card bg-white rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-slate-100"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                <feature.icon className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats strip */}
      <section ref={statsRef} className="border-y border-amber-200/60 bg-white/60 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-10 sm:gap-16">
            <div className="stat-item text-center">
              <div className="text-2xl sm:text-3xl font-bold text-indigo-600">20+</div>
              <div className="text-sm text-slate-600 mt-1">Years of Trust</div>
            </div>
            <div className="stat-item text-center">
              <div className="text-2xl sm:text-3xl font-bold text-orange-500">8</div>
              <div className="text-sm text-slate-600 mt-1">Product Categories</div>
            </div>
            <div className="stat-item text-center">
              <div className="text-2xl sm:text-3xl font-bold text-amber-600">Free</div>
              <div className="text-sm text-slate-600 mt-1">Delivery above ₹500</div>
            </div>
            <div className="stat-item text-center">
              <div className="text-2xl sm:text-3xl font-bold text-slate-800">
                <Phone className="w-8 h-8 inline-block" />
              </div>
              <div className="text-sm text-slate-600 mt-1">7828303292</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section ref={categoriesRef} className="container mx-auto px-4 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="section-title text-3xl sm:text-4xl font-bold text-slate-900 font-serif">
            Shop by Category
          </h2>
          <p className="mt-2 text-slate-600 max-w-xl mx-auto">
            Grains, pulses, spices, oil, snacks, beverages, dairy & household — all under one roof.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categoriesState.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.id}`}
              className="category-card group relative overflow-hidden rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border border-slate-100 bg-white"
            >
              <div
                className={cn(
                  'absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity',
                  category.color || ''
                )}
              />
              <div className="relative z-10">
                <span className="text-4xl sm:text-5xl">{category.icon}</span>
                <h3 className="mt-4 font-semibold text-slate-900">{category.name}</h3>
                <p className="text-sm text-slate-600">{category.nameHindi}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/shop">
            <Button variant="outline" className="gap-2">
              <ShoppingBag className="w-4 h-4" />
              Browse All Products
            </Button>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section ref={productsRef} className="container mx-auto px-4 py-16 sm:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <h2 className="section-title text-3xl sm:text-4xl font-bold text-slate-900 font-serif">
              Featured Products
            </h2>
            <p className="mt-2 text-slate-600">Handpicked favorites for your home</p>
          </div>
          <Link href="/shop?featured=true">
            <Button variant="outline" className="gap-2">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-80 bg-slate-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-600">No featured products yet. Check back soon!</p>
            <Link href="/shop" className="mt-4 inline-block">
              <Button>Explore Shop</Button>
            </Link>
          </div>
        )}
      </section>

      {/* Why Choose Us */}
      <section ref={whyRef} className="container mx-auto px-4 py-16 sm:py-20">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 sm:p-12 text-white">
          <h2 className="text-2xl sm:text-3xl font-bold font-serif mb-8 text-center">
            Why Shop With Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whyChooseUs.map((item, i) => (
              <div key={i} className="why-item flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-6 h-6" />
                </div>
                <p className="text-white/95 text-lg">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section ref={aboutRef} className="container mx-auto px-4 py-16 sm:py-20">
        <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100">
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="about-content p-8 lg:p-12 flex flex-col justify-center">
              <span className="text-orange-500 font-semibold uppercase tracking-wide text-sm">
                About Us
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900 font-serif">
                Two Generations of Trust & Service
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed text-lg">
                Established in 2004, Shree Bhagvan Singh Kirana Store has been serving the
                community with quality products and honest prices. Under the leadership of
                Bhagvan Singh Rajput and the digital transformation by Komal Singh Rajput, we
                bring our trusted local store to your fingertips.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/about">
                  <Button size="lg" className="gap-2">
                    Know More
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
            <div className="about-image relative bg-slate-100 min-h-[320px] lg:min-h-[420px] flex items-center justify-center">
              <div className="relative w-full h-full max-w-xl max-h-full p-4">
                <Image
                  src="/shop-poster.jpg"
                  alt="Shree Bhagvan Singh Kirana Store"
                  fill
                  className="object-contain object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
