'use client'

import Link from 'next/link'

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Admin Dashboard
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/admin/requests"
              className="block p-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <h2 className="text-2xl font-semibold mb-2">
                View Pickup Requests
              </h2>
              <p className="text-blue-100">
                Manage and process scrap pickup requests
              </p>
            </Link>
            
            <Link
              href="/admin/login"
              className="block p-6 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <h2 className="text-2xl font-semibold mb-2">
                Login Settings
              </h2>
              <p className="text-gray-100">
                Manage admin authentication
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}