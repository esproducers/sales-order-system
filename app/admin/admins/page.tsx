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
import Modal from '@/components/Modal'

export default function AdminsPage() {
    const { profile, loading: authLoading } = useAuth()
    const [admins, setAdmins] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [selectedAdmin, setSelectedAdmin] = useState<any>(null)
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' })

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [confirmAction, setConfirmAction] = useState<{ title: string, message: string, onConfirm: () => void }>({ title: '', message: '', onConfirm: () => { } })


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
        setIsCreateModalOpen(true)
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
                toast.success('Admin created! Temp password: temporary123', { duration: 10000 })
            }
            setIsCreateModalOpen(false)
            loadAdmins()
        } catch (err: any) {
            toast.error('Error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const promptToggleStatus = (user: any) => {
        const isDeactivated = user.name?.startsWith('(INACTIVE) ')
        const actionText = isDeactivated ? 'Reactivate' : 'Deactivate'
        setConfirmAction({
            title: `${actionText} Admin`,
            message: `Are you sure you want to ${actionText.toLowerCase()} this admin?`,
            onConfirm: async () => {
                try {
                    setLoading(true)
                    const { error } = await updateAgentStatusAdmin(user.id, isDeactivated)
                    if (error) throw new Error(typeof error === 'string' ? error : error.message)
                    toast.success(`Admin ${isDeactivated ? 'reactivated' : 'deactivated'}`)
                    loadAdmins()
                } catch (err: any) {
                    toast.error('Failed: ' + (err.message || 'Unknown error'))
                } finally {
                    setLoading(false)
                }
            }
        })
        setIsConfirmModalOpen(true)
    }

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex items-center justify-center p-20 flex-1">
                    <p className="text-gray-500">Loading admins…</p>
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
                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 m-0">Portal Admins</h1>
                            <p className="text-gray-500 mt-2 text-[0.95rem]">Manage root access and administrative accounts</p>
                        </div>
                        <button
                            onClick={() => openModal()}
                            className="w-full sm:w-auto px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-xl shadow-[0_4px_12px_rgba(46,189,142,0.25)] hover:bg-primary-dark transition-colors"
                        >
                            + Add Admin
                        </button>
                    </div>

                    <div className="bg-transparent md:bg-white md:rounded-xl md:shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
                        <div className="flex flex-col gap-4 md:gap-0">
                            {admins.map(admin => {
                                const isDeactivated = admin.name?.startsWith('(INACTIVE) ');
                                const displayName = isDeactivated ? admin.name.replace('(INACTIVE) ', '') : admin.name;
                                return (
                                    <div key={admin.id} className={`bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] md:shadow-none md:rounded-none md:border-b md:border-gray-100 flex flex-col md:flex-row md:items-center justify-between p-4 md:px-6 md:py-5 gap-4 md:gap-0 ${isDeactivated ? 'opacity-60 bg-gray-50' : ''}`}>
                                        <div className="flex items-start md:items-center gap-4">
                                            <div className={`px-2.5 py-1 text-xs font-bold uppercase rounded-full shrink-0 mt-1 md:mt-0 ${isDeactivated ? 'bg-red-100 text-red-600' : 'bg-primary-light text-primary-dark'}`}>
                                                {isDeactivated ? 'Inactive' : 'Active'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-extrabold text-gray-900 text-[1.05rem] break-all leading-tight">{displayName}</div>
                                                <div className="text-sm text-gray-500 mt-1 flex flex-col sm:flex-row sm:gap-2">
                                                    <span>{admin.email}</span>
                                                    {admin.phone && <span className="hidden sm:inline">•</span>}
                                                    {admin.phone && <span>{admin.phone}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2 items-center border-t border-gray-50 md:border-0 pt-3 md:pt-0 shrink-0 self-end md:self-auto">
                                            <button
                                                onClick={() => openModal(admin)}
                                                className="px-4 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg font-bold text-sm text-gray-700 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => promptToggleStatus(admin)}
                                                className={`px-3 py-1.5 rounded-lg border-none font-bold text-sm cursor-pointer transition flex items-center gap-1 ${isDeactivated ? 'text-primary-dark hover:bg-primary-light' : 'text-red-500 hover:bg-red-50'}`}
                                            >
                                                {isDeactivated ? 'Reactivate' : 'Deactivate'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {admins.length === 0 && (
                            <div className="p-12 text-center text-gray-400 font-medium bg-white rounded-xl shadow-sm md:shadow-none md:rounded-none">No admins found.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Admin Edit/Create Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title={selectedAdmin ? 'Edit Admin Details' : 'Add New Admin'}>
                <form onSubmit={handleSaveAdmin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            disabled={!!selectedAdmin}
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary ${selectedAdmin ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number (Optional)</label>
                        <input
                            type="text"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-2.5 bg-primary text-white font-bold rounded-lg mt-4 disabled:opacity-50 hover:bg-primary-dark transition-colors">
                        {loading ? 'Saving...' : 'Save Changes'}
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
