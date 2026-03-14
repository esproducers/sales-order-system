// app/admin/admins/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import AdminSidebar from '@/components/AdminSidebar'
import toast from 'react-hot-toast'
import { updateAgentAdmin, createAdminAccount } from '@/actions/agents'
import { updateAgentStatusAdmin } from '@/actions/clients'

export default function AdminsPage() {
    const { profile, loading: authLoading } = useAuth()
    const [admins, setAdmins] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedAdmin, setSelectedAdmin] = useState<any>(null)
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' })

    useEffect(() => {
        if (!authLoading && profile?.role === 'admin') {
            loadAdmins()
        }
    }, [profile, authLoading])

    const loadAdmins = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'admin')
                .order('created_at', { ascending: false })
            if (error) throw error
            setAdmins(data || [])
        } catch (err: any) {
            toast.error('Failed to load admins: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const openModal = (admin: any = null) => {
        if (admin) {
            setSelectedAdmin(admin)
            const isDeactivated = admin.name?.startsWith('(INACTIVE) ')
            const name = isDeactivated ? admin.name.replace('(INACTIVE) ', '') : admin.name
            setFormData({ name: name || '', email: admin.email || '', phone: admin.phone || '' })
        } else {
            setSelectedAdmin(null)
            setFormData({ name: '', email: '', phone: '' })
        }
        setIsModalOpen(true)
    }

    const handleSaveAdmin = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setLoading(true)
            if (selectedAdmin) {
                // Update using Server Action
                const isDeactivated = selectedAdmin.name?.startsWith('(INACTIVE) ')
                const finalName = isDeactivated ? `(INACTIVE) ${formData.name}` : formData.name

                const { error } = await updateAgentAdmin(selectedAdmin.id, {
                    name: finalName,
                    phone: formData.phone
                })

                if (error) throw new Error(error)
                toast.success('Admin updated')
            } else {
                // Create using Server Action
                const { error } = await createAdminAccount({
                    email: formData.email,
                    name: formData.name,
                    phone: formData.phone
                })
                if (error) throw new Error(error)
                toast.success('Admin created')
            }
            setIsModalOpen(false)
            loadAdmins()
        } catch (err: any) {
            toast.error('Error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleStatus = async (user: any) => {
        const isDeactivated = user.name?.startsWith('(INACTIVE) ');
        if (!confirm(`${isDeactivated ? 'Reactivate' : 'Deactivate'} this admin?`)) return
        try {
            setLoading(true)
            const { error } = await updateAgentStatusAdmin(user.id, isDeactivated)
            if (error) throw new Error(typeof error === 'string' ? error : error.message)
            toast.success(`Admin ${isDeactivated ? 'reactivated' : 'deactivated'}`)
            loadAdmins()
        } catch (err: any) {
            console.error('Admin toggle error:', err)
            toast.error('Failed: ' + (err.message || 'Unknown error'))
        } finally {
            setLoading(false)
        }
    }

    if (loading || authLoading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
                <Navbar />
                <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                    <p>Loading admins…</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="max-w-[1580px] mx-auto px-4 sm:px-6 py-8 w-full flex flex-col md:flex-row gap-6 md:gap-8 flex-1">
                <AdminSidebar />
                <div className="flex-1 min-w-0">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>Portal Admins</h1>
                            <p style={{ color: '#6b7280', marginTop: 4 }}>Manage root access and administrative accounts</p>
                        </div>
                        <button onClick={() => openModal()} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', cursor: 'pointer', fontWeight: 700 }}>+ Add Admin</button>
                    </div>

                    <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                        <div style={{ padding: '0 24px' }}>
                            {admins.map(admin => {
                                const isDeactivated = admin.name?.startsWith('(INACTIVE) ');
                                const displayName = isDeactivated ? admin.name.replace('(INACTIVE) ', '') : admin.name;
                                return (
                                    <div key={admin.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid #f3f4f6', opacity: isDeactivated ? 0.6 : 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ padding: '4px 12px', background: isDeactivated ? '#fee2e2' : 'var(--primary-light)', color: isDeactivated ? '#ef4444' : 'var(--primary-dark)', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                                {isDeactivated ? 'Inactive' : 'Active'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#111827', fontSize: '1.05rem' }}>{displayName}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 2 }}>{admin.email} {admin.phone && `• ${admin.phone}`}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button onClick={() => openModal(admin)} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: '#374151' }}>Edit</button>
                                            <button onClick={() => handleToggleStatus(admin)} style={{ background: 'none', border: 'none', color: isDeactivated ? 'var(--primary-dark)' : '#ef4444', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                                                {isDeactivated ? 'Reactivate' : 'Deactivate'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {admins.length === 0 && <p style={{ textAlign: 'center', color: '#6b7280', padding: 40, fontWeight: 600 }}>No admins found.</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Edit/Create Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 450, padding: 32, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 24 }}>{selectedAdmin ? 'Edit Admin Details' : 'Add New Admin'}</h2>
                        <form onSubmit={handleSaveAdmin}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#4b5563', marginBottom: 6 }}>Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #d1d5db', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#4b5563', marginBottom: 6 }}>Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        disabled={!!selectedAdmin}
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #d1d5db', outline: 'none', background: selectedAdmin ? '#f9fafb' : '#fff' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#4b5563', marginBottom: 6 }}>Phone Number (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #d1d5db', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '12px', background: '#f3f4f6', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: '12px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
