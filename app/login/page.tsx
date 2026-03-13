'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) { alert('Please enter your email first'); return }
    try {
      const success = await resetPassword(email)
      if (success) {
        alert('Password reset email sent! Check your inbox (including Junk/Spam).')
      }
    } catch (error) {
      console.error('Reset password error:', error)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    border: '1.5px solid #d1d5db',
    borderRadius: 8,
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 70% 0%, #c5eed8 0%, #e8f8f3 40%, #f0faf7 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 8px 40px rgba(46,189,142,0.12)',
          maxWidth: 440,
          width: '100%',
          padding: '40px 36px',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              display: 'inline-block',
              fontWeight: 800,
              fontSize: '1.6rem',
              color: 'var(--primary)',
              letterSpacing: '-0.5px',
              marginBottom: 8,
            }}
          >
            SalesOrder<span style={{ color: 'var(--primary-dark)' }}>Pro</span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 4px', color: '#111827' }}>
            Welcome Back
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', marginBottom: 6, color: '#374151' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', marginBottom: 6, color: '#374151' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
              required
            />
          </div>

          <div style={{ textAlign: 'right' }}>
            <button
              type="button"
              onClick={handleForgotPassword}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-dark)',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: loading ? '#9ca3af' : 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: '#6b7280' }}>
          Don't have an account?{' '}
          <Link href="/register" style={{ color: 'var(--primary-dark)', fontWeight: 600, textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>


      </div>
    </div>
  )
}