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
import Modal from '@/components/Modal'

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

    // Modal state
    const [reassignClient, setReassignClient] = useState<any>(null)
    const [selectedAgentId, setSelectedAgentId] = useState('')
    const [reassigning, setReassigning] = useState(false)
    const [isReassignModalOpen, setIsReassignModalOpen] = useState(false)

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [confirmAction, setConfirmAction] = useState<{ title: string, message: string, onConfirm: () => void }>({ title: '', message: '', onConfirm: () => { } })

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
        setIsReassignModalOpen(true)
    }

    const handleReassign = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedAgentId || !reassignClient) return
        if (selectedAgentId === reassignClient.agent_id) {
            toast('No change — same agent selected.')
            setIsReassignModalOpen(false)
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
            setIsReassignModalOpen(false)
            setReassignClient(null)
            loadData()
        } catch (err: any) {
            toast.error('Failed to reassign client')
        } finally {
            setReassigning(false)
        }
    }

    const promptToggleActive = (client: any) => {
        const isCurrentlyDeactivated = client.company_name?.startsWith('(INACTIVE) ')
        const action = isCurrentlyDeactivated ? 'Reactivate' : 'Deactivate'
        setConfirmAction({
            title: `${action} Client`,
            message: `Are you sure you want to ${action.toLowerCase()} this client?`,
            onConfirm: async () => {
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
        })
        setIsConfirmModalOpen(true)
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
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex items-center justify-center p-20 flex-1">
                    <p className="text-gray-500">Loading client data…</p>
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
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 m-0">Client Management</h1>
                            <p className="text-gray-500 mt-2 text-[0.95rem]">Management of all clients in the system</p>
                        </div>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <div className="bg-white rounded-xl py-3 px-5 sm:px-6 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex-1 sm:flex-none border border-gray-50">
                                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total</div>
                                <div className="text-xl sm:text-2xl font-black text-gray-900 mt-1">{clients.length}</div>
                            </div>
                            <div className="bg-white rounded-xl py-3 px-5 sm:px-6 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex-1 sm:flex-none border border-gray-50">
                                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Active</div>
                                <div className="text-xl sm:text-2xl font-black text-primary-dark mt-1">{activeCount}</div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl p-4 md:p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-6 flex flex-col gap-4 border border-gray-50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="sm:col-span-2 lg:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Search</label>
                                <input type="text" placeholder="Company / SSM" value={search} onChange={e => setSearch(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Agent</label>
                                <select
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value && !selectedAgents.includes(e.target.value)) setSelectedAgents([...selectedAgents, e.target.value]);
                                    }}
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition bg-white"
                                >
                                    <option value="">+ Add Agent...</option>
                                    {uniqueAgents.filter(a => !selectedAgents.includes(a as string)).map(a => (
                                        <option key={a as string} value={a as string}>{a as string}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Month</label>
                                <select
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value && !selectedMonths.includes(e.target.value)) setSelectedMonths([...selectedMonths, e.target.value]);
                                    }}
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition bg-white"
                                >
                                    <option value="">+ Add Month...</option>
                                    {monthsList.filter(m => !selectedMonths.includes(m)).map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Date From</label>
                                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition bg-white" />
                            </div>
                            <div className="sm:col-span-2 lg:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Date To</label>
                                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition bg-white" />
                            </div>
                        </div>

                        {(selectedAgents.length > 0 || selectedMonths.length > 0 || dateFrom || dateTo) && (
                            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                                <span className="text-xs text-gray-500 flex items-center mr-1">Filters:</span>
                                {selectedAgents.map(a => (
                                    <div key={a} className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-green-200">
                                        👨‍💼 {a} <button onClick={() => setSelectedAgents(selectedAgents.filter(x => x !== a))} className="hover:text-green-900 border-none bg-transparent cursor-pointer">×</button>
                                    </div>
                                ))}
                                {selectedMonths.map(m => (
                                    <div key={m} className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-yellow-200">
                                        📅 {m} <button onClick={() => setSelectedMonths(selectedMonths.filter(x => x !== m))} className="hover:text-yellow-900 border-none bg-transparent cursor-pointer">×</button>
                                    </div>
                                ))}
                                {dateFrom && (
                                    <div className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-purple-200">
                                        📆 From: {dateFrom} <button onClick={() => setDateFrom('')} className="hover:text-purple-900 border-none bg-transparent cursor-pointer">×</button>
                                    </div>
                                )}
                                {dateTo && (
                                    <div className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-purple-200">
                                        📆 To: {dateTo} <button onClick={() => setDateTo('')} className="hover:text-purple-900 border-none bg-transparent cursor-pointer">×</button>
                                    </div>
                                )}
                                <button onClick={() => { setSelectedAgents([]); setSelectedMonths([]); setDateFrom(''); setDateTo(''); }} className="text-gray-500 hover:text-gray-900 bg-transparent border-none text-xs cursor-pointer underline">Clear All</button>
                            </div>
                        )}
                    </div>

                    <div className="bg-transparent md:bg-white md:rounded-xl md:shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
                        <div className="flex flex-col">
                            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1.5fr_0.8fr_1fr_1fr] bg-gray-50 border-b border-gray-100">
                                {['Company', 'SSM ID', 'Phone', 'Agent', 'Status', 'Added', 'Action'].map((h, i) => (
                                    <div key={h} className={`px-4 py-3 text-xs font-bold text-gray-500 uppercase ${i === 6 ? 'text-right' : 'text-left'}`}>{h}</div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3 md:gap-0">
                                {filtered.map(client => {
                                    const isDeactivated = client.company_name?.startsWith('(INACTIVE) ');
                                    const displayName = isDeactivated ? client.company_name.replace('(INACTIVE) ', '') : client.company_name;

                                    return (
                                        <div key={client.id} className={`bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] md:shadow-none md:rounded-none md:border-b md:border-gray-100 p-4 md:p-0 md:grid md:grid-cols-[2fr_1fr_1fr_1.5fr_0.8fr_1fr_1fr] items-center text-sm ${isDeactivated ? 'opacity-50 bg-gray-50' : ''}`}>
                                            {/* Company Info */}
                                            <div className="md:px-4 md:py-3 mb-2 md:mb-0">
                                                <div className="font-bold text-gray-900">{displayName}</div>
                                                {client.address && <div className="text-xs text-gray-500 mt-0.5">{client.address}</div>}
                                            </div>

                                            {/* SSM */}
                                            <div className="md:px-4 md:py-3 font-mono text-gray-500 mb-1 md:mb-0 text-xs md:text-sm">
                                                <span className="md:hidden font-bold mr-1">SSM:</span>
                                                {client.ssm_id ?? '—'}
                                            </div>

                                            {/* Phone */}
                                            <div className="md:px-4 md:py-3 text-gray-600 mb-2 md:mb-0">
                                                <span className="md:hidden text-xs text-gray-500 font-bold mr-1 uppercase">Phone:</span>
                                                {client.company_phone || client.contact_phone || '—'}
                                            </div>

                                            {/* Agent */}
                                            <div className="md:px-4 md:py-3 mb-3 md:mb-0 border-t border-gray-50 md:border-0 pt-2 md:pt-0">
                                                <span className="md:hidden text-xs text-gray-500 font-bold mr-1 uppercase">Agent:</span>
                                                <span className="font-semibold text-gray-800">{client.profiles?.name ?? '—'}</span>
                                                {client.profiles?.email && <div className="text-xs text-gray-400 mt-0.5">{client.profiles.email}</div>}
                                            </div>

                                            {/* Status */}
                                            <div className="md:px-4 md:py-3 mb-2 md:mb-0">
                                                 <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isDeactivated ? 'bg-gray-100 text-gray-500' : 'bg-primary-light text-primary-dark'}`}>
                                                     {isDeactivated ? 'INACTIVE' : 'ACTIVE'}
                                                 </span>
                                            </div>

                                            {/* Added */}
                                            <div className="hidden md:block md:px-4 md:py-3 text-gray-500 text-sm whitespace-nowrap">
                                                {format(new Date(client.created_at), 'MMM d, yyyy')}
                                            </div>

                                            {/* Actions */}
                                            <div className="md:px-4 md:py-3 flex flex-wrap gap-2 md:justify-end items-center border-t border-gray-50 md:border-0 pt-3 md:pt-0">
                                                <button onClick={() => openReassign(client)} className="flex-1 md:flex-none px-3 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-lg font-bold text-xs transition">
                                                    🔄 Reassign
                                                </button>
                                                <button onClick={() => promptToggleActive(client)} className={`flex-1 md:flex-none px-3 py-1.5 border-none rounded-lg font-bold text-xs transition ${isDeactivated ? 'bg-primary-light text-primary-dark hover:bg-primary-light/80' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                                                    {isDeactivated ? '✅ Reactivate' : '🚫 Deactivate'}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {filtered.length === 0 && (
                                <div className="p-12 text-center text-gray-400 font-medium bg-white shadow-sm md:shadow-none rounded-xl md:rounded-none">No clients found.</div>
                            )}
                        </div>
                    </div>

                    {!loading && filtered.length > 0 && (
                        <div className="mt-4 text-xs font-bold text-gray-400 text-center md:text-left">
                            Showing {filtered.length} of {clients.length} clients
                        </div>
                    )}
                </div>
            </div>

            {/* Reassign Modal */}
            <Modal isOpen={isReassignModalOpen} onClose={() => setIsReassignModalOpen(false)} title="Reassign Client">
                {reassignClient && (
                    <form onSubmit={handleReassign} className="space-y-4">
                        <div>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Current Agent</div>
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-bold mb-4">
                                {reassignClient.profiles?.name ?? 'Unassigned'} {reassignClient.profiles?.email ? `· ${reassignClient.profiles.email}` : ''}
                            </div>

                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Reassign To</label>
                            <select
                                required
                                value={selectedAgentId}
                                onChange={e => setSelectedAgentId(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white text-gray-900 mb-6"
                            >
                                <option value="">— Select an agent —</option>
                                {agents.map(a => (
                                    <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={() => setIsReassignModalOpen(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition">
                                Cancel
                            </button>
                            <button type="submit" disabled={!selectedAgentId || reassigning} className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition disabled:opacity-50">
                                {reassigning ? 'Reassigning...' : 'Confirm'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Confirm Actions Modal */}
            <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title={confirmAction.title}>
                <div className="space-y-6">
                    <p className="text-gray-600">{confirmAction.message}</p>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setIsConfirmModalOpen(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition">Cancel</button>
                        <button onClick={() => { setIsConfirmModalOpen(false); confirmAction.onConfirm(); }} className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition">Confirm</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
