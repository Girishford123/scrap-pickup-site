import Link from 'next/link'
import { CheckCircle, Truck, Clock, Shield, Phone, Mail, MapPin } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-900">Ford Component Sales</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/request-pickup"
                className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-all font-semibold"
              >
                Request Pickup
              </Link>
              <Link
                href="/admin"
                className="text-blue-900 hover:text-blue-700 font-medium"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Professional Scrap Vehicle
              <br />
              <span className="text-blue-300">Pickup Service</span>
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Fast, reliable, and eco-friendly scrap component collection for Ford vehicles
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/request-pickup"
                className="bg-white text-blue-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg inline-flex items-center justify-center"
              >
                <Truck className="mr-2 h-5 w-5" />
                Schedule Pickup Now
              </Link>
              <a
                href="#how-it-works"
                className="bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-600 transition-all inline-flex items-center justify-center"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="text-5xl font-bold text-blue-900 mb-2">1000+</div>
              <div className="text-gray-600 font-medium">Pickups Completed</div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="text-5xl font-bold text-blue-900 mb-2">24hrs</div>
              <div className="text-gray-600 font-medium">Average Response Time</div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="text-5xl font-bold text-blue-900 mb-2">100%</div>
              <div className="text-gray-600 font-medium">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We provide the most efficient and reliable scrap pickup service in the industry
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-xl hover:shadow-xl transition-shadow bg-blue-50">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900 text-white rounded-full mb-4">
                <Truck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Fast Pickup</h3>
              <p className="text-gray-600">
                Quick response and scheduled pickup within 24-48 hours of request
              </p>
            </div>

            <div className="text-center p-6 rounded-xl hover:shadow-xl transition-shadow bg-green-50">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-full mb-4">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Easy Process</h3>
              <p className="text-gray-600">
                Simple online form, no paperwork hassle, fully digital tracking
              </p>
            </div>

            <div className="text-center p-6 rounded-xl hover:shadow-xl transition-shadow bg-orange-50">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-600 text-white rounded-full mb-4">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600">
                Round-the-clock customer support for all your queries and concerns
              </p>
            </div>

            <div className="text-center p-6 rounded-xl hover:shadow-xl transition-shadow bg-purple-50">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 text-white rounded-full mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Safe & Secure</h3>
              <p className="text-gray-600">
                Professional handling with complete insurance and safety protocols
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get your scrap picked up in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-900 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                  1
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-4">Fill the Form</h3>
                <p className="text-gray-600 mb-4">
                  Complete our simple online pickup request form with your RCRC details and preferred schedule
                </p>
                <Link href="/request-pickup" className="text-blue-900 font-semibold hover:text-blue-700 inline-flex items-center">
                  Start Request →
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-900 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                  2
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-4">Get Confirmation</h3>
                <p className="text-gray-600 mb-4">
                  Receive instant confirmation and our team will contact you to finalize the pickup schedule
                </p>
                <div className="text-green-600 font-semibold inline-flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Verified Process
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-900 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                  3
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-4">Pickup Complete</h3>
                <p className="text-gray-600 mb-4">
                  Our professional team arrives at scheduled time and handles everything safely and efficiently
                </p>
                <div className="text-blue-900 font-semibold inline-flex items-center">
                  <Truck className="mr-2 h-5 w-5" />
                  Quick & Easy
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Schedule Your Pickup?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of satisfied customers who trust us with their scrap component disposal
          </p>
          <Link
            href="/request-pickup"
            className="inline-flex items-center bg-white text-blue-900 px-10 py-5 rounded-lg font-bold text-xl hover:bg-blue-50 transition-all transform hover:scale-105 shadow-2xl"
          >
            <Truck className="mr-3 h-6 w-6" />
            Request Pickup Now
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get In Touch</h2>
            <p className="text-lg text-gray-600">Have questions? We're here to help</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-blue-900" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Phone</h3>
              <p className="text-gray-600">+91 1800-XXX-XXXX</p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-blue-900" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600">support@fordcomponentsales.in</p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-blue-900" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
              <p className="text-gray-600">India</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Ford Component Sales</h3>
              <p className="text-gray-400">
                Professional scrap pickup service for Ford vehicles
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/request-pickup" className="text-gray-400 hover:text-white transition">Request Pickup</Link></li>
                <li><Link href="/admin" className="text-gray-400 hover:text-white transition">Admin Login</Link></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition">How It Works</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">FAQ</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Terms & Conditions</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>+91 1800-XXX-XXXX</li>
                <li>support@fordcomponentsales.in</li>
                <li>India</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Ford Component Sales. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}