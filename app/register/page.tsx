'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const { signUp } = useAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!')
      return
    }
    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await signUp(formData.email, formData.password, formData.name, formData.phone)
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    border: '1.5px solid #d1d5db',
    borderRadius: 8,
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontWeight: 500,
    fontSize: '0.875rem',
    color: '#374151',
    marginBottom: 6,
  }

  const passwordStrength = (pw: string) => {
    if (!pw) return null
    if (pw.length < 6) return { label: 'Too short', color: '#ef4444', width: '25%' }
    if (pw.length < 8) return { label: 'Weak', color: '#f97316', width: '50%' }
    if (pw.length < 12) return { label: 'Good', color: '#eab308', width: '75%' }
    return { label: 'Strong', color: '#2EBD8E', width: '100%' }
  }

  const strength = passwordStrength(formData.password)

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
          maxWidth: 460,
          width: '100%',
          padding: '40px 36px',
        }}
      >
        {/* Logo + header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
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
            Create Account
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
            Join our sales order management system
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Full Name */}
          <div>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              style={inputStyle}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              style={inputStyle}
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label style={labelStyle}>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1234567890"
              style={inputStyle}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={inputStyle}
              required
            />
            {/* Strength bar */}
            {strength && (
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 4, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: strength.width,
                      background: strength.color,
                      borderRadius: 4,
                      transition: 'width 0.3s, background 0.3s',
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.72rem', color: strength.color, marginTop: 4, fontWeight: 600 }}>
                  {strength.label} · Minimum 6 characters
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              style={{
                ...inputStyle,
                borderColor:
                  formData.confirmPassword && formData.confirmPassword !== formData.password
                    ? '#ef4444'
                    : formData.confirmPassword && formData.confirmPassword === formData.password
                      ? 'var(--primary)'
                      : '#d1d5db',
              }}
              required
            />
            {formData.confirmPassword && formData.confirmPassword !== formData.password && (
              <p style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4 }}>Passwords do not match</p>
            )}
            {formData.confirmPassword && formData.confirmPassword === formData.password && (
              <p style={{ fontSize: '0.72rem', color: 'var(--primary-dark)', marginTop: 4 }}>✓ Passwords match</p>
            )}
          </div>

          {/* Terms */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: '#374151',
            }}
          >
            <div
              onClick={() => setAgreed(!agreed)}
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                border: '2px solid',
                borderColor: agreed ? 'var(--primary)' : '#d1d5db',
                background: agreed ? 'var(--primary)' : '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 1,
                transition: 'background 0.15s, border-color 0.15s',
                cursor: 'pointer',
              }}
            >
              {agreed && <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}>✓</span>}
            </div>
            <span>
              I agree to the{' '}
              <Link href="/terms" style={{ color: 'var(--primary-dark)', fontWeight: 600, textDecoration: 'none' }}>
                Terms &amp; Conditions
              </Link>
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !agreed}
            style={{
              width: '100%',
              padding: '13px',
              background: loading || !agreed ? '#9ca3af' : 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: loading || !agreed ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
              marginTop: 4,
            }}
          >
            {loading ? 'Creating Account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: '#6b7280' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--primary-dark)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}