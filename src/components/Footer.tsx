'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Footer() {
  const [settings, setSettings] = useState({
    brand_name: '',
    company_name: '',
    registration_number: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return null

  // Defaults fallback dynamically on client ONLY if missing, 
  // but as per user request: "default in code 不要显示公司质料". 
  // We leave it empty if blank from the database.
  const brand = settings.brand_name || ''
  const company = settings.company_name || ''
  const regNo = settings.registration_number ? `(${settings.registration_number})` : ''

  return (
    <footer className="w-full bg-primary-dark text-white py-12 mt-auto">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <div className="space-y-4 text-sm md:text-base opacity-90">
          <p className="font-semibold tracking-wide">
            Copyright © {new Date().getFullYear()} {brand} | 
          </p>
          <p>
            Powered by {company} {regNo} |
          </p>
          <p>All Rights Reserved.</p>
        </div>
        
        <div className="mt-8 flex justify-center items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-primary-light transition-colors">
            Home
          </Link>
          <Link href="/privacy-policy" className="hover:text-primary-light transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  )
}
