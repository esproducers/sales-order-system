// app/admin/admins/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import AdminSidebar from '@/components/AdminSidebar'
import toast from 'react-hot-toast'
import { updateAgentAdmin } from '@/actions/agents'
import { updateAgentStatusAdmin } from '@/actions/clients'

export default function AdminsPage() {
    const { profile, loading: authLoading } = useAuth()
    const [admins, setAdmins] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

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

    const handleCreateAdmin = async () => {
        const email = prompt('Enter admin email:')
        if (!email) return
        const name = prompt('Enter admin name:')
        if (!name) return
        const phone = prompt('Enter admin phone (optional):')
        try {
            setLoading(true)
            const { error } = await supabase.from('profiles').insert({
                email,
                name,
                phone: phone || '',
                role: 'admin'
            })
            if (error) throw error
            toast.success('Admin created')
            loadAdmins()
        } catch (err: any) {
            toast.error('Failed to create admin: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleEditAdmin = async (adminId: string) => {
        const name = prompt('Enter new name:')
        if (!name) return
        const phone = prompt('Enter new phone:')
        try {
            setLoading(true)
            const { error } = await supabase.from('profiles').update({ name, phone: phone || '' }).eq('id', adminId)
            if (error) throw error
            toast.success('Admin updated')
            loadAdmins()
        } catch (err: any) {
            toast.error('Failed to update admin: ' + err.message)
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
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            <div style={{ maxWidth: 1580, margin: '0 auto', padding: '40px 24px', display: 'flex', gap: 32 }}>
                <AdminSidebar />
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>Admins</h1>
                        <button onClick={handleCreateAdmin} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>+ Add Admin</button>
                    </div>
                    <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                        <div style={{ padding: '12px 24px' }}>
                            {admins.map(admin => {
                                const isDeactivated = admin.name?.startsWith('(INACTIVE) ');
                                const displayName = isDeactivated ? admin.name.replace('(INACTIVE) ', '') : admin.name;
                                return (
                                    <div key={admin.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e5e7eb', opacity: isDeactivated ? 0.6 : 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ padding: '4px 12px', background: isDeactivated ? '#fee2e2' : 'var(--primary-light)', color: isDeactivated ? '#ef4444' : 'var(--primary-dark)', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
                                                {isDeactivated ? 'Inactive' : 'Active'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#111827' }}>{displayName}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{admin.email}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => handleEditAdmin(admin.id)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                                            <button onClick={() => handleToggleStatus(admin)} style={{ background: isDeactivated ? 'var(--primary-light)' : '#fee2e2', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, color: isDeactivated ? 'var(--primary-dark)' : '#ef4444' }}>
                                                {isDeactivated ? 'Reactivate' : 'Deactivate'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {admins.length === 0 && <p style={{ textAlign: 'center', color: '#6b7280', padding: 20 }}>No admins found.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
