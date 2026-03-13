'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import toast from 'react-hot-toast'

export default function SettingsPage() {
    const { loading: authLoading } = useAuth()
    const { fontSize, setFontSize } = useTheme()

    if (authLoading) return <div style={{ padding: 80, textAlign: 'center' }}>Loading…</div>

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            <div style={{ maxWidth: 1580, margin: '0 auto', padding: '40px 24px', display: 'flex', gap: 32 }}>
                <Sidebar />
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 8 }}>Account Settings</h1>
                    <p style={{ color: '#6b7280', marginBottom: 32 }}>Manage your application preferences</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* App Customization Section */}
                        <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 24, borderBottom: '2px solid var(--primary-light)', paddingBottom: 12 }}>App Word Size (Font Size)</h2>
                            <p style={{ color: '#6b7280', marginBottom: 20, fontSize: '0.95rem' }}>Adjust the overall readability of the application.</p>

                            <div style={{ display: 'flex', gap: 12 }}>
                                {(['small', 'medium', 'large'] as const).map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => {
                                            setFontSize(size);
                                            toast.success(`${size.charAt(0).toUpperCase() + size.slice(1)} text enabled`);
                                        }}
                                        style={{
                                            padding: '14px 28px',
                                            borderRadius: 12,
                                            border: fontSize === size ? '2px solid var(--primary)' : '2px solid #e5e7eb',
                                            background: fontSize === size ? 'var(--primary-light)' : '#fff',
                                            color: fontSize === size ? 'var(--primary-dark)' : '#374151',
                                            fontWeight: 800,
                                            fontSize: size === 'small' ? '0.8rem' : size === 'medium' ? '1rem' : '1.2rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            flex: 1,
                                            textTransform: 'capitalize'
                                        }}
                                    >
                                        {size === 'small' ? 'Small' : size === 'medium' ? 'Normal' : 'Large'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
