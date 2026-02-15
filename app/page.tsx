'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">SalesOrderPro</h1>
            <div className="space-x-4">
              <Link 
                href="/login" 
                className="px-4 py-2 text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Login
              </Link>
              <Link 
                href="/register" 
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Streamline Your Sales Order Management
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            A complete solution for agents to manage clients, track orders, and calculate commissions effortlessly.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              href="/register" 
              className="px-8 py-3 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition duration-300"
            >
              Start Free Trial
            </Link>
            <Link 
              href="/login" 
              className="px-8 py-3 border-2 border-indigo-600 text-indigo-600 text-lg font-semibold rounded-lg hover:bg-indigo-50 transition duration-300"
            >
              Demo Login
            </Link>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-bold mb-2">Order Management</h3>
              <p className="text-gray-600">Create, track, and manage customer orders with ease</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold mb-2">Client Database</h3>
              <p className="text-gray-600">Store and access all client information in one place</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-2">Commission Tracking</h3>
              <p className="text-gray-600">Automatically calculate commissions for each agent</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}