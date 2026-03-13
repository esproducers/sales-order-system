'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const pathname = usePathname()

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
            <div className="text-right">
              <p className="font-medium text-gray-900">{profile?.name}</p>
              <p className="text-sm text-gray-500 capitalize">{profile?.role}</p>
            </div>

            <div className="relative">
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}