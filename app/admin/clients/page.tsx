'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import AdminSidebar from '@/components/AdminSidebar'
import Link from 'next/link'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { updateClientStatusAdmin } from '@/actions/clients'

export default function AdminClientsPage() {
    const { profile, loading: authLoading } = useAuth()
    const router = useRouter()
    const [clients, setClients] = useState<any[]>([])
    const [agents, setAgents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedAgents, setSelectedAgents] = useState<string[]>([])
    const [selectedMonths, setSelectedMonths] = useState<string[]>([])
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')

    // Reassign modal state
    const [reassignClient, setReassignClient] = useState<any>(null)
    const [selectedAgentId, setSelectedAgentId] = useState('')
    const [reassigning, setReassigning] = useState(false)

    useEffect(() => {
        if (!authLoading && profile) {
            if (profile.role !== 'admin') {
                toast.error('Access denied.')
                router.push('/dashboard')
            } else {
                loadData()
            }
        }
    }, [profile, authLoading])

    const loadData = async () => {
        try {
            setLoading(true)
            const [clientsRes, agentsRes] = await Promise.all([
                supabase
                    .from('clients')
                    .select('*, profiles(id, name, email)')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('profiles')
                    .select('id, name, email')
                    .eq('role', 'agent')
                    .order('name')
            ])
            if (clientsRes.error) throw clientsRes.error
            if (agentsRes.error) throw agentsRes.error
            setClients(clientsRes.data || [])
            setAgents(agentsRes.data || [])
        } catch (err: any) {
            toast.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const openReassign = (client: any) => {
        setReassignClient(client)
        setSelectedAgentId(client.agent_id || '')
    }

    const handleReassign = async () => {
        if (!selectedAgentId || !reassignClient) return
        if (selectedAgentId === reassignClient.agent_id) {
            toast('No change — same agent selected.')
            return
        }
        try {
            setReassigning(true)
            const { error } = await supabase
                .from('clients')
                .update({ agent_id: selectedAgentId })
                .eq('id', reassignClient.id)
            if (error) throw error
            toast.success(`Client reassigned successfully!`)
            setReassignClient(null)
            loadData()
        } catch (err: any) {
            toast.error('Failed to reassign client')
        } finally {
            setReassigning(false)
        }
    }
    const handleToggleActive = async (client: any) => {
        const isCurrentlyDeactivated = client.company_name?.startsWith('(INACTIVE) ')
        const action = isCurrentlyDeactivated ? 'Reactivate' : 'Deactivate'
        if (!confirm(`${action} this client?`)) return
        try {
            setLoading(true)
            const { error } = await updateClientStatusAdmin(client.id, isCurrentlyDeactivated)
            if (error) throw error
            toast.success(`Client ${action.toLowerCase()}d successfully!`)
            loadData()
        } catch (err: any) {
            console.error('Client toggle error:', err)
            toast.error(`Failed to ${action.toLowerCase()} client`)
        } finally {
            setLoading(false)
        }
    }

    const uniqueAgents = Array.from(new Set(clients.map(c => c.profiles?.name).filter(Boolean))).sort()
    const monthsList = Array.from(new Set(clients.map(c => format(new Date(c.created_at), 'MMMM yyyy'))))
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    const filtered = clients.filter(c => {
        const joinDate = new Date(c.created_at)
        const monthName = format(joinDate, 'MMMM yyyy')

        const matchesAgent = selectedAgents.length === 0 || selectedAgents.includes(c.profiles?.name)
        const matchesMonth = selectedMonths.length === 0 || selectedMonths.includes(monthName)

        let matchesDate = true
        if (dateFrom) {
            matchesDate = matchesDate && joinDate >= new Date(dateFrom)
        }
        if (dateTo) {
            const toDateEnd = new Date(dateTo)
            toDateEnd.setHours(23, 59, 59, 999)
            matchesDate = matchesDate && joinDate <= toDateEnd
        }

        const matchesSearch = !search ||
            c.id?.toLowerCase().includes(search.toLowerCase()) ||
            c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
            c.ssm_id?.toLowerCase().includes(search.toLowerCase())

        return matchesAgent && matchesMonth && matchesDate && matchesSearch
    })

    const activeCount = clients.filter(c => !c.company_name?.startsWith('(INACTIVE) ')).length

    if (loading || authLoading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
                <Navbar />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 40, height: 40, border: '3px solid var(--primary-mid)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                        <p style={{ color: '#6b7280' }}>Loading client data…</p>
                    </div>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            <div style={{ maxWidth: 1580, margin: '0 auto', padding: '40px 24px', display: 'flex', gap: 32 }}>
                <AdminSidebar />
                <div style={{ flex: 1 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>Client Management</h1>
                            <p style={{ color: '#6b7280', marginTop: 4, fontSize: '0.95rem' }}>Management of all clients in the system</p>
                        </div>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ background: '#fff', borderRadius: 12, padding: '16px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Total</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111827' }}>{clients.length}</div>
                            </div>
                            <div style={{ background: '#fff', borderRadius: 12, padding: '16px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Active</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary-dark)' }}>{activeCount}</div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                            <div style={{ flex: '1 1 200px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Search Company / SSM</label>
                                <input type="text" placeholder="e.g. Acme Corp" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', outline: 'none', fontSize: '0.9rem' }} />
                            </div>
                            <div style={{ flex: '1 1 200px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Filter by Agent</label>
                                <select
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value && !selectedAgents.includes(e.target.value)) setSelectedAgents([...selectedAgents, e.target.value]);
                                    }}
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', outline: 'none', fontSize: '0.9rem', cursor: 'pointer', appearance: 'none' }}
                                >
                                    <option value="">+ Add Agent...</option>
                                    {uniqueAgents.filter(a => !selectedAgents.includes(a as string)).map(a => (
                                        <option key={a as string} value={a as string}>{a as string}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ flex: '1 1 200px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Filter Join Month</label>
                                <select
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value && !selectedMonths.includes(e.target.value)) setSelectedMonths([...selectedMonths, e.target.value]);
                                    }}
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', outline: 'none', fontSize: '0.9rem', cursor: 'pointer', appearance: 'none' }}
                                >
                                    <option value="">+ Add Month...</option>
                                    {monthsList.filter(m => !selectedMonths.includes(m)).map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ flex: '1 1 150px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Join Date From</label>
                                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', outline: 'none', fontSize: '0.9rem' }} />
                            </div>
                            <div style={{ flex: '1 1 150px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Join Date To</label>
                                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', outline: 'none', fontSize: '0.9rem' }} />
                            </div>
                        </div>

                        {(selectedAgents.length > 0 || selectedMonths.length > 0 || dateFrom || dateTo) && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                                <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', marginRight: 4 }}>Active Filters:</span>
                                {selectedAgents.map(a => (
                                    <div key={a} style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        👨‍💼 {a} <button onClick={() => setSelectedAgents(selectedAgents.filter(x => x !== a))} style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', padding: 0, fontSize: '1rem', lineHeight: 1 }}>×</button>
                                    </div>
                                ))}
                                {selectedMonths.map(m => (
                                    <div key={m} style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        📅 {m} <button onClick={() => setSelectedMonths(selectedMonths.filter(x => x !== m))} style={{ background: 'none', border: 'none', color: '#b45309', cursor: 'pointer', padding: 0, fontSize: '1rem', lineHeight: 1 }}>×</button>
                                    </div>
                                ))}
                                {dateFrom && (
                                    <div style={{ background: '#f3e8ff', color: '#7e22ce', padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        📆 From: {dateFrom} <button onClick={() => setDateFrom('')} style={{ background: 'none', border: 'none', color: '#7e22ce', cursor: 'pointer', padding: 0, fontSize: '1rem', lineHeight: 1 }}>×</button>
                                    </div>
                                )}
                                {dateTo && (
                                    <div style={{ background: '#f3e8ff', color: '#7e22ce', padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        📆 To: {dateTo} <button onClick={() => setDateTo('')} style={{ background: 'none', border: 'none', color: '#7e22ce', cursor: 'pointer', padding: 0, fontSize: '1rem', lineHeight: 1 }}>×</button>
                                    </div>
                                )}
                                <button onClick={() => { setSelectedAgents([]); setSelectedMonths([]); setDateFrom(''); setDateTo(''); }} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', padding: '2px 6px' }}>Clear All</button>
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f9fafb' }}>
                                <tr>
                                    {['Company', 'SSM ID', 'Phone', 'Agent', 'Status', 'Added', 'Action'].map(h => (
                                        <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(client => {
                                    const isDeactivated = client.company_name?.startsWith('(INACTIVE) ');
                                    const displayName = isDeactivated ? client.company_name.replace('(INACTIVE) ', '') : client.company_name;
                                    return (
                                        <tr key={client.id} style={{ borderBottom: '1px solid #f3f4f6', opacity: isDeactivated ? 0.5 : 1 }}>
                                            <td style={{ padding: '14px 20px' }}>
                                                <div style={{ fontWeight: 700, color: '#111827' }}>{displayName}</div>
                                                {client.address && <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 2 }}>{client.address}</div>}
                                            </td>
                                            <td style={{ padding: '14px 20px', color: '#6b7280', fontFamily: 'monospace', fontSize: '0.88rem' }}>
                                                {client.ssm_id ?? '—'}
                                            </td>
                                            <td style={{ padding: '14px 20px', color: '#6b7280', fontSize: '0.88rem' }}>
                                                {client.company_phone || client.contact_phone || '—'}
                                            </td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <div style={{ fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>{client.profiles?.name ?? '—'}</div>
                                                {client.profiles?.email && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{client.profiles.email}</div>}
                                            </td>
                                            <td style={{ padding: '14px 20px' }}>
                                                {isDeactivated ? (
                                                    <span style={{ background: '#f3f4f6', color: '#6b7280', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>Inactive</span>
                                                ) : (
                                                    <span style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>Active</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '14px 20px', color: '#9ca3af', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                {format(new Date(client.created_at), 'MMM d, yyyy')}
                                            </td>
                                            <td style={{ padding: '14px 20px', display: 'flex', gap: 8 }}>
                                                <button
                                                    onClick={() => openReassign(client)}
                                                    style={{
                                                        padding: '6px 14px',
                                                        background: '#f3f4f6',
                                                        color: '#374151',
                                                        border: 'none',
                                                        borderRadius: 8,
                                                        fontWeight: 700,
                                                        fontSize: '0.82rem',
                                                        cursor: 'pointer',
                                                        whiteSpace: 'nowrap',
                                                        transition: 'background 0.15s'
                                                    }}
                                                >
                                                    🔄 Reassign
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(client)}
                                                    style={{
                                                        padding: '6px 14px',
                                                        background: isDeactivated ? 'var(--primary-light)' : '#fee2e2',
                                                        color: isDeactivated ? 'var(--primary-dark)' : '#ef4444',
                                                        border: 'none',
                                                        borderRadius: 8,
                                                        fontWeight: 700,
                                                        fontSize: '0.82rem',
                                                        cursor: 'pointer',
                                                        whiteSpace: 'nowrap',
                                                        transition: 'background 0.15s'
                                                    }}
                                                >
                                                    {isDeactivated ? '✅ Reactivate' : '🚫 Deactivate'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>No clients found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!loading && (
                        <div style={{ marginTop: 12, fontSize: '0.85rem', color: '#9ca3af' }}>
                            Showing {filtered.length} of {clients.length} clients
                        </div>
                    )}
                </div>
            </div>

            {/* Reassign Modal */}
            {reassignClient && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: 20
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 20,
                        width: '100%',
                        maxWidth: 480,
                        overflow: 'hidden',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ padding: '24px 28px', background: 'var(--primary-dark)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Reassign Client</h2>
                                <div style={{ fontSize: '0.88rem', opacity: 0.85, marginTop: 2 }}>{reassignClient.company_name}</div>
                            </div>
                            <button
                                onClick={() => setReassignClient(null)}
                                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.8rem', cursor: 'pointer', lineHeight: 1 }}
                            >×</button>
                        </div>

                        <div style={{ padding: 28 }}>
                            <div style={{ marginBottom: 8, fontSize: '0.9rem', color: '#374151', fontWeight: 600 }}>Current Agent</div>
                            <div style={{
                                padding: '10px 14px',
                                background: '#f9fafb',
                                borderRadius: 10,
                                marginBottom: 24,
                                fontSize: '0.9rem',
                                color: '#111827',
                                fontWeight: 600,
                                border: '1px solid #e5e7eb'
                            }}>
                                {reassignClient.profiles?.name ?? 'Unassigned'} {reassignClient.profiles?.email ? `· ${reassignClient.profiles.email}` : ''}
                            </div>

                            <div style={{ marginBottom: 8, fontSize: '0.9rem', color: '#374151', fontWeight: 600 }}>Reassign To</div>
                            <select
                                value={selectedAgentId}
                                onChange={e => setSelectedAgentId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '11px 14px',
                                    border: '1.5px solid #d1d5db',
                                    borderRadius: 10,
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    background: '#fff',
                                    color: '#111827',
                                    marginBottom: 28,
                                    fontFamily: 'inherit',
                                }}
                            >
                                <option value="">— Select an agent —</option>
                                {agents.map(a => (
                                    <option key={a.id} value={a.id}>
                                        {a.name} ({a.email})
                                    </option>
                                ))}
                            </select>

                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setReassignClient(null)}
                                    style={{
                                        padding: '10px 22px',
                                        border: '1.5px solid #d1d5db',
                                        background: '#fff',
                                        borderRadius: 10,
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        color: '#374151'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReassign}
                                    disabled={!selectedAgentId || reassigning}
                                    style={{
                                        padding: '10px 28px',
                                        background: !selectedAgentId || reassigning ? '#9ca3af' : 'var(--primary)',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 10,
                                        fontWeight: 700,
                                        fontSize: '0.9rem',
                                        cursor: !selectedAgentId || reassigning ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {reassigning ? 'Reassigning…' : 'Confirm Reassign'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
