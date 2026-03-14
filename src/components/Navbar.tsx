'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  if (!user || pathname === '/login' || pathname === '/register') {
    return null
  }

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'New Order', href: '/orders/new', icon: '🛒' },
    { name: 'My Orders', href: '/orders', icon: '📋' },
    { name: 'Clients', href: '/clients', icon: '👥' },
  ]

  if (profile?.role === 'admin') {
    navLinks.push({ name: 'Admin', href: '/admin', icon: '⚙️' })
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl">📦</span>
              <span className="text-xl font-bold text-primary">SalesOrderPro</span>
            </Link>

            <div className="hidden md:flex space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${pathname === link.href
                      ? 'bg-primary-light text-primary-dark'
                      : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.name}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <p className="font-medium text-gray-900">{profile?.name}</p>
              <p className="text-sm text-gray-500 capitalize">{profile?.role}</p>
            </div>

            <div className="hidden md:block relative">
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
              >
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Content */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                    pathname === link.href
                      ? 'bg-primary-light text-primary-dark'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.name}</span>
                </Link>
              ))}
              
              <div className="border-t border-gray-100 mt-2 pt-3">
                <div className="px-3 mb-3">
                  <p className="font-medium text-gray-900">{profile?.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{profile?.role}</p>
                </div>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    signOut()
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition flex items-center space-x-2"
                >
                  <span className="text-xl">🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}