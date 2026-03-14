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
import { updateOrderStatusAdmin } from '@/actions/orders'
import { updateAgentStatusAdmin } from '@/actions/clients'
import Modal from '@/components/Modal'

const STATUS_OPTIONS = ['Confirmed', 'Preparing', 'Picked up', 'Delivered']

export default function AdminPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const [stats, setStats] = useState({
    totalAdmins: 0,
    totalAgents: 0,
    totalClients: 0,
    totalOrders: 0,
    totalSales: 0,
    totalCommission: 0,
    totalPendingAgents: 0,
  })
  const [agents, setAgents] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
        toast.error('Access denied. Admin only.')
        router.push('/dashboard')
      }
    }
  }, [profile, authLoading, router])

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadAdminData()
    }
  }, [profile])

  const loadAdminData = async () => {
    try {
      setLoading(true)

      const { data: agentsData, error: agentsError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (agentsError) throw agentsError

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, clients(company_name), profiles(name)')
        .order('created_at', { ascending: false })
      if (ordersError) throw ordersError

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id')
      if (clientsError) throw clientsError

      const totalSales = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      const totalCommission = ordersData?.reduce((sum, order) => sum + (order.commission_amount || 0), 0) || 0

      setStats({
        totalAdmins: agentsData?.filter(a => a.role === 'admin' && !a.name?.startsWith('(INACTIVE) ')).length || 0,
        totalAgents: agentsData?.filter(a => a.role === 'agent' && !a.name?.startsWith('(INACTIVE) ')).length || 0,
        totalClients: clientsData?.length || 0,
        totalOrders: ordersData?.length || 0,
        totalSales,
        totalCommission,
        totalPendingAgents: agentsData?.filter(a => a.is_approved === false).length || 0,
      })

      setAgents(agentsData || [])
      setRecentOrders(ordersData || [])
    } catch (error: any) {
      console.error('Error loading admin data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const submitCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      const { success, error } = await createAgentAdmin({
        email: createForm.email,
        name: createForm.name,
        phone: createForm.phone || '',
        commission_rate: parseFloat(createForm.commission_rate) || 0
      })
      if (error) throw new Error(error)

      toast.success('Agent created! Temp password: temporary123', { duration: 10000, icon: '🔑' })
      setIsCreateModalOpen(false)
      setCreateForm({ email: '', name: '', phone: '', commission_rate: '5' })
      loadAdminData()
    } catch (error: any) {
      console.error('Error creating agent:', error)
      toast.error(error.message || 'Failed to create agent')
    } finally {
      setIsSubmitting(false)
    }
  }

  const promptToggleStatus = (user: any) => {
    const isDeactivated = user.name?.startsWith('(INACTIVE) ')
    const actionText = isDeactivated ? 'Reactivate' : 'Deactivate'
    setConfirmAction({
      title: `${actionText} User`,
      message: `Are you sure you want to ${actionText.toLowerCase()} this user?`,
      onConfirm: async () => {
        try {
          setLoading(true)
          const { error } = await updateAgentStatusAdmin(user.id, isDeactivated)
          if (error) throw new Error(typeof error === 'string' ? error : error.message)
          toast.success(`User ${isDeactivated ? 'reactivated' : 'deactivated'}`)
          loadAdminData()
        } catch (err: any) {
          toast.error('Failed: ' + (err.message || 'Unknown error'))
        } finally {
          setLoading(false)
        }
      }
    })
    setIsConfirmModalOpen(true)
  }

  const submitUpdateCommission = async (e: React.FormEvent) => {
    e.preventDefault()
    const newRate = parseFloat(rateForm.currentRate)
    if (isNaN(newRate) || newRate < 0 || newRate > 100) {
      toast.error('Invalid commission rate')
      return
    }
    try {
      setIsSubmitting(true)
      const { data, error } = await updateAgentAdmin(rateForm.agentId, { commission_rate: newRate })
      if (error) throw new Error(error)
      setAgents(prev => prev.map(a => a.id === rateForm.agentId ? { ...a, commission_rate: newRate } : a))
      toast.success('Commission rate updated!')
      setIsRateModalOpen(false)
    } catch (error: any) {
      toast.error('Failed to update commission: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
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
          toast.success('Agent approved and email sent!')
          loadAdminData()
        } catch (err: any) {
          toast.error('Failed: ' + err.message)
        } finally {
          setLoading(false)
        }
      }
    })
    setIsConfirmModalOpen(true)
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await updateOrderStatusAdmin(orderId, newStatus)
      if (error) throw new Error(error)
      setRecentOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      toast.success(`Order status updated to ${newStatus}`)
    } catch (err: any) {
      toast.error('Failed to update order status: ' + err.message)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex items-center justify-center p-20 flex-1">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-primary-mid border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading admin dashboard…</p>
          </div>
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
          <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 m-0 leading-tight tracking-tight">Admin Panel</h1>
              <p className="text-gray-500 mt-2 text-[0.95rem]">Manage system, monitoring performance and sales team.</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-xl shadow-[0_4px_12px_rgba(46,189,142,0.25)] hover:bg-primary-dark transition-colors"
            >
              + Add New Agent
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
            {[
              { label: 'New Orders', value: recentOrders.filter(o => !o.status || o.status.toLowerCase() === 'confirmed' || o.status === 'active').length, icon: '🚨', color: '#ffedd5', href: '#incoming-orders' },
              { label: 'New Agents', value: stats.totalPendingAgents, icon: '👤', color: '#fef9c3', href: '/admin/agent' },
              { label: 'Total Admins', value: stats.totalAdmins, icon: '👑', color: '#fef3c7', href: '/admin/admins' },
              { label: 'Total Agents', value: stats.totalAgents, icon: '👨‍💼', color: '#dbeafe', href: '/admin/agent' },
              { label: 'Total Clients', value: stats.totalClients, icon: '🏢', color: '#dcfce7', href: '/admin/clients' },
              { label: 'Total Orders', value: stats.totalOrders, icon: '📦', color: '#f3e8ff', href: '/admin/orders' },
              { label: 'Total Sales', value: `RM${stats.totalSales.toFixed(2)}`, icon: '💰', color: '#fef9c3', href: '/admin/orders' },
              { label: 'Total Comm.', value: `RM${stats.totalCommission.toFixed(2)}`, icon: '🎟️', color: '#fee2e2', href: '/admin/orders' },
            ].map((s) => (
              <Link key={s.label} href={s.href} className="flex items-center justify-between p-4 md:p-5 bg-white rounded-[14px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-50 hover:scale-[1.02] transition-transform min-h-[100px]">
                  <div className="min-w-0 flex-1 mr-2 text-left">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{s.label}</p>
                    <p className="text-2xl font-black text-gray-900 break-all leading-none">{s.value}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: s.color }}>
                    {s.icon}
                  </div>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
            <div className="flex flex-col gap-6">
              {/* New Incoming Orders */}
              <div id="incoming-orders" className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden border border-gray-50">
                <div className="px-5 md:px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-yellow-50">
                  <h2 className="font-extrabold text-[1.1rem] text-yellow-700 flex items-center gap-2">
                    <span className="text-[1.3rem]">🚨</span> New Incoming Orders
                  </h2>
                  <Link href="/admin/orders" className="text-xs text-yellow-700 font-bold hover:underline">See All Orders →</Link>
                </div>
                <div className="max-h-[400px] overflow-y-auto px-5 md:px-6 py-3">
                  {recentOrders.filter(o => !['delivered'].includes((o.status || '').toLowerCase())).length > 0 ? (
                    recentOrders.filter(o => !['delivered'].includes((o.status || '').toLowerCase())).map((order) => {
                      const currentStatus = order.status || 'Confirmed'
                      return (
                        <div key={order.id} className="flex justify-between items-start py-4 border-b border-gray-50 last:border-0 gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="font-black text-[0.95rem] text-gray-900 break-words leading-tight">#{order.id.slice(0, 8).toUpperCase()} - {order.item_name}</div>
                            <div className="text-[0.8rem] text-gray-500 mt-1.5 flex flex-col gap-0.5">
                              <span><strong className="text-gray-700">Client:</strong> {order.clients?.company_name}</span>
                              <span><strong className="text-gray-700">Agent:</strong> {order.profiles?.name}</span>
                              <span><strong className="text-gray-700">Date:</strong> {format(new Date(order.created_at), 'MMM d, yyyy HH:mm')}</span>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2 shrink-0">
                            <div className="font-black text-[1.1rem] text-gray-900">RM{order.total_amount?.toFixed(2)}</div>
                            <select
                              value={currentStatus === 'active' ? 'Confirmed' : currentStatus}
                              onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                              className={`px-2.5 py-1.5 rounded-lg border-2 border-transparent text-xs font-bold outline-none cursor-pointer text-gray-900 ${
                                currentStatus === 'Preparing' ? 'bg-indigo-100 focus:border-indigo-300' 
                                : currentStatus === 'Picked up' ? 'bg-amber-100 focus:border-amber-300' 
                                : 'bg-green-100 focus:border-green-300'
                              }`}
                            >
                              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-gray-400 text-center py-8 font-semibold text-sm">No incoming orders at the moment.</p>
                  )}
                </div>
              </div>

              {/* System Tools Card */}
              <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-6 border border-gray-50">
                <h3 className="font-extrabold text-base mb-4">System Management</h3>

                {/* Added Global Commission Control */}
                <div className="bg-primary-light p-4 rounded-xl mb-5 border border-primary-mid/30">
                  <div className="text-xs font-bold text-primary-dark tracking-wide mb-2 uppercase">DEFAULT COMMISSION RATE</div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div className="text-2xl font-black text-gray-900">
                      {agents.find(p => p.id === profile?.id)?.commission_rate || profile?.commission_rate || 5}%
                    </div>
                    <button
                      onClick={() => {
                        setRateForm({ agentId: profile?.id || '', currentRate: (agents.find(p => p.id === profile?.id)?.commission_rate || profile?.commission_rate || 5).toString() })
                        setIsRateModalOpen(true)
                      }}
                      className="bg-primary text-white border-none rounded-lg px-4 py-2 text-xs font-bold cursor-pointer hover:bg-primary-dark transition-colors self-start sm:self-auto"
                    >
                      Edit Global Rate
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Link href="/admin/settings" className="px-3 py-3 border-1.5 border-gray-100 bg-gray-50 rounded-lg text-center text-gray-600 font-bold text-sm hover:bg-gray-100 transition-colors">
                    Global Settings
                  </Link>
                  <Link href="/admin/backup" className="px-3 py-3 border-1.5 border-gray-100 bg-gray-50 rounded-lg text-center text-gray-600 font-bold text-sm hover:bg-gray-100 transition-colors">
                    System Backup
                  </Link>
                  <button
                    onClick={() => toast.success('Database backup initiated!')}
                    className="sm:col-span-2 px-3 py-3 bg-gray-900 text-white border-none rounded-lg font-bold text-sm cursor-pointer hover:bg-black transition-colors"
                  >
                    Create System Backup
                  </button>
                </div>
              </div>
            </div>

            {/* Agents List Card - Responsive Stack */}
            <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden border border-gray-50 flex flex-col items-stretch self-start w-full">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <h2 className="font-extrabold text-[1.1rem] m-0 text-gray-900">Agents Management</h2>
                <span className="text-xs bg-gray-100 px-2.5 py-1 rounded-full font-bold text-gray-600">
                  {agents.filter(a => a.role === 'agent').length} Active
                </span>
              </div>

              {/* Mobile Card / Desktop Table responsive rendering */}
              <div className="flex flex-col">
                <div className="hidden md:grid grid-cols-[1.5fr_0.8fr_1fr_1fr] bg-gray-50 border-b border-gray-100">
                  {['Agent', 'Comm.', 'Joined', 'Actions'].map((h, i) => (
                    <div key={h} className={`px-5 py-3 text-xs font-bold text-gray-500 uppercase ${i === 3 ? 'text-right' : 'text-left'}`}>{h}</div>
                  ))}
                </div>

                <div className="flex flex-col gap-2 p-3 md:p-0">
                  {agents.filter(a => a.role === 'agent').map((agent) => {
                    const isDeactivated = agent.name?.startsWith('(INACTIVE) ')
                    const displayName = isDeactivated ? agent.name.replace('(INACTIVE) ', '') : agent.name
                    const isPending = agent.is_approved === false

                    return (
                        <div key={agent.id} className={`bg-white rounded-xl md:rounded-none border border-gray-100 md:border-x-0 md:border-t-0 md:border-b shadow-sm md:shadow-none p-4 md:p-0 md:grid md:grid-cols-[1.5fr_0.8fr_1fr_1fr] items-center ${isDeactivated ? 'opacity-60 bg-gray-50' : ''}`}>
                          {/* Agent Name & Email */}
                          <div className="md:px-5 md:py-3 mb-2 md:mb-0">
                            <div className="font-bold text-gray-900 flex items-center gap-1.5">
                              {displayName}
                              {isPending && <span title="Pending Approval" className="cursor-help">⏳</span>}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{agent.email}</div>
                          </div>

                          {/* Commission */}
                          <div className="md:px-5 md:py-3 mb-3 md:mb-0">
                             <span className="md:hidden text-xs text-gray-500 font-semibold mr-2">Commission:</span>
                             <span className="font-bold text-primary-dark bg-primary-light px-2.5 py-1 rounded-lg text-sm">
                               {agent.commission_rate}%
                             </span>
                          </div>

                          {/* Joined */}
                          <div className="md:px-5 md:py-3 text-sm text-gray-500 hidden md:block">
                            {format(new Date(agent.created_at), 'MMM d, yy')}
                          </div>

                          {/* Actions */}
                          <div className="md:px-5 md:py-3 flex flex-wrap gap-2 md:justify-end items-center border-t border-gray-50 md:border-0 pt-3 md:pt-0">
                            {isPending ? (
                              <button onClick={() => promptApprove(agent.id)} className="px-2.5 py-1.5 bg-primary text-white border-none rounded-lg font-bold text-xs cursor-pointer">
                                Approve
                              </button>
                            ) : (
                              <span className={`px-2 py-1 rounded-md text-[0.65rem] font-bold ${isDeactivated ? 'bg-red-100 text-red-600' : 'bg-teal-50 text-teal-600'}`}>
                                {isDeactivated ? 'INACTIVE' : 'ACTIVE'}
                              </span>
                            )}
                            <button onClick={() => {
                                setRateForm({ agentId: agent.id, currentRate: agent.commission_rate.toString() })
                                setIsRateModalOpen(true)
                            }} className="text-primary hover:bg-primary-light/50 px-2 py-1.5 rounded-lg border-none font-bold cursor-pointer text-xs ml-auto md:ml-0 transition">
                              Rate %
                            </button>
                            <button onClick={() => promptToggleStatus(agent)} className={`hover:bg-gray-100 px-2 py-1.5 rounded-lg border-none font-bold cursor-pointer text-xs transition ${isDeactivated ? 'text-primary-dark' : 'text-red-500'}`}>
                              {isDeactivated ? '✓' : '✖'}
                            </button>
                            <Link href={`/admin/agent/${agent.id}`} className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-2 py-1.5 rounded-lg font-bold text-xs no-underline transition">
                              Details
                            </Link>
                          </div>
                      </div>
                    )
                  })}
                </div>
                {agents.filter(a => a.role === 'agent').length === 0 && (
                  <div className="p-10 text-center text-gray-400 font-medium text-sm">No agents found in system.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Agent">
          <form onSubmit={submitCreateAgent} className="space-y-4">
              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input required type="email" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="agent@example.com" />
              </div>
              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                  <input required type="text" value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Agent Name" />
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
