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
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid var(--primary-mid)',
              borderTop: '3px solid var(--primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: '#6b7280' }}>Loading…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 70% 0%, #c5eed8 0%, #e8f8f3 40%, #f0faf7 100%)',
      }}
    >
      {/* Nav */}
      <nav
        style={{
          background: '#fff',
          borderBottom: '1px solid #e5e5e5',
          padding: '0 32px',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
          }}
        >
          <span
            style={{
              fontWeight: 800,
              fontSize: '1.4rem',
              color: 'var(--primary)',
              letterSpacing: '-0.5px',
            }}
          >
            SalesOrder<span style={{ color: 'var(--primary-dark)' }}>Pro</span>
          </span>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link
              href="/login"
              style={{
                padding: '8px 20px',
                color: 'var(--primary-dark)',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none',
                borderRadius: 8,
                border: '1.5px solid var(--primary-mid)',
              }}
            >
              Login
            </Link>
            <Link
              href="/register"
              style={{
                padding: '8px 20px',
                background: 'var(--primary)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none',
                borderRadius: 8,
              }}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main>
        <div
          style={{
            maxWidth: 780,
            margin: '0 auto',
            padding: '80px 24px 60px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              background: 'var(--primary-light)',
              color: 'var(--primary-dark)',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '5px 14px',
              borderRadius: 20,
              marginBottom: 20,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Sales Order Management System
          </div>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              color: '#111827',
              marginBottom: 20,
            }}
          >
            Streamline Your{' '}
            <span style={{ color: 'var(--primary)' }}>Sales Order</span> Management
          </h1>
          <p
            style={{
              fontSize: '1.05rem',
              color: '#6b7280',
              lineHeight: 1.7,
              marginBottom: 36,
              maxWidth: 560,
              margin: '0 auto 36px',
            }}
          >
            A complete solution for agents to manage clients, track orders, and calculate
            commissions effortlessly.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/register"
              style={{
                padding: '13px 32px',
                background: 'var(--primary)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1rem',
                textDecoration: 'none',
                borderRadius: 10,
                boxShadow: '0 4px 16px rgba(46,189,142,0.35)',
              }}
            >
              Start Free Trial
            </Link>
            <Link
              href="/login"
              style={{
                padding: '13px 32px',
                border: '2px solid var(--primary)',
                color: 'var(--primary-dark)',
                fontWeight: 700,
                fontSize: '1rem',
                textDecoration: 'none',
                borderRadius: 10,
                background: '#fff',
              }}
            >
              Demo Login
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div
          style={{
            maxWidth: 1000,
            margin: '0 auto 80px',
            padding: '0 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          {[
            { icon: '📋', title: 'Order Management', desc: 'Create, track, and manage customer orders with ease' },
            { icon: '👥', title: 'Client Database', desc: 'Store and access all client information in one place' },
            { icon: '💰', title: 'Commission Tracking', desc: 'Automatically calculate commissions for each agent' },
          ].map((f) => (
            <div
              key={f.title}
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: '28px 24px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                border: '1px solid var(--primary-mid)',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  marginBottom: 16,
                }}
              >
                {f.icon}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}