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
import { updateOrderStatusAdmin } from '@/actions/orders'

const STATUS_OPTIONS = ['Confirmed', 'Preparing', 'Picked up', 'Delivered']

export default function AdminOrdersPage() {
    const { profile, loading: authLoading } = useAuth()
    const router = useRouter()
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedClients, setSelectedClients] = useState<string[]>([])
    const [selectedAgents, setSelectedAgents] = useState<string[]>([])
    const [selectedMonths, setSelectedMonths] = useState<string[]>([])
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')

    useEffect(() => {
        if (!authLoading && profile) {
            if (profile.role !== 'admin') {
                toast.error('Access denied.')
                router.push('/dashboard')
            } else {
                loadOrders()
            }
        }
    }, [profile, authLoading])

    const loadOrders = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('orders')
                .select('*, clients(company_name), profiles(name, email)')
                .order('created_at', { ascending: false })

            if (error) throw error
            setOrders(data || [])
        } catch (err: any) {
            toast.error('Failed to load orders')
        } finally {
            setLoading(false)
        }
    }

    const uniqueClients = Array.from(new Set(orders.map(o => o.clients?.company_name).filter(Boolean))).sort()
    const uniqueAgents = Array.from(new Set(orders.map(o => o.profiles?.name).filter(Boolean))).sort()
    const monthsList = Array.from(new Set(orders.map(o => format(new Date(o.created_at), 'MMMM yyyy'))))
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    const filtered = orders.filter(o => {
        const orderDate = new Date(o.created_at)
        const monthName = format(orderDate, 'MMMM yyyy')

        const matchesClient = selectedClients.length === 0 || selectedClients.includes(o.clients?.company_name)
        const matchesAgent = selectedAgents.length === 0 || selectedAgents.includes(o.profiles?.name)
        const matchesMonth = selectedMonths.length === 0 || selectedMonths.includes(monthName)

        let matchesDate = true
        if (dateFrom) {
            matchesDate = matchesDate && new Date(o.created_at) >= new Date(dateFrom)
        }
        if (dateTo) {
            const toDateEnd = new Date(dateTo)
            toDateEnd.setHours(23, 59, 59, 999)
            matchesDate = matchesDate && new Date(o.created_at) <= toDateEnd
        }

        const matchesSearch = !search || o.id?.toLowerCase().includes(search.toLowerCase())

        return matchesClient && matchesAgent && matchesMonth && matchesDate && matchesSearch
    })

    const totalSales = orders.reduce((s, o) => s + (o.total_amount || 0), 0)
    const totalCommission = orders.reduce((s, o) => s + (o.commission_amount || 0), 0)

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        try {
            const { error } = await updateOrderStatusAdmin(orderId, newStatus)
            if (error) throw new Error(error)
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
            toast.success(`Order status updated to ${newStatus}`)
        } catch (err: any) {
            toast.error('Failed to update order status: ' + err.message)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="max-w-[1580px] mx-auto px-4 sm:px-6 py-8 w-full flex flex-col md:flex-row gap-6 md:gap-8 flex-1">
                <AdminSidebar />
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>All Orders</h1>
                            <p style={{ color: '#6b7280', marginTop: 4, fontSize: '0.95rem' }}>All orders across every agent in the system</p>
                        </div>
                        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
                            <div style={{ background: '#fff', borderRadius: 12, padding: '16px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Total Sales</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111827' }}>RM {totalSales.toFixed(2)}</div>
                            </div>
                            <div style={{ background: '#fff', borderRadius: 12, padding: '16px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Total Commission</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary-dark)' }}>RM {totalCommission.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                            <div style={{ flex: '1 1 200px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Search Order ID</label>
                                <input type="text" placeholder="e.g. 5b5ce525" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', outline: 'none', fontSize: '0.9rem' }} />
                            </div>
                            <div style={{ flex: '1 1 200px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Filter by Client</label>
                                <select
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value && !selectedClients.includes(e.target.value)) setSelectedClients([...selectedClients, e.target.value]);
                                    }}
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', outline: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
                                >
                                    <option value="">+ Add Client...</option>
                                    {uniqueClients.filter(c => !selectedClients.includes(c as string)).map(c => (
                                        <option key={c as string} value={c as string}>{c as string}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ flex: '1 1 200px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Filter by Agent</label>
                                <select
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value && !selectedAgents.includes(e.target.value)) setSelectedAgents([...selectedAgents, e.target.value]);
                                    }}
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', outline: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
                                >
                                    <option value="">+ Add Agent...</option>
                                    {uniqueAgents.filter(a => !selectedAgents.includes(a as string)).map(a => (
                                        <option key={a as string} value={a as string}>{a as string}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ flex: '1 1 200px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Filter by Month</label>
                                <select
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value && !selectedMonths.includes(e.target.value)) setSelectedMonths([...selectedMonths, e.target.value]);
                                    }}
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', outline: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
                                >
                                    <option value="">+ Add Month...</option>
                                    {monthsList.filter(m => !selectedMonths.includes(m)).map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ flex: '1 1 150px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Date From</label>
                                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', outline: 'none', fontSize: '0.9rem' }} />
                            </div>
                            <div style={{ flex: '1 1 150px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Date To</label>
                                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', outline: 'none', fontSize: '0.9rem' }} />
                            </div>
                        </div>

                        {(selectedClients.length > 0 || selectedAgents.length > 0 || selectedMonths.length > 0 || dateFrom || dateTo) && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                                <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', marginRight: 4 }}>Active Filters:</span>
                                {selectedClients.map(c => (
                                    <div key={c} style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        🏢 {c} <button onClick={() => setSelectedClients(selectedClients.filter(x => x !== c))} style={{ background: 'none', border: 'none', color: '#0369a1', cursor: 'pointer', padding: 0, fontSize: '1rem', lineHeight: 1 }}>×</button>
                                    </div>
                                ))}
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
                                <button onClick={() => { setSelectedClients([]); setSelectedAgents([]); setSelectedMonths([]); setDateFrom(''); setDateTo(''); }} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', padding: '2px 6px' }}>Clear All</button>
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                        {loading ? (
                            <div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>Loading orders…</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f9fafb' }}>
                                    <tr>
                                        {['Order ID', 'Client', 'Agent', 'Items', 'Status', 'Total (RM)', 'Commission (RM)', 'Date'].map(h => (
                                            <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(order => {
                                        const currentStatus = order.status || 'Confirmed'
                                        return (
                                            <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                <td style={{ padding: '14px 20px', fontWeight: 700, color: '#111827', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                                                    #{order.id?.slice(0, 8).toUpperCase()}
                                                </td>
                                                <td style={{ padding: '14px 20px', fontWeight: 600, color: '#374151' }}>
                                                    {order.clients?.company_name ?? '—'}
                                                </td>
                                                <td style={{ padding: '14px 20px', color: '#6b7280', fontSize: '0.88rem' }}>
                                                    {order.profiles?.name ?? '—'}
                                                </td>
                                                <td style={{ padding: '14px 20px', color: '#6b7280' }}>
                                                    {(order.items || []).length} item{(order.items || []).length !== 1 ? 's' : ''}
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <select
                                                        value={currentStatus === 'active' ? 'Confirmed' : currentStatus}
                                                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            borderRadius: 6,
                                                            border: '1.5px solid #d1d5db',
                                                            fontSize: '0.78rem',
                                                            fontWeight: 700,
                                                            outline: 'none',
                                                            background: currentStatus === 'Preparing' ? '#e0e7ff' : currentStatus === 'Picked up' ? '#fef3c7' : currentStatus === 'Delivered' ? '#f3f4f6' : '#dcfce7',
                                                            color: '#111827',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </td>
                                                <td style={{ padding: '14px 20px', fontWeight: 800, color: '#111827' }}>
                                                    RM {order.total_amount?.toFixed(2) ?? '0.00'}
                                                </td>
                                                <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--primary-dark)' }}>
                                                    RM {order.commission_amount?.toFixed(2) ?? '0.00'}
                                                </td>
                                                <td style={{ padding: '14px 20px', color: '#9ca3af', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                    {format(new Date(order.created_at), 'MMM d, yyyy HH:mm')}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>No orders found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Footer count */}
                    {!loading && (
                        <div style={{ marginTop: 12, fontSize: '0.85rem', color: '#9ca3af' }}>
                            Showing {filtered.length} of {orders.length} orders
                        </div>
                    )}
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
