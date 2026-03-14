'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { format, startOfDay, endOfDay } from 'date-fns'
import toast from 'react-hot-toast'

export default function MyCommissionPage() {
    const { profile, loading: authLoading } = useAuth()
    const [commissions, setCommissions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [search, setSearch] = useState('')
    const [selectedClients, setSelectedClients] = useState<string[]>([])
    const [selectedMonths, setSelectedMonths] = useState<string[]>([])
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')

    useEffect(() => {
        if (profile?.id) {
            loadCommissions()
        } else if (profile === null) {
            setLoading(false)
        }
    }, [profile])

    const loadCommissions = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('orders')
                .select('*, clients!inner(company_name)')
                .eq('agent_id', profile.id)
                .order('purchase_date', { ascending: false })

            if (error) throw error
            setCommissions(data || [])
        } catch (err: any) {
            toast.error('Failed to load commissions: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const uniqueClients = Array.from(new Set(commissions.map(o => o.clients?.company_name).filter(Boolean))).sort()
    const monthsList = Array.from(new Set(commissions.map(o => format(new Date(o.purchase_date), 'MMMM yyyy'))))
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    const filtered = commissions.filter(o => {
        const pDate = new Date(o.purchase_date)
        const monthName = format(pDate, 'MMMM yyyy')

        const matchesClient = selectedClients.length === 0 || selectedClients.includes(o.clients?.company_name)
        const matchesMonth = selectedMonths.length === 0 || selectedMonths.includes(monthName)

        let matchesDate = true
        if (dateFrom) matchesDate = matchesDate && pDate >= startOfDay(new Date(dateFrom))
        if (dateTo) matchesDate = matchesDate && pDate <= endOfDay(new Date(dateTo))

        const matchesSearch = !search || o.id?.toLowerCase().includes(search.toLowerCase())

        return matchesClient && matchesMonth && matchesDate && matchesSearch
    })

    const totalSalesCounted = filtered.reduce((s, o) => s + (o.total_amount || 0), 0)
    const totalCommissionCounted = filtered.reduce((s, o) => s + (o.commission_amount || 0), 0)

    if (authLoading) return <div className="p-20 text-center">Loading…</div>

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="max-w-[1580px] mx-auto px-4 sm:px-6 py-8 w-full flex flex-col md:flex-row gap-6 md:gap-8 flex-1">
                <Sidebar totalCommission={totalCommissionCounted} />

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-6 md:mb-8 gap-5">
                        <div className="w-full xl:w-auto">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 m-0">My Commission</h1>
                            <p className="text-gray-500 mt-2 text-sm md:text-base">Track your earnings per successful sale</p>
                        </div>
                        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4">
                            <div className="flex-1 xl:w-[220px] bg-white rounded-xl p-5 md:p-6 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 break-words">Total Sales</div>
                                <div className="text-xl md:text-2xl font-black text-gray-900 truncate">RM {totalSalesCounted.toFixed(2)}</div>
                            </div>
                            <div className="flex-1 xl:w-[220px] bg-white rounded-xl p-5 md:p-6 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 break-words">Total Comm.</div>
                                <div className="text-xl md:text-2xl font-black text-yellow-600 truncate">RM {totalCommissionCounted.toFixed(2)}</div>
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
                                <select disabled className="w-full px-3.5 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-50 text-gray-400 outline-none text-sm cursor-not-allowed">
                                    <option value="">{profile?.name || 'Self'}</option>
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
                        {(selectedClients.length > 0 || selectedMonths.length > 0 || dateFrom || dateTo) && (
                            <div className="flex flex-wrap gap-2 pt-4 border-t-2 border-gray-50 items-center">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-1">Active:</span>
                                {selectedClients.map(c => (
                                    <div key={c} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-blue-100">
                                        🏢 {c} <button onClick={() => setSelectedClients(selectedClients.filter(x => x !== c))} className="hover:text-blue-900 border-none bg-transparent cursor-pointer p-0 leading-none text-sm transition-colors">×</button>
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
                                <button onClick={() => { setSelectedClients([]); setSelectedMonths([]); setDateFrom(''); setDateTo(''); }} className="text-gray-400 hover:text-gray-800 bg-transparent border-none text-xs font-bold underline cursor-pointer px-2 transition-colors">Clear All</button>
                            </div>
                        )}
                    </div>

                    {/* Sales Cards (Mobile + Desktop Responsive) */}
                    <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden text-sm">
                        {loading ? (
                            <div className="p-16 text-center text-gray-500 font-medium">Loading commission history…</div>
                        ) : filtered.length === 0 ? (
                            <div className="p-16 text-center text-gray-500 font-medium bg-gray-50 rounded-2xl mx-4 my-4 border-2 border-dashed border-gray-200">
                                No records found matching your current filters.
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {/* Desktop Header (Hidden on Mobile) */}
                                <div className="hidden md:grid grid-cols-4 bg-gray-50 border-b-2 border-gray-100 p-4">
                                     <div className="font-bold text-gray-500 uppercase tracking-widest text-xs">Purchase Date</div>
                                     <div className="font-bold text-gray-500 uppercase tracking-widest text-xs">Client</div>
                                     <div className="font-bold text-gray-500 uppercase tracking-widest text-xs text-right">Sales (RM)</div>
                                     <div className="font-bold text-gray-500 uppercase tracking-widest text-xs text-right">Comm. Earned</div>
                                </div>
                                
                                {/* Rows (Stacked on Mobile, Grid on Desktop) */}
                                {filtered.map((c) => (
                                    <div key={c.id} className="flex flex-col md:grid md:grid-cols-4 border-b border-gray-100 p-4 md:p-5 gap-y-2 md:gap-y-0 text-gray-800 hover:bg-gray-50 transition-colors">
                                        
                                        {/* Mobile: Row 1, Desktop: Col 1 */}
                                        <div className="flex justify-between items-center md:block">
                                            <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-widest">Date</span>
                                            <span className="font-bold text-gray-900 md:font-semibold">{format(new Date(c.purchase_date), 'MMM d, yyyy')}</span>
                                        </div>

                                        {/* Mobile: Row 2, Desktop: Col 2 */}
                                        <div className="flex justify-between items-center md:block">
                                            <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-widest">Client</span>
                                            <span className="font-extrabold md:font-bold text-gray-700">{c.clients?.company_name}</span>
                                        </div>

                                        {/* Mobile: Row 3, Desktop: Col 3 */}
                                        <div className="flex justify-between items-center md:block pt-2 mt-2 border-t border-dashed border-gray-200 md:border-none md:p-0 md:m-0 md:text-right">
                                            <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-widest">Sales (RM)</span>
                                            <span className="font-bold text-gray-600 text-base md:text-sm">RM {c.total_amount?.toFixed(2)}</span>
                                        </div>

                                        {/* Mobile: Row 4, Desktop: Col 4 */}
                                        <div className="flex justify-between items-center md:block md:text-right pt-1 md:pt-0">
                                            <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-widest">Comm. Earned</span>
                                            <span className="font-black text-yellow-600 text-lg md:text-base">RM {c.commission_amount?.toFixed(2)}</span>
                                        </div>

                                    </div>
                                ))}

                                {/* Grand Total Footer */}
                                <div className="flex flex-col md:flex-row justify-between md:justify-end items-center px-5 py-6 bg-yellow-50 border-t-2 border-yellow-100 gap-3 md:gap-6">
                                     <div className="font-extrabold text-gray-800 text-sm md:text-base">
                                        GRAND TOTAL COMM:
                                     </div>
                                     <div className="font-black text-2xl md:text-3xl text-yellow-700">
                                        RM {totalCommissionCounted.toFixed(2)}
                                     </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
