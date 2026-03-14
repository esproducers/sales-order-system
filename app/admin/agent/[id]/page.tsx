'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import AdminSidebar from '@/components/AdminSidebar'
import Link from 'next/link'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useRouter, useParams } from 'next/navigation'
import { updateAgentAdmin } from '@/actions/agents'
import { updateAgentStatusAdmin } from '@/actions/clients'

export default function AgentDetailPage() {
    const { profile, loading: authLoading } = useAuth()
    const router = useRouter()
    const params = useParams()
    const agentId = params.id as string

    const [agent, setAgent] = useState<any>(null)
    const [orders, setOrders] = useState<any[]>([])
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editMode, setEditMode] = useState(false)

    const [form, setForm] = useState({
        name: '',
        phone: '',
        commission_rate: '',
    })

    useEffect(() => {
        if (!authLoading && profile) {
            if (profile.role !== 'admin') {
                toast.error('Access denied.')
                router.push('/dashboard')
            } else {
                loadData()
            }
        }
    }, [profile, authLoading, agentId])

    const loadData = async () => {
        try {
            setLoading(true)
            const [agentRes, ordersRes, clientsRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', agentId).single(),
                supabase.from('orders').select('*, clients(company_name)').eq('agent_id', agentId).order('created_at', { ascending: false }),
                supabase.from('clients').select('*').eq('agent_id', agentId).order('company_name'),
            ])
            if (agentRes.error) throw agentRes.error
            setAgent(agentRes.data)
            setForm({
                name: agentRes.data.name || '',
                phone: agentRes.data.phone || '',
                commission_rate: agentRes.data.commission_rate?.toString() || '0',
            })
            setOrders(ordersRes.data || [])
            setClients(clientsRes.data || [])
        } catch (err: any) {
            toast.error('Failed to load agent data')
            router.push('/admin')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        const rate = parseFloat(form.commission_rate)
        if (isNaN(rate) || rate < 0 || rate > 100) {
            toast.error('Commission rate must be 0–100')
            return
        }
        try {
            setSaving(true)
            const { data, error } = await updateAgentAdmin(agentId, { name: form.name, phone: form.phone, commission_rate: rate })
            if (error) throw new Error(error)
            setAgent((prev: any) => ({ ...prev, name: form.name, phone: form.phone, commission_rate: rate }))
            toast.success('Agent updated!')
            setEditMode(false)
        } catch (err: any) {
            toast.error('Failed to save: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleToggleActive = async () => {
        const isDeactivated = agent?.name?.startsWith('(INACTIVE) ')
        const confirmMsg = !isDeactivated
            ? `Deactivate ${agent.name}? They will lose access to the system.`
            : `Reactivate ${agent.name}?`
        if (!confirm(confirmMsg)) return

        try {
            const { error } = await updateAgentStatusAdmin(agentId, isDeactivated)
            if (error) throw new Error(typeof error === 'string' ? error : error.message)
            setAgent((prev: any) => {
                let newName = prev.name
                if (!isDeactivated) {
                    newName = '(INACTIVE) ' + newName
                } else {
                    newName = newName.replace('(INACTIVE) ', '')
                }
                return { ...prev, name: newName }
            })
            toast.success(!isDeactivated ? 'Agent deactivated.' : 'Agent reactivated!')
        } catch (err: any) {
            toast.error('Failed: ' + err.message)
        }
    }

    if (loading || authLoading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
                <Navbar />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 40, height: 40, border: '3px solid var(--primary-mid)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                        <p style={{ color: '#6b7280' }}>Loading agent data…</p>
                    </div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        )
    }

    if (!agent) return null

    const isDeactivated = agent.name?.startsWith('(INACTIVE) ')
    const isActive = !isDeactivated
    const totalSales = orders.reduce((s, o) => s + (o.total_amount || 0), 0)
    const totalCommission = orders.reduce((s, o) => s + (o.commission_amount || 0), 0)

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="max-w-[1580px] mx-auto px-4 sm:px-6 py-8 w-full flex flex-col md:flex-row gap-6 md:gap-8 flex-1">
                <AdminSidebar />
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: '50%',
                                background: isActive ? 'var(--primary)' : '#d1d5db',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.8rem', fontWeight: 900, color: '#fff',
                                flexShrink: 0,
                            }}>
                                {(agent.name || 'A')[0].toUpperCase()}
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>{agent.name?.replace('(INACTIVE) ', '')}</h1>
                                    {isDeactivated && (
                                        <span style={{ background: '#e5e7eb', color: '#6b7280', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>Inactive</span>
                                    )}
                                </div>
                                <div style={{ color: '#6b7280', fontSize: '0.95rem', marginTop: 2 }}>{agent.email}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setEditMode(!editMode)}
                                style={{
                                    padding: '10px 22px',
                                    background: editMode ? '#f3f4f6' : 'var(--primary)',
                                    color: editMode ? '#374151' : '#fff',
                                    border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer'
                                }}
                            >
                                {editMode ? 'Cancel Edit' : '✏️ Edit Agent'}
                            </button>
                            <button
                                onClick={handleToggleActive}
                                style={{
                                    padding: '10px 22px',
                                    background: 'none',
                                    color: isActive ? '#ef4444' : 'var(--primary-dark)',
                                    border: `1.5px solid ${isActive ? '#ef4444' : 'var(--primary)'}`,
                                    borderRadius: 10, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer'
                                }}
                            >
                                {isActive ? '🚫 Deactivate' : '✅ Reactivate'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-6 items-start">

                        {/* Left: Info / Edit Card */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* Agent Info / Edit Form */}
                            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                                <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1rem' }}>Agent Details</h2>
                                    {editMode && (
                                        <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 8, fontWeight: 700 }}>Editing…</span>
                                    )}
                                </div>
                                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                                    {/* Name */}
                                    <div>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Name</div>
                                        {editMode ? (
                                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                                        ) : (
                                            <div style={{ fontWeight: 700, color: '#111827' }}>{agent.name}</div>
                                        )}
                                    </div>
                                    {/* Email (read-only) */}
                                    <div>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Email</div>
                                        <div style={{ fontWeight: 600, color: '#374151' }}>{agent.email}</div>
                                        {editMode && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>Email cannot be changed here.</div>}
                                    </div>
                                    {/* Phone */}
                                    <div>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Phone</div>
                                        {editMode ? (
                                            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                                placeholder="+60123456789"
                                                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                                        ) : (
                                            <div style={{ fontWeight: 600, color: '#374151' }}>{agent.phone || '—'}</div>
                                        )}
                                    </div>
                                    {/* Commission Rate */}
                                    <div>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Commission Rate</div>
                                        {editMode ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <input type="number" min="0" max="100" step="0.1" value={form.commission_rate}
                                                    onChange={e => setForm(f => ({ ...f, commission_rate: e.target.value }))}
                                                    style={{ width: 100, padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: '0.95rem', outline: 'none' }} />
                                                <span style={{ fontWeight: 700, color: '#6b7280' }}>%</span>
                                            </div>
                                        ) : (
                                            <span style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '4px 12px', borderRadius: 8, fontWeight: 800, fontSize: '1rem' }}>
                                                {agent.commission_rate}%
                                            </span>
                                        )}
                                    </div>
                                    {/* Joined */}
                                    <div>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Joined</div>
                                        <div style={{ color: '#374151' }}>{format(new Date(agent.created_at), 'MMMM d, yyyy')}</div>
                                    </div>

                                    {editMode && (
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            style={{
                                                padding: '11px 24px',
                                                background: saving ? '#9ca3af' : 'var(--primary)',
                                                color: '#fff', border: 'none', borderRadius: 10,
                                                fontWeight: 700, fontSize: '0.95rem',
                                                cursor: saving ? 'not-allowed' : 'pointer',
                                                marginTop: 4,
                                            }}
                                        >
                                            {saving ? 'Saving…' : 'Save Changes'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                {[
                                    { label: 'Total Orders', value: orders.length, icon: '📦', color: '#f3e8ff' },
                                    { label: 'Total Clients', value: clients.length, icon: '🏢', color: '#dcfce7' },
                                    { label: 'Total Sales', value: `RM ${totalSales.toFixed(2)}`, icon: '💰', color: '#fef9c3' },
                                    { label: 'Commission', value: `RM ${totalCommission.toFixed(2)}`, icon: '🎟️', color: '#fee2e2' },
                                ].map(s => (
                                    <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#111827', marginTop: 2 }}>{s.value}</div>
                                        </div>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 10,
                                            background: s.color,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.1rem', flexShrink: 0,
                                            lineHeight: 1
                                        }}>
                                            {s.icon}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Clients */}
                            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                                <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0' }}>
                                    <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1rem' }}>Clients ({clients.length})</h2>
                                </div>
                                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                                    {clients.length === 0 ? (
                                        <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>No clients yet</div>
                                    ) : clients.map(c => (
                                        <div key={c.id} style={{ padding: '12px 24px', borderBottom: '1px solid #f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>{c.company_name}</div>
                                                {c.ssm_id && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>SSM: {c.ssm_id}</div>}
                                            </div>
                                            {c.is_active === false && (
                                                <span style={{ fontSize: '0.72rem', background: '#f3f4f6', color: '#6b7280', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>Inactive</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: Orders */}
                        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0' }}>
                                <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1rem' }}>Orders ({orders.length})</h2>
                            </div>
                            {orders.length === 0 ? (
                                <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>No orders yet.</div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f9fafb' }}>
                                        <tr>
                                            {['Order ID', 'Client', 'Total', 'Status', 'Commission', 'Date'].map(h => (
                                                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(order => {
                                            const currentStatus = order.status || 'Confirmed'
                                            return (
                                                <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#6b7280' }}>#{order.id?.slice(0, 8).toUpperCase()}</td>
                                                    <td style={{ padding: '12px 20px', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>{order.clients?.company_name ?? '—'}</td>
                                                    <td style={{ padding: '12px 20px', fontWeight: 800, color: '#111827' }}>RM {order.total_amount?.toFixed(2)}</td>
                                                    <td style={{ padding: '12px 20px' }}>
                                                        <span style={{
                                                            padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700,
                                                            background: currentStatus === 'Preparing' ? '#e0e7ff' : currentStatus === 'Picked up' ? '#fef3c7' : currentStatus === 'Delivered' ? '#f3f4f6' : '#dcfce7',
                                                            color: '#111827'
                                                        }}>
                                                            {currentStatus === 'active' ? 'Confirmed' : currentStatus}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--primary-dark)' }}>RM {order.commission_amount?.toFixed(2)}</td>
                                                    <td style={{ padding: '12px 20px', color: '#9ca3af', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{format(new Date(order.created_at), 'MMM d, yyyy')}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    )
}
