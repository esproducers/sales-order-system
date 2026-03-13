'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import toast from 'react-hot-toast'

export default function ProfilePage() {
    const { profile, loading: authLoading } = useAuth()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
    })

    useEffect(() => {
        if (profile) {
            setForm({
                name: profile.name || '',
                phone: profile.phone || '',
                email: profile.email || '',
            })
        }
    }, [profile])

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile?.id) return
        try {
            setLoading(true)
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: form.name,
                    phone: form.phone,
                })
                .eq('id', profile.id)

            if (error) throw error
            toast.success('Profile updated successfully')
        } catch (err: any) {
            toast.error('Failed to update profile: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    if (authLoading) return <div style={{ padding: 80, textAlign: 'center' }}>Loading…</div>

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            <div style={{ maxWidth: 1580, margin: '0 auto', padding: '40px 24px', display: 'flex', gap: 32 }}>
                <Sidebar />
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 8 }}>My Profile</h1>
                    <p style={{ color: '#6b7280', marginBottom: 32 }}>Manage your profile and account information</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Profile Section */}
                        <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 24, borderBottom: '2px solid var(--primary-light)', paddingBottom: 12 }}>My Profile</h2>
                            <form onSubmit={handleUpdateProfile}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: '#374151' }}>Full Name</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            style={{ width: '100%', padding: '12px', borderRadius: 10, border: '2px solid #e5e7eb', outline: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: '#374151' }}>Phone Number</label>
                                        <input
                                            type="text"
                                            value={form.phone}
                                            onChange={e => setForm({ ...form, phone: e.target.value })}
                                            style={{ width: '100%', padding: '12px', borderRadius: 10, border: '2px solid #e5e7eb', outline: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: '#374151' }}>Email Address</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            disabled
                                            style={{ width: '100%', padding: '12px', borderRadius: 10, border: '2px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: '#374151' }}>Agent Role</label>
                                        <input
                                            type="text"
                                            value={profile?.role || ''}
                                            disabled
                                            style={{ width: '100%', padding: '12px', borderRadius: 10, border: '2px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', textTransform: 'capitalize' }}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{ padding: '12px 32px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(46,189,142,0.2)' }}
                                >
                                    {loading ? 'Updating...' : 'Save Profile Changes'}
                                </button>
                            </form>
                        </div>

                        {/* Commissions Section */}
                        <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 24, borderBottom: '2px solid var(--primary-light)', paddingBottom: 12 }}>Earning Details</h2>
                            <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
                                <div style={{ textAlign: 'center', background: 'var(--primary-light)', padding: '24px 48px', borderRadius: 16 }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--primary-dark)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Commission Rate</div>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary-dark)' }}>{profile?.commission_rate || 0}%</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.6 }}>
                                        Your commission is calculated on the total sales amount of every order you place.
                                        Rates are determined by the administrator based on your performance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
