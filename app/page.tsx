import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <h1 className="text-2xl font-bold">Ford Component Sales</h1>
            
            {/* Login Buttons */}
            <div className="flex items-center space-x-3">
              <Link
                href="/login/requestor"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold transition"
              >
                Customer Login
              </Link>
              <Link
                href="/login/admin"
                className="bg-white text-blue-900 px-6 py-2 rounded-lg hover:bg-blue-50 font-semibold transition"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Pickup Request Button */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Professional Scrap Vehicle
            <br />
            <span className="text-blue-300">Pickup Service</span>
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Fast, reliable, and eco-friendly scrap component collection for Ford vehicles
          </p>
          
          {/* Request Pickup Button */}
          <Link
            href="/request-pickup"
            className="inline-block bg-white text-blue-900 px-10 py-5 rounded-lg font-bold text-xl hover:bg-blue-50 shadow-2xl transform hover:scale-105 transition"
          >
            📋 Request Pickup
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white p-8 rounded-lg shadow-md border-l-4 border-blue-500">
              <div className="text-5xl font-bold text-blue-900 mb-2">1000+</div>
              <div className="text-gray-600 font-medium">Pickups Completed</div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md border-l-4 border-blue-500">
              <div className="text-5xl font-bold text-blue-900 mb-2">24hrs</div>
              <div className="text-gray-600 font-medium">Average Response Time</div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md border-l-4 border-blue-500">
              <div className="text-5xl font-bold text-blue-900 mb-2">100%</div>
              <div className="text-gray-600 font-medium">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple 3-step process</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">1. Fill the Form</h3>
              <p className="text-gray-600 mb-4">
                Complete our simple online pickup request form with your details
              </p>
              <Link 
                href="/request-pickup"
                className="text-blue-900 font-semibold hover:text-blue-700"
              >
                Start Request →
              </Link>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-xl">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">2. Get Confirmation</h3>
              <p className="text-gray-600">
                Receive instant confirmation and our team will contact you
              </p>
            </div>

            <div className="text-center p-6 bg-orange-50 rounded-xl">
              <div className="text-6xl mb-4">🚚</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">3. Pickup Complete</h3>
              <p className="text-gray-600">
                Our professional team arrives and handles everything safely
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
            <p className="text-xl text-gray-600">Professional and reliable service</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <div className="text-5xl mb-4">🚚</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Fast Pickup</h3>
              <p className="text-gray-600">24-48 hour response time</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Easy Process</h3>
              <p className="text-gray-600">Simple online booking</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <div className="text-5xl mb-4">🕐</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600">Always here to help</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <div className="text-5xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Safe & Secure</h3>
              <p className="text-gray-600">Professional handling</p>
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
            Join thousands of satisfied customers who trust us
          </p>
          <Link
            href="/request-pickup"
            className="inline-block bg-white text-blue-900 px-10 py-5 rounded-lg font-bold text-xl hover:bg-blue-50 shadow-2xl transform hover:scale-105 transition"
          >
            Request Pickup Now
          </Link>
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
                <li>
                  <Link href="/request-pickup" className="text-gray-400 hover:text-white transition">
                    Request Pickup
                  </Link>
                </li>
                <li>
                  <Link href="/login/requestor" className="text-gray-400 hover:text-white transition">
                    Customer Login
                  </Link>
                </li>
                <li>
                  <Link href="/login/admin" className="text-gray-400 hover:text-white transition">
                    Admin Login
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li className="text-gray-400">FAQ</li>
                <li className="text-gray-400">Contact Us</li>
                <li className="text-gray-400">Terms & Conditions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>📞 +91 1800-XXX-XXXX</li>
                <li>📧 support@fordcomponentsales.in</li>
                <li>📍 India</li>
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