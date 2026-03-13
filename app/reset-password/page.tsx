'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            })
            if (error) throw error

            toast.success('Password updated successfully!')
            router.push('/login')
        } catch (error: any) {
            toast.error(error.message || 'Failed to update password')
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
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 4px', color: '#111827' }}>
                        Set New Password
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                        Enter your new password below
                    </p>
                </div>

                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', marginBottom: 6, color: '#374151' }}>
                            New Password
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            style={inputStyle}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', marginBottom: 6, color: '#374151' }}>
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            style={inputStyle}
                            required
                        />
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
                        }}
                    >
                        {loading ? 'Updating…' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    )
}
