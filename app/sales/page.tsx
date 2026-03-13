'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { format, startOfDay, endOfDay } from 'date-fns'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function MySalesPage() {
    const { profile, loading: authLoading } = useAuth()
    const [sales, setSales] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Filter States (Same as Admin)
    const [search, setSearch] = useState('')
    const [selectedClients, setSelectedClients] = useState<string[]>([])
    const [selectedMonths, setSelectedMonths] = useState<string[]>([])
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')

    useEffect(() => {
        if (profile?.id) {
            loadSales()
        } else if (profile === null) {
            setLoading(false)
        }
    }, [profile])

    const loadSales = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('orders')
                .select('*, clients!inner(company_name)')
                .eq('agent_id', profile.id)
                .order('purchase_date', { ascending: false })

            if (error) throw error
            setSales(data || [])
        } catch (err: any) {
            toast.error('Failed to load sales: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    // Filter Logic (Same as Admin)
    const uniqueClients = Array.from(new Set(sales.map(o => o.clients?.company_name).filter(Boolean))).sort()
    const monthsList = Array.from(new Set(sales.map(o => format(new Date(o.purchase_date), 'MMMM yyyy'))))
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    const filtered = sales.filter(o => {
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

    // Summary Counts (Same as Admin style)
    const totalSalesCounted = filtered.reduce((s, o) => s + (o.total_amount || 0), 0)
    const totalCommissionCounted = filtered.reduce((s, o) => s + (o.commission_amount || 0), 0)

    if (authLoading) return <div style={{ padding: 80, textAlign: 'center' }}>Loading…</div>

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            <div style={{ maxWidth: 1580, margin: '0 auto', padding: '40px 24px', display: 'flex', gap: 32 }}>
                <Sidebar totalCommission={totalCommissionCounted} />

                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Header - Copy Exactly from Admin */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>My Sales</h1>
                            <p style={{ color: '#6b7280', marginTop: 4, fontSize: '0.95rem' }}>Full record of your sales performance</p>
                        </div>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ background: '#fff', borderRadius: 12, padding: '16px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Total Sales</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111827' }}>RM {totalSalesCounted.toFixed(2)}</div>
                            </div>
                            <div style={{ background: '#fff', borderRadius: 12, padding: '16px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Total Commission</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary-dark)' }}>RM {totalCommissionCounted.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Filters - Copy Exactly from Admin */}
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
                                <select disabled style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', outline: 'none', fontSize: '0.9rem', background: '#f9fafb', color: '#9ca3af' }}>
                                    <option value="">{profile?.name || 'Self'}</option>
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

                        {/* Active Filters Tag Row - Copy Exactly from Admin */}
                        {(selectedClients.length > 0 || selectedMonths.length > 0 || dateFrom || dateTo) && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                                <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', marginRight: 4 }}>Active Filters:</span>
                                {selectedClients.map(c => (
                                    <div key={c} style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        🏢 {c} <button onClick={() => setSelectedClients(selectedClients.filter(x => x !== c))} style={{ background: 'none', border: 'none', color: '#0369a1', cursor: 'pointer', padding: 0, fontSize: '1rem', lineHeight: 1 }}>×</button>
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
                                <button onClick={() => { setSelectedClients([]); setSelectedMonths([]); setDateFrom(''); setDateTo(''); }} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', padding: '2px 6px' }}>Clear All</button>
                            </div>
                        )}
                    </div>

                    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #f3f4f6' }}>
                                    <th style={{ padding: '18px 24px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase' }}>Purchase Date</th>
                                    <th style={{ padding: '18px 24px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase' }}>Order ID</th>
                                    <th style={{ padding: '18px 24px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase' }}>Client</th>
                                    <th style={{ padding: '18px 24px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase' }}>Total Sales</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>Loading sales items…</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={4} style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>No sales found matching your filters.</td></tr>
                                ) : (
                                    filtered.map((s) => (
                                        <tr key={s.id} style={{ borderBottom: '1px solid #f9fafb', transition: 'background 0.1s' }}>
                                            <td style={{ padding: '16px 24px', fontWeight: 600, color: '#111827' }}>{format(new Date(s.purchase_date), 'MMM d, yyyy')}</td>
                                            <td style={{ padding: '16px 24px', color: '#6b7280', fontSize: '0.9rem', fontFamily: 'monospace' }}>#{s.id?.slice(0, 8).toUpperCase()}</td>
                                            <td style={{ padding: '16px 24px', fontWeight: 700, color: '#374151' }}>{s.clients?.company_name}</td>
                                            <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 900, fontSize: '1.1rem', color: 'var(--primary-dark)' }}>RM {s.total_amount?.toFixed(2)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {!loading && filtered.length > 0 && (
                                <tfoot style={{ borderTop: '2px solid #f3f4f6' }}>
                                    <tr style={{ background: 'var(--primary-light)' }}>
                                        <td colSpan={3} style={{ padding: '24px', textAlign: 'right', fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>Grand Total Sales:</td>
                                        <td style={{ padding: '24px', textAlign: 'right', fontWeight: 900, fontSize: '1.5rem', color: 'var(--primary-dark)' }}>RM {totalSalesCounted.toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
