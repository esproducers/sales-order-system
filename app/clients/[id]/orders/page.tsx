'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useParams } from 'next/navigation'

const STATUS_STEPS = ['Confirmed', 'Preparing', 'Picked up', 'Delivered']

export default function ClientOrdersPage() {
  const { user, profile } = useAuth()
  const params = useParams()
  const clientId = params.id as string
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'upcoming' | 'previous' | 'all'>('upcoming')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    if (profile && clientId) {
      loadOrders()
    } else if (!profile) {
      setLoading(false)
    }
  }, [profile, tab, clientId])

  const loadOrders = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('orders')
        .select('*, clients(company_name)')
        .eq('agent_id', profile.id)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      const { data, error } = await query
      if (error) throw error
      setOrders(data || [])
    } catch (error: any) {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (orderId: string) => {
    if (!confirm('Delete this order? This cannot be undone.')) return
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .eq('agent_id', profile.id)
      if (error) throw error
      toast.success('Order deleted')
      loadOrders()
    } catch (error: any) {
      toast.error('Failed to delete order')
    }
  }

  const canEdit = (order: any) => new Date(order.can_edit_until) > new Date()

  const totalCommission = orders.reduce((sum, o) => sum + (o.commission_amount || 0), 0)

  const navItems = [
    { label: 'My Profile', icon: '👤', href: '/dashboard' },
    { label: 'My List', icon: '📋', href: '/clients' },
    { label: 'My Orders', icon: '✅', href: '/orders', active: true },
    { label: 'Payments', icon: '💳', href: '#', badge: `RM ${totalCommission.toFixed(0)}` },
    { label: 'Address Book', icon: '📍', href: '#' },
    { label: 'Referrals', icon: '🔗', href: '#' },
    { label: 'Account Settings', icon: '⚙️', href: '#' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div
        style={{
          maxWidth: 1580,
          margin: '0 auto',
          padding: '40px 24px',
          display: 'flex',
          gap: 32,
          alignItems: 'flex-start',
        }}
      >
        {/* ── Left sidebar ── */}
        <aside style={{ width: 240, flexShrink: 0 }}>
          {/* Profile card */}
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: '20px 16px',
              marginBottom: 12,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.2rem',
                }}
              >
                {(profile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{profile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}</div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{profile?.role}</div>
              </div>
            </div>
          </div>

          {/* Nav menu */}
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '13px 16px',
                  textDecoration: 'none',
                  background: item.active ? 'var(--primary)' : '#fff',
                  color: item.active ? '#fff' : '#374151',
                  borderBottom: '1px solid #f3f4f6',
                  fontSize: '0.875rem',
                  fontWeight: item.active ? 600 : 400,
                  transition: 'background 0.15s',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {item.badge && (
                    <span
                      style={{
                        background: item.active ? 'rgba(255,255,255,0.25)' : 'var(--primary-light)',
                        color: item.active ? '#fff' : 'var(--primary-dark)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 20,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                  <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>›</span>
                </span>
              </Link>
            ))}
          </div>
        </aside>

        {/* ── Right content ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>Client Orders</h1>
              <p style={{ color: '#6b7280', marginTop: 6, fontSize: '1rem' }}>
                View specific orders for this client
              </p>
            </div>
            <Link
              href="/clients"
              style={{
                padding: '12px 28px',
                background: '#f3f4f6',
                color: '#374151',
                borderRadius: 10,
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '1rem',
              }}
            >
              ← Back to Clients
            </Link>
          </div>

          {/* Tab bar */}
          <div
            style={{
              display: 'flex',
              borderBottom: '2px solid #e5e5e5',
              marginBottom: 20,
              gap: 0,
            }}
          >
            {(
              [
                { key: 'upcoming', label: `Upcoming Orders (${orders.filter((o) => canEdit(o)).length})` },
                { key: 'previous', label: `Previous Orders (${orders.filter((o) => !canEdit(o)).length})` },
                { key: 'all', label: `All Orders (${orders.length})` },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: 'none',
                  fontWeight: tab === key ? 600 : 400,
                  fontSize: '0.875rem',
                  color: tab === key ? 'var(--primary)' : '#6b7280',
                  borderBottom: tab === key ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                  marginBottom: -2,
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Order cards */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: '3px solid var(--primary-mid)',
                  borderTop: '3px solid var(--primary)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 12px',
                }}
              />
              Loading orders…
            </div>
          ) : orders.length === 0 ? (
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: 48,
                textAlign: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📦</div>
              <h3 style={{ fontWeight: 600, marginBottom: 8 }}>No orders yet</h3>
              <p style={{ color: '#6b7280', marginBottom: 16 }}>Start by creating your first order</p>
              <Link
                href="/orders/new"
                style={{
                  padding: '10px 24px',
                  background: 'var(--primary)',
                  color: '#fff',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Create Your First Order
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {orders.map((order, idx) => {
                let stepIndex = 0
                const s = (order.status || '').toLowerCase()
                if (s === 'preparing') stepIndex = 1
                if (s === 'picked up') stepIndex = 2
                if (s === 'delivered') stepIndex = 3

                return (
                  <div
                    key={order.id}
                    style={{
                      background: '#fff',
                      borderRadius: 12,
                      padding: '20px 24px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      border: '1px solid #f0f0f0',
                    }}
                  >
                    {/* Row 1: Order info + actions */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 16,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: 'var(--primary-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.3rem',
                          }}
                        >
                          📦
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                            Order no #{order.id?.slice(0, 6).toUpperCase() ?? '------'}
                          </div>
                          <div style={{ color: '#374151', fontWeight: 600, fontSize: '0.95rem' }}>
                            RM {order.total_amount?.toFixed(2) ?? '0.00'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowDetailModal(true)
                          }}
                          style={{
                            padding: '8px 20px',
                            background: 'var(--primary)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(46,189,142,0.2)'
                          }}
                        >
                          Order Details
                        </button>
                        {/* Status-based cancellation logic: 0:Confirmed, 1:Preparing, 2:Picked up, 3:Delivered */}
                        {stepIndex < 2 && (
                          <button
                            onClick={() => handleDelete(order.id)}
                            style={{
                              padding: '8px 14px',
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              textDecoration: 'none'
                            }}
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          position: 'relative',
                        }}
                      >
                        {/* Background line */}
                        <div style={{ position: 'absolute', top: 8, left: '12.5%', width: '75%', height: 2, background: '#e5e7eb', zIndex: 0 }} />

                        {/* Active Progress line */}
                        <div style={{ position: 'absolute', top: 8, left: '12.5%', width: `${(stepIndex / (STATUS_STEPS.length - 1)) * 75}%`, height: 2, background: 'var(--primary)', zIndex: 0, transition: 'width 0.3s' }} />

                        {STATUS_STEPS.map((step, i) => {
                          const done = i <= stepIndex
                          const active = i === stepIndex
                          return (
                            <div
                              key={step}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                flex: 1,
                                position: 'relative',
                                zIndex: 1,
                              }}
                            >
                              {/* Dot */}
                              <div
                                style={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: '50%',
                                  background: done ? 'var(--primary)' : '#e5e7eb',
                                  border: active ? '3px solid var(--primary-dark)' : done ? '2px solid var(--primary-dark)' : '2px solid #d1d5db',
                                  boxShadow: active ? '0 0 0 3px var(--primary-mid)' : 'none',
                                }}
                              />
                              {/* Label */}
                              <span
                                style={{
                                  marginTop: 6,
                                  fontSize: '0.7rem',
                                  fontWeight: active ? 700 : 400,
                                  color: done ? 'var(--primary-dark)' : '#9ca3af',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {step}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Meta row */}
                    <div style={{ fontSize: '0.78rem', color: '#6b7280', display: 'flex', gap: 8 }}>
                      <span>
                        {order.quantity ?? 1} Item{(order.quantity ?? 1) !== 1 ? 's' : ''}
                      </span>
                      <span>•</span>
                      <span>{order.clients?.company_name ?? 'Client'}</span>
                      <span>•</span>
                      <span>
                        Ordered {format(new Date(order.created_at), 'MMM d, yyyy')}
                      </span>
                      {order.commission_amount > 0 && (
                        <>
                          <span>•</span>
                          <span style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>
                            +RM {order.commission_amount?.toFixed(2)} commission
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Order Detail Modal ── */}
      {showDetailModal && selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: '#fff',
            width: '100%',
            maxWidth: 680,
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            <div style={{ padding: '24px 32px', background: 'var(--primary-dark)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Order Details</h2>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>#{selectedOrder.id?.slice(0, 8).toUpperCase()}</div>
              </div>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ padding: 32, overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Client</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>{selectedOrder.clients?.company_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Order Date</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>{format(new Date(selectedOrder.created_at), 'MMMM d, yyyy')}</div>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Items Ordered</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(selectedOrder.items || []).map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', background: '#f9fafb', borderRadius: 12, border: '1px solid #f0f0f0' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>{item.item_name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 2 }}>{item.quantity} CTN × RM {item.price.toFixed(2)}</div>
                      </div>
                      <div style={{ fontWeight: 900, color: 'var(--primary-dark)', fontSize: '1.1rem' }}>RM {(item.quantity * item.price).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '2px dashed #f3f4f6', paddingTop: 20, marginTop: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 600 }}>Total Commission</span>
                  <span style={{ fontSize: '1.1rem', color: 'var(--primary-dark)', fontWeight: 800 }}>RM {selectedOrder.commission_amount?.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.2rem', color: '#111827', fontWeight: 900 }}>Total Paid</span>
                  <span style={{ fontSize: '1.5rem', color: 'var(--primary-dark)', fontWeight: 900 }}>RM {selectedOrder.total_amount?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px 32px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDetailModal(false)} style={{ padding: '12px 32px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        a:hover { opacity: 0.85; }
      `}</style>
    </div>
  )
}