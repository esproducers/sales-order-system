'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function PrivacyPolicyPage() {
  const [settings, setSettings] = useState({
    brand_name: 'Our System',
    company_name: 'Our Company',
    registration_number: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings({
          brand_name: data.brand_name || 'Our brand',
          company_name: data.company_name || 'Our Company',
          registration_number: data.registration_number || ''
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading Privacy Policy...</p>
      </div>
    )
  }

  const { brand_name: brand, company_name: comp, registration_number: reg } = settings
  const regString = reg ? ` (${reg})` : ''
  const companyStr = `${comp}${regString}`

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-sm rounded-2xl">
        <div className="mb-8">
          <Link href="/" className="text-primary-dark hover:text-primary font-medium text-sm flex items-center gap-1">
            <span>←</span> Back to Home
          </Link>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">
          Privacy Policy
        </h1>
        
        <div className="space-y-8 text-gray-700 leading-relaxed max-w-none text-base">
          <section>
            <p>
              Welcome to <strong>{brand}</strong>. This Privacy Policy governs the manner in which 
              <strong> {companyStr}</strong> collects, uses, maintains, and discloses information collected from 
              users of this platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">Information Collection</h2>
            <p>
              We may collect personal identification information from Users in a variety of ways, including, but not limited to, 
              when Users visit our site, register on the site, place an order as an agent, and in connection with other activities, 
              services, features, or resources we make available. We will collect personal identification information from Users 
              only if they voluntarily submit such information to us.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">Information Usage</h2>
            <p>
              <strong>{comp}</strong> may collect and use Users' personal information for the following purposes:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3 text-gray-600">
              <li>To improve customer service</li>
              <li>To personalize user experience</li>
              <li>To process payments and sales orders efficiently</li>
              <li>To send periodic emails regarding order updates or system changes</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">Data Protection</h2>
            <p>
              We adopt appropriate data collection, storage, and processing practices and security measures to protect against 
              unauthorized access, alteration, disclosure, or destruction of your personal information, username, password, 
              transaction information, and data stored on our Site.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">Changes to this Policy</h2>
            <p>
              <strong>{comp}</strong> has the discretion to update this privacy policy at any time. When we do, we will post a 
              notification on the main page of our Site. We encourage Users to frequently check this page for any changes to stay 
              informed about how we are helping to protect the personal information we collect.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">Contacting Us</h2>
            <p>
              If you have any questions about this Privacy Policy, the practices of this site, or your dealings with this platform, 
              please contact the administrators of <strong>{brand}</strong>.
            </p>
          </section>

          <div className="pt-8 text-sm text-gray-500 mt-12 border-t border-gray-100 italic">
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric'})}
          </div>
        </div>
      </div>
    </div>
  )
}
