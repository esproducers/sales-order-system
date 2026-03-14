'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import AdminSidebar from '@/components/AdminSidebar'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { createAgentAdmin, updateAgentAdmin, approveAgentAdmin } from '@/actions/agents'
import { updateAgentStatusAdmin } from '@/actions/clients'

export default function AgentManagementPage() {
    const { profile, loading: authLoading } = useAuth()
    const router = useRouter()
    const [agents, setAgents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        if (!authLoading && profile) {
            if (profile.role !== 'admin') {
                toast.error('Access denied.')
                router.push('/dashboard')
            } else {
                loadAgents()
            }
        }
    }, [profile, authLoading])

    const loadAgents = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                // .eq('role', 'agent') // Remove filter to see all users/roles
                .order('created_at', { ascending: false })

            if (error) throw error
            setAgents(data || [])
        } catch (err: any) {
            toast.error('Failed to load agents')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateAgent = async () => {
        const email = prompt('Enter agent email:')
        if (!email) return
        const name = prompt('Enter agent name:')
        if (!name) return
        const phone = prompt('Enter agent phone:')
        const commissionRate = parseFloat(prompt('Enter commission rate (%):') || '5')

        try {
            setLoading(true)
            const { error } = await createAgentAdmin({
                email,
                name,
                phone: phone || '',
                commission_rate: commissionRate
            })
            if (error) throw new Error(error)
            toast.success('Agent created!')
            loadAgents()
        } catch (err: any) {
            toast.error(err.message || 'Failed to create agent')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateCommission = async (agentId: string, currentRate: number) => {
        const newRate = parseFloat(prompt('Enter new commission rate (%):', currentRate.toString()) || '')
        if (isNaN(newRate) || newRate < 0 || newRate > 100) {
            toast.error('Invalid rate')
            return
        }
        try {
            const { error } = await updateAgentAdmin(agentId, { commission_rate: newRate })
            if (error) throw new Error(error)
            setAgents(prev => prev.map(a => a.id === agentId ? { ...a, commission_rate: newRate } : a))
            toast.success('Rate updated')
        } catch (err: any) {
            toast.error('Failed: ' + err.message)
        }
    }

    const handleToggleRole = async (agent: any) => {
        const newRole = agent.role === 'admin' ? 'agent' : 'admin'
        if (!confirm(`Change ${agent.name}'s role to ${newRole}?`)) return
        try {
            setLoading(true)
            const { error } = await updateAgentAdmin(agent.id, { role: newRole })
            if (error) throw new Error(error)
            toast.success(`Role updated to ${newRole}`)
            loadAgents()
        } catch (err: any) {
            toast.error('Failed: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (agentId: string) => {
        if (!confirm('Approve this agent? An email confirmation will be sent.')) return
        try {
            setLoading(true)
            const { error } = await approveAgentAdmin(agentId)
            if (error) throw new Error(error)
            toast.success('Agent approved and email sent!')
            loadAgents()
        } catch (err: any) {
            toast.error('Failed: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleStatus = async (agent: any) => {
        const isDeactivated = agent.name?.startsWith('(INACTIVE) ')
        if (!confirm(`${isDeactivated ? 'Reactivate' : 'Deactivate'} this user?`)) return
        try {
            setLoading(true)
            const { error } = await updateAgentStatusAdmin(agent.id, isDeactivated)
            if (error) throw new Error(typeof error === 'string' ? error : error.message)
            toast.success(`User ${isDeactivated ? 'reactivated' : 'deactivated'}`)
            loadAgents()
        } catch (err: any) {
            toast.error('Failed: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const filteredAgents = agents.filter(a =>
        a.name?.toLowerCase().includes(search.toLowerCase()) ||
        a.email?.toLowerCase().includes(search.toLowerCase())
    )

    if (loading || authLoading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
                <Navbar />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
                    <p>Loading user management…</p>
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>Portal Management</h1>
                            <p style={{ color: '#6b7280', marginTop: 4 }}>Manage roles, approvals and status for all system users</p>
                        </div>
                        <button onClick={handleCreateAgent} style={{ padding: '12px 24px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>+ Add New User</button>
                    </div>

                    <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 24 }}>
                        <input type="text" placeholder="Search users by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1.5px solid #d1d5db', outline: 'none' }} />
                    </div>

                    <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f9fafb' }}>
                                <tr>
                                    {['User Details', 'Role', 'Approval', 'Comm.', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '14px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAgents.map(agent => {
                                    const isDeactivated = agent.name?.startsWith('(INACTIVE) ')
                                    const displayName = isDeactivated ? agent.name.replace('(INACTIVE) ', '') : agent.name
                                    const isPending = agent.is_approved === false
                                    return (
                                        <tr key={agent.id} style={{ borderBottom: '1px solid #f3f4f6', opacity: isDeactivated ? 0.6 : 1 }}>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    {displayName}
                                                    {isPending && <span title="Pending Approval" style={{ cursor: 'help' }}>⏳</span>}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{agent.email}</div>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: agent.role === 'admin' ? '#7c3aed' : '#374151' }}>
                                                    {agent.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{
                                                    padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                                                    background: isPending ? '#fef9c3' : '#dcfce7',
                                                    color: isPending ? '#854d0e' : '#15803d'
                                                }}>
                                                    {isPending ? 'PENDING' : 'APPROVED'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{agent.commission_rate}%</div>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                    {isPending && (
                                                        <button onClick={() => handleApprove(agent.id)} style={{ padding: '6px 12px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>Approve</button>
                                                    )}
                                                    <button onClick={() => handleToggleRole(agent)} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Role</button>
                                                    <button onClick={() => handleUpdateCommission(agent.id, agent.commission_rate)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>%</button>
                                                    <button onClick={() => handleToggleStatus(agent)} style={{ background: 'none', border: 'none', color: isDeactivated ? 'var(--primary-dark)' : '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>
                                                        {isDeactivated ? '✓' : '✖'}
                                                    </button>
                                                    <Link href={`/admin/agent/${agent.id}`} style={{ color: '#6b7280', fontWeight: 600, textDecoration: 'none', fontSize: '0.8rem' }}>Details</Link>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        {filteredAgents.length === 0 && (
                            <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>No users found.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
