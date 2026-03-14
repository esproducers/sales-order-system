'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import AdminSidebar from '@/components/AdminSidebar'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createAgentAdmin, updateAgentAdmin, approveAgentAdmin } from '@/actions/agents'
import { updateAgentStatusAdmin } from '@/actions/clients'
import Modal from '@/components/Modal'

export default function AgentManagementPage() {
    const { profile, loading: authLoading } = useAuth()
    const router = useRouter()
    const [agents, setAgents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    // Modals state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [createForm, setCreateForm] = useState({ email: '', name: '', phone: '', commission_rate: '5' })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [isRateModalOpen, setIsRateModalOpen] = useState(false)
    const [rateForm, setRateForm] = useState({ agentId: '', currentRate: '0' })

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [confirmAction, setConfirmAction] = useState<{ title: string, message: string, onConfirm: () => void }>({ title: '', message: '', onConfirm: () => { } })


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
                .order('created_at', { ascending: false })

            if (error) throw error
            setAgents(data || [])
        } catch (err: any) {
            toast.error('Failed to load agents')
        } finally {
            setLoading(false)
        }
    }

    const submitCreateAgent = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setIsSubmitting(true)
            const { error } = await createAgentAdmin({
                email: createForm.email,
                name: createForm.name,
                phone: createForm.phone || '',
                commission_rate: parseFloat(createForm.commission_rate) || 0
            })
            if (error) throw new Error(error)
            toast.success('Agent created!')
            setIsCreateModalOpen(false)
            setCreateForm({ email: '', name: '', phone: '', commission_rate: '5' })
            loadAgents()
        } catch (err: any) {
            toast.error(err.message || 'Failed to create agent')
        } finally {
            setIsSubmitting(false)
        }
    }

    const submitUpdateCommission = async (e: React.FormEvent) => {
        e.preventDefault()
        const newRate = parseFloat(rateForm.currentRate)
        if (isNaN(newRate) || newRate < 0 || newRate > 100) {
            toast.error('Invalid rate')
            return
        }
        try {
            setIsSubmitting(true)
            const { error } = await updateAgentAdmin(rateForm.agentId, { commission_rate: newRate })
            if (error) throw new Error(error)
            setAgents(prev => prev.map(a => a.id === rateForm.agentId ? { ...a, commission_rate: newRate } : a))
            toast.success('Rate updated')
            setIsRateModalOpen(false)
        } catch (err: any) {
            toast.error('Failed: ' + err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const promptToggleRole = (agent: any) => {
        const newRole = agent.role === 'admin' ? 'agent' : 'admin'
        setConfirmAction({
            title: 'Change Role',
            message: `Change ${agent.name}'s role to ${newRole}?`,
            onConfirm: async () => {
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
        })
        setIsConfirmModalOpen(true)
    }

    const promptApprove = (agentId: string) => {
        setConfirmAction({
            title: 'Approve User',
            message: 'Approve this user? An email confirmation will be sent.',
            onConfirm: async () => {
                try {
                    setLoading(true)
                    const { error } = await approveAgentAdmin(agentId)
                    if (error) throw new Error(error)
                    toast.success('User approved and email sent!')
                    loadAgents()
                } catch (err: any) {
                    toast.error('Failed: ' + err.message)
                } finally {
                    setLoading(false)
                }
            }
        })
        setIsConfirmModalOpen(true)
    }

    const promptToggleStatus = (agent: any) => {
        const isDeactivated = agent.name?.startsWith('(INACTIVE) ')
        const actionText = isDeactivated ? 'Reactivate' : 'Deactivate'
        setConfirmAction({
            title: `${actionText} User`,
            message: `Are you sure you want to ${actionText.toLowerCase()} this user?`,
            onConfirm: async () => {
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
        })
        setIsConfirmModalOpen(true)
    }

    const filteredAgents = agents.filter(a =>
        a.name?.toLowerCase().includes(search.toLowerCase()) ||
        a.email?.toLowerCase().includes(search.toLowerCase())
    )

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex items-center justify-center p-20 flex-1">
                    <p className="text-gray-500">Loading user management…</p>
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
                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 m-0 leading-tight tracking-tight">Portal Management</h1>
                            <p className="text-gray-500 mt-2 text-[0.95rem]">Manage roles, approvals and status for all system users</p>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-full sm:w-auto px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-xl shadow-[0_4px_12px_rgba(46,189,142,0.25)] hover:bg-primary-dark transition-colors"
                        >
                            + Add New User
                        </button>
                    </div>

                    <div className="bg-white rounded-xl p-4 md:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-6">
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                        />
                    </div>

                    {/* Desktop Table View & Mobile Card View */}
                    <div className="bg-transparent md:bg-white md:rounded-xl md:shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
                        {/* Desktop Table Header */}
                        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_2fr] bg-gray-50 border-b border-gray-100">
                            {['User Details', 'Role', 'Approval', 'Comm.', 'Actions'].map((h, i) => (
                                <div key={h} className={`px-6 py-4 text-xs font-bold text-gray-500 uppercase ${i === 4 ? 'text-right' : 'text-left'}`}>
                                    {h}
                                </div>
                            ))}
                        </div>

                        {/* List Items (Cards on Mobile, Rows on Desktop) */}
                        <div className="flex flex-col gap-4 md:gap-0">
                            {filteredAgents.map(agent => {
                                const isDeactivated = agent.name?.startsWith('(INACTIVE) ')
                                const displayName = isDeactivated ? agent.name.replace('(INACTIVE) ', '') : agent.name
                                const isPending = agent.is_approved === false

                                return (
                                    <div key={agent.id} className={`bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] md:shadow-none md:rounded-none md:border-b md:border-gray-100 md:grid md:grid-cols-[2fr_1fr_1fr_1fr_2fr] items-center p-4 md:p-0 ${isDeactivated ? 'opacity-60 bg-gray-50' : ''}`}>
                                        
                                        {/* Mobile: Header & Status Row, Desktop: Col 1 */}
                                        <div className="md:px-6 md:py-4 flex justify-between items-start md:block mb-3 md:mb-0">
                                            <div>
                                                <div className="font-bold text-gray-900 flex items-center gap-2">
                                                    {displayName}
                                                    {isPending && <span title="Pending Approval" className="cursor-help">⏳</span>}
                                                </div>
                                                <div className="text-sm text-gray-500 mt-0.5">{agent.email}</div>
                                            </div>
                                            {/* Mobile only: badges */}
                                            <div className="md:hidden flex flex-col items-end gap-2">
                                                <span className={`text-xs font-bold uppercase ${agent.role === 'admin' ? 'text-purple-600' : 'text-gray-700'}`}>
                                                    {agent.role}
                                                </span>
                                                <span className={`px-2.5 py-1 rounded-full text-[0.7rem] font-bold ${
                                                    isPending ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {isPending ? 'PENDING' : 'APPROVED'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Desktop Only: Role */}
                                        <div className="hidden md:block px-6 py-4">
                                            <span className={`text-sm font-bold uppercase ${agent.role === 'admin' ? 'text-purple-600' : 'text-gray-700'}`}>
                                                {agent.role}
                                            </span>
                                        </div>

                                        {/* Desktop Only: Approval Status */}
                                        <div className="hidden md:block px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                isPending ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'
                                            }`}>
                                                {isPending ? 'PENDING' : 'APPROVED'}
                                            </span>
                                        </div>

                                        {/* Mobile: Commission Row, Desktop: Col 4 */}
                                        <div className="md:px-6 md:py-4 text-sm md:text-base mb-4 md:mb-0 border-t border-gray-100 md:border-t-0 pt-3 md:pt-0">
                                            <span className="md:hidden text-gray-500 font-semibold text-xs mr-2">Commission Rate:</span>
                                            <span className="font-bold text-primary-dark bg-primary-light px-2.5 py-1 rounded-lg">
                                                {agent.commission_rate}%
                                            </span>
                                        </div>

                                        {/* Actions (Flex row on mobile, Flex End on desktop) */}
                                        <div className="md:px-6 md:py-4 flex flex-wrap gap-2 md:justify-end items-center border-t border-gray-100 md:border-t-0 pt-3 md:pt-0">
                                            {isPending && (
                                                <button onClick={() => promptApprove(agent.id)} className="px-3 py-1.5 bg-primary text-white border-none rounded-lg font-bold text-xs cursor-pointer shadow-sm">
                                                    Approve
                                                </button>
                                            )}
                                            <button onClick={() => promptToggleRole(agent)} className="px-2 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold text-xs transition">
                                                Role
                                            </button>
                                            <button onClick={() => {
                                                setRateForm({ agentId: agent.id, currentRate: agent.commission_rate.toString() })
                                                setIsRateModalOpen(true)
                                            }} className="px-2 py-1.5 text-primary-dark hover:bg-primary-light rounded-lg font-semibold text-xs transition">
                                                Rate %
                                            </button>
                                            <button onClick={() => promptToggleStatus(agent)} className={`px-2 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1 ${isDeactivated ? 'text-primary-dark hover:bg-primary-light' : 'text-red-500 hover:bg-red-50'}`}>
                                                {isDeactivated ? '✓ Activate' : '✖ Disable'}
                                            </button>
                                            <Link href={`/admin/agent/${agent.id}`} className="px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg font-bold text-xs ml-auto md:ml-0 transition">
                                                Details
                                            </Link>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        
                        {filteredAgents.length === 0 && (
                            <div className="p-12 text-center text-gray-400 font-medium bg-white rounded-xl shadow-sm md:shadow-none md:rounded-none">No users found.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Menu Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New User">
                <form onSubmit={submitCreateAgent} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                        <input required type="email" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="user@example.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                        <input required type="text" value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Jane Doe" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number (Optional)</label>
                        <input type="text" value={createForm.phone} onChange={e => setCreateForm({...createForm, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="+60 123 4567" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Commission Rate (%)</label>
                        <input required type="number" step="0.1" value={createForm.commission_rate} onChange={e => setCreateForm({...createForm, commission_rate: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-primary text-white font-bold rounded-lg mt-4 disabled:opacity-50">
                        {isSubmitting ? 'Creating...' : 'Create Agent'}
                    </button>
                </form>
            </Modal>

            {/* Edit Rate Modal */}
            <Modal isOpen={isRateModalOpen} onClose={() => setIsRateModalOpen(false)} title="Update Commission Rate">
                <form onSubmit={submitUpdateCommission} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">New Commission Rate (%)</label>
                        <input required type="number" step="0.1" min="0" max="100" value={rateForm.currentRate} onChange={e => setRateForm({...rateForm, currentRate: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-primary text-white font-bold rounded-lg mt-4 disabled:opacity-50">
                        {isSubmitting ? 'Updating...' : 'Save Rate'}
                    </button>
                </form>
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
