'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import AdminSidebar from '@/components/AdminSidebar'
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

    const totalSales = filtered.reduce((s, o) => s + (o.total_amount || 0), 0)
    const totalCommission = filtered.reduce((s, o) => s + (o.commission_amount || 0), 0)

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

    if (authLoading) return <div className="p-20 text-center">Loading…</div>

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="max-w-[1580px] mx-auto px-4 sm:px-6 py-8 w-full flex flex-col md:flex-row gap-6 md:gap-8 flex-1">
                <AdminSidebar />
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-6 md:mb-8 gap-5">
                        <div className="w-full xl:w-auto">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 m-0">Orders Analysis</h1>
                            <p className="text-gray-500 mt-2 text-sm md:text-base">All orders across every agent in the system</p>
                        </div>
                        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4">
                            <div className="flex-1 xl:w-[220px] bg-white rounded-xl p-5 md:p-6 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 break-words">Total Sales</div>
                                <div className="text-xl md:text-2xl font-black text-gray-900 truncate">RM {totalSales.toFixed(2)}</div>
                            </div>
                            <div className="flex-1 xl:w-[220px] bg-white rounded-xl p-5 md:p-6 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 break-words">Total Comm.</div>
                                <div className="text-xl md:text-2xl font-black text-primary-dark truncate">RM {totalCommission.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Filters Wrapper */}
                    <div className="bg-white rounded-2xl p-5 md:p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 mb-6 flex flex-col gap-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                            <div className="col-span-1 sm:col-span-2 lg:col-span-1 xl:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Search ID</label>
                                <input type="text" placeholder="e.g. 5b5ce525" value={search} onChange={e => setSearch(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-sm bg-white" />
                            </div>
                            <div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Client</label>
                                <select
                                    value=""
                                    onChange={(e) => { if (e.target.value && !selectedClients.includes(e.target.value)) setSelectedClients([...selectedClients, e.target.value]) }}
                                    className="w-full px-3.5 py-2.5 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-sm cursor-pointer bg-white"
                                >
                                    <option value="">+ Add...</option>
                                    {uniqueClients.filter(c => !selectedClients.includes(c as string)).map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                                </select>
                            </div>
                            <div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Agent</label>
                                <select
                                    value=""
                                    onChange={(e) => { if (e.target.value && !selectedAgents.includes(e.target.value)) setSelectedAgents([...selectedAgents, e.target.value]) }}
                                    className="w-full px-3.5 py-2.5 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-sm cursor-pointer bg-white"
                                >
                                    <option value="">+ Add...</option>
                                    {uniqueAgents.filter(a => !selectedAgents.includes(a as string)).map(a => <option key={a as string} value={a as string}>{a as string}</option>)}
                                </select>
                            </div>
                            <div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Month</label>
                                <select
                                    value=""
                                    onChange={(e) => { if (e.target.value && !selectedMonths.includes(e.target.value)) setSelectedMonths([...selectedMonths, e.target.value]) }}
                                    className="w-full px-3.5 py-2.5 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-sm cursor-pointer bg-white"
                                >
                                    <option value="">+ Add...</option>
                                    {monthsList.filter(m => !selectedMonths.includes(m)).map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">From Date</label>
                                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-sm bg-white" />
                            </div>
                            <div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">To Date</label>
                                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-sm bg-white" />
                            </div>
                        </div>

                        {/* Active Filters tags */}
                        {(selectedClients.length > 0 || selectedAgents.length > 0 || selectedMonths.length > 0 || dateFrom || dateTo) && (
                            <div className="flex flex-wrap gap-2 pt-4 border-t-2 border-gray-50 items-center">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-1">Active:</span>
                                {selectedClients.map(c => (
                                    <div key={c} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-blue-100">
                                        🏢 {c} <button onClick={() => setSelectedClients(selectedClients.filter(x => x !== c))} className="hover:text-blue-900 border-none bg-transparent cursor-pointer p-0 leading-none text-sm transition-colors">×</button>
                                    </div>
                                ))}
                                {selectedAgents.map(a => (
                                    <div key={a} className="bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-green-100">
                                        👨‍💼 {a} <button onClick={() => setSelectedAgents(selectedAgents.filter(x => x !== a))} className="hover:text-green-900 border-none bg-transparent cursor-pointer p-0 leading-none text-sm transition-colors">×</button>
                                    </div>
                                ))}
                                {selectedMonths.map(m => (
                                    <div key={m} className="bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-yellow-100">
                                        📅 {m} <button onClick={() => setSelectedMonths(selectedMonths.filter(x => x !== m))} className="hover:text-yellow-900 border-none bg-transparent cursor-pointer p-0 leading-none text-sm transition-colors">×</button>
                                    </div>
                                ))}
                                {dateFrom && (
                                    <div className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-purple-100">
                                        📆 From: {dateFrom} <button onClick={() => setDateFrom('')} className="hover:text-purple-900 border-none bg-transparent cursor-pointer p-0 leading-none text-sm transition-colors">×</button>
                                    </div>
                                )}
                                {dateTo && (
                                    <div className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-purple-100">
                                        📆 To: {dateTo} <button onClick={() => setDateTo('')} className="hover:text-purple-900 border-none bg-transparent cursor-pointer p-0 leading-none text-sm transition-colors">×</button>
                                    </div>
                                )}
                                <button onClick={() => { setSelectedClients([]); setSelectedAgents([]); setSelectedMonths([]); setDateFrom(''); setDateTo(''); }} className="text-gray-400 hover:text-gray-800 bg-transparent border-none text-xs font-bold underline cursor-pointer px-2 transition-colors">Clear All</button>
                            </div>
                        )}
                    </div>

                    {/* Order Analysis Cards (Mobile + Desktop Responsive) */}
                    <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden text-sm">
                        {loading ? (
                            <div className="p-16 text-center text-gray-500 font-medium">Loading orders…</div>
                        ) : filtered.length === 0 ? (
                            <div className="p-16 text-center text-gray-500 font-medium bg-gray-50 rounded-2xl mx-4 my-4 border-2 border-dashed border-gray-200">
                                No records found matching your current filters.
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {/* Desktop Header (Hidden on Mobile) */}
                                <div className="hidden lg:grid grid-cols-8 bg-gray-50 border-b-2 border-gray-100 p-4 font-bold text-gray-500 uppercase tracking-widest text-xs">
                                     <div className="col-span-1">Order ID</div>
                                     <div className="col-span-1">Client</div>
                                     <div className="col-span-1">Agent</div>
                                     <div className="col-span-1">Items</div>
                                     <div className="col-span-1">Status</div>
                                     <div className="col-span-1 text-right">Total (RM)</div>
                                     <div className="col-span-1 text-right">Comm (RM)</div>
                                     <div className="col-span-1 text-right">Date</div>
                                </div>
                                
                                {/* Rows (Stacked on Mobile, Grid on Desktop) */}
                                {filtered.map((order) => {
                                    const currentStatus = order.status || 'Confirmed'
                                    return (
                                        <div key={order.id} className="flex flex-col lg:grid lg:grid-cols-8 border-b border-gray-100 p-4 md:p-5 gap-y-3 lg:gap-y-0 lg:items-center text-gray-800 hover:bg-gray-50 transition-colors">
                                            
                                            {/* Order ID */}
                                            <div className="flex justify-between items-center lg:block col-span-1">
                                                <span className="lg:hidden text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID</span>
                                                <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded lg:bg-transparent lg:p-0">#{order.id?.slice(0, 8).toUpperCase()}</span>
                                            </div>

                                            {/* Client */}
                                            <div className="flex justify-between items-center lg:block col-span-1">
                                                <span className="lg:hidden text-xs font-bold text-gray-400 uppercase tracking-widest">Client</span>
                                                <span className="font-bold text-gray-700">{order.clients?.company_name ?? '—'}</span>
                                            </div>

                                            {/* Agent */}
                                            <div className="flex justify-between items-center lg:block col-span-1">
                                                <span className="lg:hidden text-xs font-bold text-gray-400 uppercase tracking-widest">Agent</span>
                                                <span className="font-medium text-gray-600">{order.profiles?.name ?? '—'}</span>
                                            </div>

                                            {/* Items */}
                                            <div className="flex justify-between items-center lg:block col-span-1">
                                                <span className="lg:hidden text-xs font-bold text-gray-400 uppercase tracking-widest">Items</span>
                                                <span className="text-gray-500">{(order.items || []).length} item{(order.items || []).length !== 1 ? 's' : ''}</span>
                                            </div>

                                            {/* Status */}
                                            <div className="flex justify-between items-center lg:block col-span-1">
                                                <span className="lg:hidden text-xs font-bold text-gray-400 uppercase tracking-widest">Status</span>
                                                <select
                                                    value={currentStatus === 'active' ? 'Confirmed' : currentStatus}
                                                    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold outline-none cursor-pointer w-auto lg:w-full max-w-[140px]"
                                                    style={{
                                                        background: currentStatus === 'Preparing' ? '#e0e7ff' : currentStatus === 'Picked up' ? '#fef3c7' : currentStatus === 'Delivered' ? '#f3f4f6' : '#dcfce7',
                                                        color: '#111827'
                                                    }}
                                                >
                                                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>

                                            {/* Total */}
                                            <div className="flex justify-between items-center lg:block lg:text-right col-span-1 pt-2 border-t border-dashed border-gray-200 lg:border-none lg:pt-0">
                                                <span className="lg:hidden text-xs font-bold text-gray-400 uppercase tracking-widest">Total (RM)</span>
                                                <span className="font-black text-gray-900 text-base lg:text-sm">RM {order.total_amount?.toFixed(2) ?? '0.00'}</span>
                                            </div>

                                            {/* Comm */}
                                            <div className="flex justify-between items-center lg:block lg:text-right col-span-1 pt-1 lg:pt-0">
                                                <span className="lg:hidden text-xs font-bold text-gray-400 uppercase tracking-widest">Comm (RM)</span>
                                                <span className="font-black text-primary-dark">RM {order.commission_amount?.toFixed(2) ?? '0.00'}</span>
                                            </div>

                                            {/* Date */}
                                            <div className="flex justify-between items-center lg:block lg:text-right col-span-1 pt-1 lg:pt-0">
                                                <span className="lg:hidden text-xs font-bold text-gray-400 uppercase tracking-widest">Date</span>
                                                <span className="text-gray-400 text-xs whitespace-nowrap">{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
                                            </div>

                                        </div>
                                    )
                                })}

                            </div>
                        )}
                    </div>

                    {!loading && (
                        <div className="mt-4 text-xs md:text-sm text-gray-500 font-semibold px-2">
                            Showing {filtered.length} of {orders.length} orders
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
