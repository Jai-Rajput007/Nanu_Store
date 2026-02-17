import Image from 'next/image'
import { Phone, MapPin, Clock, Award, Users, Heart } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="pb-16 pt-20">
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center bg-slate-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full max-w-4xl px-4">
            <Image
              src="/shop-poster.jpg"
              alt="Shop Poster"
              fill
              className="object-contain object-center"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-slate-900/40" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white">About Us</h1>
          <p className="mt-4 text-lg text-slate-200 max-w-2xl">
            Serving our community with quality products and honest prices since 2004
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900">Our Story</h2>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed">
            Shree Bhagvan Singh Kirana & General Store was established in 2004 with a simple mission: 
            to provide the community with quality grocery products at fair prices. What started as 
            a small family business has grown into a trusted name in the neighborhood, known for 
            our commitment to quality and customer service.
          </p>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            Today, under the leadership of Bhagvan Singh Rajput and the digital vision of 
            Komal Singh Rajput, we are bringing our trusted local store online to serve you better.
          </p>
        </div>
      </section>

      {/* Owners Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Meet Our Team</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Bhagvan Singh */}
            <div className="bg-slate-50 rounded-2xl overflow-hidden shadow-lg">
              <div className="relative h-80">
                <Image
                  src="/owner-bhagvan.jpg"
                  alt="Bhagvan Singh Rajput"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900">Bhagvan Singh Rajput</h3>
                <p className="text-orange-600 font-medium">Founder & Senior Proprietor</p>
                <p className="mt-3 text-slate-600">
                  With over 20 years of experience in the kirana business, Bhagvan Singh Rajput 
                  has built the store on principles of honesty, quality, and customer trust. 
                  His deep understanding of local needs and traditional business values have 
                  made the store a community staple.
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                  <Award className="w-4 h-4" />
                  <span>20+ Years Experience</span>
                </div>
              </div>
            </div>

            {/* Komal Singh */}
            <div className="bg-slate-50 rounded-2xl overflow-hidden shadow-lg">
              <div className="relative h-80">
                <Image
                  src="/owner-komal.jpg"
                  alt="Komal Singh Rajput"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900">Komal Singh Rajput</h3>
                <p className="text-orange-600 font-medium">Co-owner & Operations Manager</p>
                <p className="mt-3 text-slate-600">
                  Leading the digital transformation of our family business, Komal Singh Rajput 
                  brings modern efficiency while maintaining traditional values. His vision is 
                  to make quality groceries accessible to everyone through technology.
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                  <Users className="w-4 h-4" />
                  <span>Digital Transformation Lead</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Why Choose Us</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <Award className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">Quality Promise</h3>
            <p className="mt-2 text-slate-600">
              We carefully source our products to ensure the highest quality for our customers.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">Direct Sourcing</h3>
            <p className="mt-2 text-slate-600">
              We work directly with farmers and manufacturers to bring you the best prices.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">Community First</h3>
            <p className="mt-2 text-slate-600">
              We believe in fair pricing and serving our community with honesty and respect.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Visit Our Store</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <MapPin className="w-6 h-6 text-orange-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Address</h3>
                <p className="mt-1 text-slate-400">
                  Main Market, Near Bus Stand<br />
                  Rajasthan, India
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="w-6 h-6 text-orange-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Contact</h3>
                <p className="mt-1 text-slate-400">7828303292</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-orange-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Hours</h3>
                <p className="mt-1 text-slate-400">
                  Open 7 Days<br />
                  7:00 AM - 9:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
