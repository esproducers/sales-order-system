'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalClients: 0,
    currentMonthCommission: 0,
    commissionBreakdown: [] as any[],
    recentOrders: [] as any[],
  })
  const [loading, setLoading] = useState(true)
  const [showCommissionModal, setShowCommissionModal] = useState(false)

  useEffect(() => {
    if (profile?.id) {
      loadDashboardData()
    } else if (profile === null) {
      setLoading(false)
    }
  }, [profile])

  const loadDashboardData = async () => {
    if (!profile?.id) return
    try {
      setLoading(true)

      // Get recent orders (top 5)
      const { data: recentOrders, error: recentError } = await supabase
        .from('orders')
        .select('*, clients(company_name)')
        .eq('agent_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentError) throw recentError

      // Calculate Current Month Commission (1st to last day)
      const now = new Date()
      const firstDay = startOfMonth(now).toISOString()
      const lastDay = endOfMonth(now).toISOString()

      const { data: monthOrders, error: monthError } = await supabase
        .from('orders')
        .select('*')
        .eq('agent_id', profile.id)
        .gte('purchase_date', firstDay)
        .lte('purchase_date', lastDay)

      if (monthError) throw monthError

      // Get count of total clients
      const { count: clientsCount, error: clientsError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', profile.id)

      if (clientsError) throw clientsError

      // Get count of total orders
      const { count: totalOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', profile.id)

      const currentMonthCommission = monthOrders?.reduce((sum, o) => sum + (o.commission_amount || 0), 0) || 0

      setStats({
        totalOrders: totalOrdersCount || 0,
        totalClients: clientsCount || 0,
        currentMonthCommission,
        commissionBreakdown: monthOrders || [],
        recentOrders: recentOrders || [],
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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
            <p style={{ color: '#6b7280' }}>Loading dashboard…</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div className="max-w-[1580px] mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row gap-6 md:gap-8">
        <Sidebar totalCommission={stats.currentMonthCommission} />

        <div className="flex-1 min-w-0">
          <div className="mb-6 md:mb-8 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 m-0 leading-tight">
              Welcome back, {profile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Agent'}! 👋
            </h1>
            <p className="text-gray-500 mt-2 text-[0.9rem]">
              Here's what's happening with your sales today.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {[
              { label: 'Total Orders', value: stats.totalOrders, icon: '📦', color: 'var(--primary-light)' },
              { label: 'Total Clients', value: stats.totalClients, icon: '👥', color: '#dcfce7' },
              {
                label: `Commission (${format(new Date(), 'MMM')})`,
                value: `RM ${stats.currentMonthCommission.toFixed(2)}`,
                icon: '💰',
                color: '#fef9c3',
                onClick: () => setShowCommissionModal(true)
              },
            ].map((s) => (
              <div key={s.label}
                onClick={s.onClick}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: '20px 24px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: s.onClick ? 'pointer' : 'default',
                  transition: 'transform 0.1s',
                }}
                onMouseOver={(e) => s.onClick && (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseOut={(e) => s.onClick && (e.currentTarget.style.transform = 'scale(1)')}
              >
                <div>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>{s.label}</p>
                  <p style={{ fontSize: '1.8rem', fontWeight: 800, margin: '4px 0 0', color: '#111827' }}>{s.value}</p>
                </div>
                <div style={{
                  width: 48, height: 48, borderRadius: 10,
                  background: s.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem', flexShrink: 0,
                  lineHeight: 1
                }}>
                  {s.icon}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-6">
              <h2 className="font-bold text-base mb-5 mt-0 text-gray-900">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'New Order', sub: 'Create a sales order', icon: '➕', href: '/orders/new', color: 'var(--primary-light)' },
                  { label: 'Product Gallery', sub: 'View current products', icon: '🍦', href: '/products', color: '#fff1f2' },
                  { label: 'Add Client', sub: 'Add a new client', icon: '👤', href: '/clients', color: '#f0f9ff' },
                  { label: 'View Orders', sub: 'See all your orders', icon: '📋', href: '/orders', color: '#f5f3ff' },
                  { label: 'Client List', sub: 'Manage your clients', icon: '🏢', href: '/clients', color: '#f0fdf4' },
                ].map((item) => (
                  <Link key={item.label} href={item.href} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                    borderRadius: 14, border: '1px solid #f0f0f0', textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, background: item.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
                    }}>{item.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>{item.label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{item.sub}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col h-full">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <h2 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>Recent Orders</h2>
                <Link href="/orders" style={{ fontSize: '0.75rem', color: 'var(--primary-dark)', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
              </div>
              <div style={{ padding: '12px 20px' }}>
                {stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map((order) => (
                    <div key={order.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 0', borderBottom: '1px solid #f9fafb',
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>{order.item_name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>
                          {order.clients?.company_name} · {format(new Date(order.purchase_date), 'MMM d')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>RM {order.total_amount?.toFixed(2)}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--primary-dark)', fontWeight: 600 }}>+RM {order.commission_amount?.toFixed(2)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#9ca3af', textAlign: 'center', padding: '24px 0', fontSize: '0.875rem' }}>No recent orders</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Detail Modal */}
      {showCommissionModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#fff', width: '100%', maxWidth: 500, borderRadius: 24,
            overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column', maxHeight: '80vh'
          }}>
            <div style={{ padding: '24px 28px', background: 'var(--primary-dark)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Commission - {format(new Date(), 'MMMM yyyy')}</h2>
              <button onClick={() => setShowCommissionModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: 28, overflowY: 'auto' }}>
              <div style={{ background: 'var(--primary-light)', padding: 20, borderRadius: 16, marginBottom: 28, textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--primary-dark)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>This Month's Earnings</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary-dark)' }}>RM {stats.currentMonthCommission.toFixed(2)}</div>
              </div>

              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📋</span> Order Breakdown
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stats.commissionBreakdown.length > 0 ? stats.commissionBreakdown.map((o: any) => (
                  <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', background: '#fcfdfd', borderRadius: 14, border: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: '0.88rem' }}>
                      <div style={{ fontWeight: 800, color: '#111827' }}>{o.item_name}</div>
                      <div style={{ color: '#6b7280', fontSize: '0.78rem', marginTop: 2 }}>{format(new Date(o.purchase_date), 'MMM d, yyyy')}</div>
                    </div>
                    <div style={{ fontWeight: 900, color: 'var(--primary-dark)', fontSize: '1.05rem' }}>+RM {o.commission_amount.toFixed(2)}</div>
                  </div>
                )) : (
                  <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem', padding: '20px 0' }}>No commission records this month.</p>
                )}
              </div>
            </div>
            <div style={{ padding: '20px 28px', borderTop: '1px solid #f3f4f6', textAlign: 'center', background: '#f9fafb' }}>
              <button
                onClick={() => setShowCommissionModal(false)}
                style={{ width: '100%', padding: '14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(46,189,142,0.2)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
