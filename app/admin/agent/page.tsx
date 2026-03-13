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
import { createAgentAdmin, updateAgentAdmin } from '@/actions/agents'
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
                .eq('role', 'agent')
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

    const handleToggleStatus = async (agent: any) => {
        const isDeactivated = agent.name?.startsWith('(INACTIVE) ')
        if (!confirm(`${isDeactivated ? 'Reactivate' : 'Deactivate'} this agent?`)) return
        try {
            setLoading(true)
            const { error } = await updateAgentStatusAdmin(agent.id, isDeactivated)
            if (error) throw new Error(typeof error === 'string' ? error : error.message)
            toast.success(`Agent ${isDeactivated ? 'reactivated' : 'deactivated'}`)
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
                    <p>Loading agent management…</p>
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
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>Agent Management</h1>
                            <p style={{ color: '#6b7280', marginTop: 4 }}>Manage and monitor all sales agents in the system</p>
                        </div>
                        <button onClick={handleCreateAgent} style={{ padding: '12px 24px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>+ Add New Agent</button>
                    </div>

                    <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 24 }}>
                        <input type="text" placeholder="Search agents by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1.5px solid #d1d5db', outline: 'none' }} />
                    </div>

                    <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f9fafb' }}>
                                <tr>
                                    {['Agent Details', 'Commission', 'Joined', 'Status', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '14px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAgents.map(agent => {
                                    const isDeactivated = agent.name?.startsWith('(INACTIVE) ')
                                    const displayName = isDeactivated ? agent.name.replace('(INACTIVE) ', '') : agent.name
                                    return (
                                        <tr key={agent.id} style={{ borderBottom: '1px solid #f3f4f6', opacity: isDeactivated ? 0.6 : 1 }}>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ fontWeight: 700, color: '#111827' }}>{displayName}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{agent.email}</div>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{ fontWeight: 700, color: 'var(--primary-dark)', background: 'var(--primary-light)', padding: '4px 10px', borderRadius: 8 }}>
                                                    {agent.commission_rate}%
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px', color: '#6b7280' }}>
                                                {format(new Date(agent.created_at), 'MMM d, yyyy')}
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{
                                                    padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                                                    background: isDeactivated ? '#fee2e2' : '#dcfce7',
                                                    color: isDeactivated ? '#ef4444' : '#15803d'
                                                }}>
                                                    {isDeactivated ? 'INACTIVE' : 'ACTIVE'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', gap: 12 }}>
                                                    <button onClick={() => handleUpdateCommission(agent.id, agent.commission_rate)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>Rate</button>
                                                    <button onClick={() => handleToggleStatus(agent)} style={{ background: 'none', border: 'none', color: isDeactivated ? 'var(--primary-dark)' : '#ef4444', fontWeight: 600, cursor: 'pointer' }}>
                                                        {isDeactivated ? 'Reactivate' : 'Deactivate'}
                                                    </button>
                                                    <Link href={`/admin/agent/${agent.id}`} style={{ color: '#6b7280', fontWeight: 600, textDecoration: 'none' }}>Details</Link>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        {filteredAgents.length === 0 && (
                            <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>No agents found.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
