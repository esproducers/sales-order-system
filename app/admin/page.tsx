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

  // 检查管理员权限
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

      // 获取所有代理
      const { data: agentsData, error: agentsError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (agentsError) throw agentsError

      // 获取所有订单用于统计
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, clients(company_name), profiles(name)')
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      // 获取所有客户
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id')

      if (clientsError) throw clientsError

      // 计算统计数据
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

  const handleCreateAgent = async () => {
    const email = prompt('Enter agent email:')
    if (!email) return

    const name = prompt('Enter agent name:')
    if (!name) return

    const phone = prompt('Enter agent phone:')
    const commissionRate = parseFloat(prompt('Enter commission rate (%):') || '5')

    try {
      setLoading(true)
      const { success, error } = await createAgentAdmin({
        email,
        name,
        phone: phone || '',
        commission_rate: commissionRate
      })

      if (error) throw new Error(error)

      toast.success('Agent created! Temp password: temporary123', {
        duration: 10000,
        icon: '🔑'
      })
      loadAdminData()
    } catch (error: any) {
      console.error('Error creating agent:', error)
      toast.error(error.message || 'Failed to create agent')
    } finally {
      setLoading(false)
    }
  }

  // ---- New Admin Handlers ----
  const handleCreateAdmin = async () => {
    const email = prompt('Enter admin email:')
    if (!email) return
    const name = prompt('Enter admin name:')
    if (!name) return
    const phone = prompt('Enter admin phone (optional):')
    try {
      setLoading(true)
      const { data, error } = await supabase.from('profiles').insert({
        email,
        name,
        phone: phone || '',
        role: 'admin'
      })
      if (error) throw new Error(error.message)
      toast.success('Admin created!')
      loadAdminData()
    } catch (err: any) {
      console.error('Error creating admin:', err)
      toast.error(err.message || 'Failed to create admin')
    } finally {
      setLoading(false)
    }
  }

  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);

  const openEditModal = (admin: any) => {
    setSelectedAdmin({ ...admin }); // clone
  };

  const closeEditModal = () => {
    setSelectedAdmin(null);
  };

  const handleSaveAdmin = async () => {
    if (!selectedAdmin) return;
    const { id, name, email, phone, role } = selectedAdmin;
    try {
      setLoading(true);
      const { error } = await supabase.from('profiles').update({ name, email, phone, role }).eq('id', id);
      if (error) throw new Error(error.message);
      toast.success('Admin updated');
      loadAdminData();
      closeEditModal();
    } catch (err: any) {
      console.error('Error updating admin:', err);
      toast.error(err.message || 'Failed to update admin');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    const isDeactivated = user.name?.startsWith('(INACTIVE) ');
    if (!confirm(`${isDeactivated ? 'Reactivate' : 'Deactivate'} this user?`)) return
    try {
      setLoading(true)
      const { error } = await updateAgentStatusAdmin(user.id, isDeactivated)
      if (error) throw new Error(typeof error === 'string' ? error : error.message)
      toast.success(`User ${isDeactivated ? 'reactivated' : 'deactivated'}`)
      loadAdminData()
    } catch (err: any) {
      console.error('Error updating user status:', err)
      toast.error('Failed: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCommission = async (agentId: string, currentRate: number) => {
    const newRate = parseFloat(prompt('Enter new commission rate (%):', currentRate.toString()) || '')

    if (isNaN(newRate) || newRate < 0 || newRate > 100) {
      toast.error('Invalid commission rate')
      return
    }

    try {
      const { data, error } = await updateAgentAdmin(agentId, { commission_rate: newRate })
      if (error) throw new Error(error)

      // Update local state directly so UI refreshes immediately
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, commission_rate: newRate } : a))
      toast.success('Commission rate updated!')
    } catch (error: any) {
      console.error('Error updating commission:', error)
      toast.error('Failed to update commission: ' + error.message)
    }
  }

  const handleApprove = async (agentId: string) => {
    if (!confirm('Approve this user? An email confirmation will be sent.')) return
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
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 40, height: 40,
              border: '3px solid var(--primary-mid)',
              borderTop: '3px solid var(--primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{ color: '#6b7280' }}>Loading admin dashboard…</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
          <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>Admin Panel</h1>
              <p style={{ color: '#6b7280', marginTop: 6, fontSize: '0.95rem' }}>Manage system, monitoring performance and sales team.</p>
            </div>
            <button
              onClick={handleCreateAgent}
              style={{
                padding: '11px 22px',
                background: 'var(--primary)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9rem',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(46,189,142,0.25)',
              }}
            >
              + Add New Agent
            </button>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
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
              <Link key={s.label} href={s.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  background: '#fff',
                  borderRadius: 14,
                  padding: '16px 20px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s',
                  minHeight: 100
                }}>
                  <div style={{ minWidth: 0, flex: 1, marginRight: 8 }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                    <p style={{ fontSize: '1.4rem', fontWeight: 900, margin: '4px 0 0', color: '#111827', wordBreak: 'break-all' }}>{s.value}</p>
                  </div>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: s.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', flexShrink: 0,
                    lineHeight: 1
                  }}>
                    {s.icon}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* New Incoming Orders */}
              <div id="incoming-orders" style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.02)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fffbeb' }}>
                  <h2 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0, color: '#d97706', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.3rem' }}>🚨</span> New Incoming Orders
                  </h2>
                  <Link href="/admin/orders" style={{ fontSize: '0.8rem', color: '#d97706', textDecoration: 'none', fontWeight: 700 }}>See All Orders →</Link>
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '12px 24px' }}>
                  {recentOrders.filter(o => !['delivered'].includes((o.status || '').toLowerCase())).length > 0 ? (
                    recentOrders.filter(o => !['delivered'].includes((o.status || '').toLowerCase())).map((order) => {
                      const currentStatus = order.status || 'Confirmed'
                      return (
                        <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 0', borderBottom: '1px solid #f9fafb' }}>
                          <div style={{ maxWidth: '65%' }}>
                            <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#111827' }}>#{order.id.slice(0, 8).toUpperCase()} - {order.item_name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span><strong>Client:</strong> {order.clients?.company_name}</span>
                              <span><strong>Agent:</strong> {order.profiles?.name}</span>
                              <span><strong>Date:</strong> {format(new Date(order.created_at), 'MMM d, yyyy HH:mm')}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>RM{order.total_amount?.toFixed(2)}</div>
                            <select
                              value={currentStatus === 'active' ? 'Confirmed' : currentStatus}
                              onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 8,
                                border: '1.5px solid #d1d5db',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                outline: 'none',
                                background: currentStatus === 'Preparing' ? '#e0e7ff' : currentStatus === 'Picked up' ? '#fef3c7' : '#dcfce7',
                                color: '#111827',
                                cursor: 'pointer'
                              }}
                            >
                              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p style={{ color: '#9ca3af', textAlign: 'center', padding: '32px 0', fontSize: '0.9rem', fontWeight: 600 }}>No incoming orders at the moment.</p>
                  )}
                </div>
              </div>

              {/* System Tools Card */}
              <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 24, border: '1px solid rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 16 }}>System Management</h3>

                {/* Added Global Commission Control */}
                <div style={{ background: 'var(--primary-light)', padding: 16, borderRadius: 12, marginBottom: 20, border: '1px solid var(--primary-mid)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: 8 }}>DEFAULT COMMISSION RATE</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                      {agents.find(p => p.id === profile?.id)?.commission_rate || profile?.commission_rate || 5}%
                    </div>
                    <button
                      onClick={() => handleUpdateCommission(profile?.id || '', agents.find(p => p.id === profile?.id)?.commission_rate || profile?.commission_rate || 5)}
                      style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Edit Global Rate
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Link href="/settings" style={{
                    padding: '12px', border: '1.5px solid #f3f4f6', borderRadius: 10, textDecoration: 'none', textAlign: 'center',
                    color: '#4b5563', fontWeight: 600, fontSize: '0.85rem'
                  }}>Settings</Link>
                  <Link href="/admin/backup" style={{
                    padding: '12px', border: '1.5px solid #f3f4f6', borderRadius: 10, textDecoration: 'none', textAlign: 'center',
                    color: '#4b5563', fontWeight: 600, fontSize: '0.85rem'
                  }}>Backup</Link>
                  <button
                    onClick={() => toast.success('Database backup initiated!')}
                    style={{
                      gridColumn: 'span 2', padding: '12px', background: '#111827', color: '#fff', border: 'none', borderRadius: 10,
                      fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', marginTop: 6
                    }}
                  >
                    Create System Backup
                  </button>
                </div>
              </div>
            </div>

            {/* Agents List Card */}
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.02)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0, color: '#111827' }}>Agents Management</h2>
                <span style={{ fontSize: '0.75rem', background: '#f3f4f6', padding: '4px 10px', borderRadius: 20, fontWeight: 600, color: '#4b5563' }}>
                  {agents.filter(a => a.role === 'agent').length} Active
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: '#f9fafb' }}>
                    <tr>
                      {['Agent Details', 'Commission', 'Joined', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '14px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {agents.filter(a => a.role === 'agent').map((agent) => {
                      const isDeactivated = agent.name?.startsWith('(INACTIVE) ');
                      const displayName = isDeactivated ? agent.name.replace('(INACTIVE) ', '') : agent.name;
                      const isPending = agent.is_approved === false;
                      return (
                        <tr key={agent.id} style={{ borderBottom: '1px solid #f9fafb', fontSize: '0.9rem', opacity: isDeactivated ? 0.6 : 1, background: isDeactivated ? '#f9fafb' : 'transparent' }}>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
                              {displayName}
                              {isPending && <span title="Pending Approval" style={{ cursor: 'help' }}>⏳</span>}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>{agent.email}</div>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary-dark)', background: 'var(--primary-light)', padding: '4px 10px', borderRadius: 8 }}>
                              {agent.commission_rate}%
                            </span>
                          </td>
                          <td style={{ padding: '16px 24px', color: '#6b7280' }}>
                            {format(new Date(agent.created_at), 'MMM d, yyyy')}
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
                              {isPending ? (
                                <button
                                  onClick={() => handleApprove(agent.id)}
                                  style={{ padding: '5px 10px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                                >
                                  Approve
                                </button>
                              ) : (
                                <span style={{
                                  fontSize: '0.7rem',
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  fontWeight: 700,
                                  background: isDeactivated ? '#fee2e2' : '#f0fdf9',
                                  color: isDeactivated ? '#ef4444' : '#0d9488'
                                }}>
                                  {isDeactivated ? 'INACTIVE' : 'ACTIVE'}
                                </span>
                              )}
                              <button
                                onClick={() => handleUpdateCommission(agent.id, agent.commission_rate)}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                              >
                                Rate
                              </button>
                              <button
                                onClick={() => handleToggleStatus(agent)}
                                style={{ background: 'none', border: 'none', color: isDeactivated ? 'var(--primary-dark)' : '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                              >
                                {isDeactivated ? '✓' : '✖'}
                              </button>
                              <Link
                                href={`/admin/agent/${agent.id}`}
                                style={{ textDecoration: 'none', color: '#6b7280', fontWeight: 600, fontSize: '0.85rem' }}
                              >
                                Details
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {agents.filter(a => a.role === 'agent').length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No agents found in system.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
