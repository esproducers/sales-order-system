'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { updateClientStatusAdmin, getClientsAdmin } from '@/actions/clients'

export default function ClientsPage() {
  const { profile } = useAuth()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    if (profile?.id) {
      loadClients()
    } else if (profile === null) {
      setLoading(false)
    }
  }, [profile])

  const loadClients = async () => {
    if (!profile?.id) return
    try {
      setLoading(true)
      const { data, error } = await getClientsAdmin(profile.id)
      if (error) throw new Error(error)
      setClients(data || [])
    } catch (err: any) {
      toast.error('Failed to load clients: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (client: any, currentActive: boolean) => {
    const action = currentActive ? 'Deactivate' : 'Reactivate'
    if (!confirm(`${action} this client?`)) return
    try {
      setLoading(true)
      const { error } = await updateClientStatusAdmin(client.id, !currentActive)
      if (error) throw new Error(typeof error === 'string' ? error : error.message)
      toast.success(`Client ${currentActive ? 'deactivated' : 'reactivated'}`)
      loadClients()
    } catch (err: any) {
      toast.error('Failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const monthsList = Array.from(new Set(clients.map(c => format(c.created_at ? new Date(c.created_at) : new Date(), 'MMMM yyyy'))))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  const filtered = clients.filter(c => {
    const joinDate = c.created_at ? new Date(c.created_at) : new Date()
    const monthName = format(joinDate, 'MMMM yyyy')
    const matchesMonth = selectedMonths.length === 0 || selectedMonths.includes(monthName)

    let matchesDate = true
    if (dateFrom) matchesDate = matchesDate && joinDate >= new Date(dateFrom)
    if (dateTo) {
      const toDateEnd = new Date(dateTo)
      toDateEnd.setHours(23, 59, 59, 999)
      matchesDate = matchesDate && joinDate <= toDateEnd
    }

    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm ||
      c.company_name?.toLowerCase().includes(searchLower) ||
      c.ssm_id?.toLowerCase().includes(searchLower) ||
      c.contact_phone?.toLowerCase().includes(searchLower)

    return matchesMonth && matchesDate && matchesSearch
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth: 1580, margin: '0 auto', padding: '40px 24px', display: 'flex', gap: 32 }}>
        <Sidebar />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>My Client</h1>
              <p style={{ color: '#6b7280', marginTop: 6, fontSize: '1.1rem' }}>Manage your client database</p>
            </div>
            <Link href="/clients/new" style={{ padding: '12px 28px', background: 'var(--primary)', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 12px rgba(46,189,142,0.2)' }}>
              + New Client
            </Link>
          </div>

          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Search Company / SSM</label>
                <input type="text" placeholder="e.g. Acme Corp" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', outline: 'none', fontSize: '0.9rem' }} />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Filter Join Month</label>
                <select value="" onChange={(e) => { if (e.target.value && !selectedMonths.includes(e.target.value)) setSelectedMonths([...selectedMonths, e.target.value]); }} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', outline: 'none', fontSize: '0.9rem', cursor: 'pointer', appearance: 'none' }}>
                  <option value="">+ Add Month...</option>
                  {monthsList.filter(m => !selectedMonths.includes(m)).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>Total Clients</p>
              <p style={{ fontSize: '1.8rem', fontWeight: 800, margin: '4px 0 0' }}>{clients.length}</p>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>Active Clients</p>
              <p style={{ fontSize: '1.8rem', fontWeight: 800, margin: '4px 0 0', color: 'var(--primary-dark)' }}>{clients.filter(c => !c.company_name?.startsWith('(INACTIVE) ')).length}</p>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>Loading clients…</div>
          ) : filtered.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, padding: 48, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p>No clients found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((client) => {
                const isDeactivated = client.company_name?.startsWith('(INACTIVE) ')
                const displayName = isDeactivated ? client.company_name.replace('(INACTIVE) ', '') : client.company_name
                return (
                  <div key={client.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', background: isDeactivated ? '#f9fafb' : '#fff', borderRadius: 14, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', opacity: isDeactivated ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: isDeactivated ? '#d1d5db' : 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.4rem', color: isDeactivated ? '#4b5563' : 'var(--primary-dark)' }}>
                        {displayName[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: isDeactivated ? '#6b7280' : '#111827' }}>
                          {displayName} {isDeactivated && <span style={{ fontSize: '0.7rem', background: '#eee', padding: '2px 6px', borderRadius: 4, marginLeft: 8 }}>INACTIVE</span>}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>{client.address && `📍 ${client.address}`}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <Link href={`/clients/${client.id}/orders`} style={{ padding: '10px 18px', background: 'var(--primary)', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>Orders</Link>
                      <button onClick={() => handleToggleActive(client, !isDeactivated)} style={{ padding: '10px 18px', background: isDeactivated ? 'var(--primary-light)' : '#fee2e2', color: isDeactivated ? 'var(--primary-dark)' : '#ef4444', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                        {isDeactivated ? 'Reactivate' : 'Deactivate'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}