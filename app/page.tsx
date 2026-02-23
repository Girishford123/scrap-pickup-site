import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Ford Special Market</h1>
              <p className="text-sm text-gray-600 mt-1">Scrap Vehicle Pickup Service</p>
            </div>
            <Link 
              href="/admin"
              className="text-blue-900 hover:text-blue-700 font-semibold"
            >
              Admin Login →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
            Quick & Easy Scrap
            <span className="block text-blue-300">Vehicle Pickup</span>
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Get your old or damaged vehicle picked up hassle-free. 
            Fast service, fair evaluation, and professional handling.
          </p>
          
          <Link
            href="/request-pickup"
            className="inline-block bg-white text-blue-900 px-12 py-4 rounded-lg text-lg font-bold hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 shadow-2xl"
          >
            Request a Pickup Now
          </Link>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center border border-white/20">
            <div className="text-5xl mb-4">🚚</div>
            <h3 className="text-xl font-bold text-white mb-3">Free Pickup</h3>
            <p className="text-blue-100">
              No hidden fees. We come to you at no cost.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center border border-white/20">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-white mb-3">Fast Service</h3>
            <p className="text-blue-100">
              Quick response time. Same-day pickup available.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center border border-white/20">
            <div className="text-5xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-white mb-3">Fair Value</h3>
            <p className="text-blue-100">
              Competitive pricing for your scrap vehicle.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-24 bg-white rounded-2xl shadow-2xl p-12">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="font-bold text-lg mb-2">Submit Request</h4>
              <p className="text-gray-600">Fill out our simple form with vehicle details</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="font-bold text-lg mb-2">Get Confirmed</h4>
              <p className="text-gray-600">We'll contact you to schedule pickup</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="font-bold text-lg mb-2">Vehicle Picked Up</h4>
              <p className="text-gray-600">Professional team handles everything</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-blue-950 text-white mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-blue-300">
            © 2024 Ford Special Market - Scrap Pickup Service
          </p>
        </div>
      </footer>
    </div>
  )
}