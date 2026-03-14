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
import Modal from '@/components/Modal'

export default function ClientsPage() {
  const { profile } = useAuth()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ title: string, message: string, onConfirm: () => void }>({ title: '', message: '', onConfirm: () => { } })


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

  const promptToggleActive = (client: any, currentActive: boolean) => {
    const action = currentActive ? 'Deactivate' : 'Reactivate'
    setConfirmAction({
        title: `${action} Client`,
        message: `Are you sure you want to ${action.toLowerCase()} this client?`,
        onConfirm: async () => {
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
    })
    setIsConfirmModalOpen(true)
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="max-w-[1580px] mx-auto px-4 sm:px-6 py-8 w-full flex flex-col md:flex-row gap-6 md:gap-8 flex-1">
        <Sidebar />
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 m-0">My Clients</h1>
              <p className="text-gray-500 mt-2 text-[0.95rem]">Manage your client database</p>
            </div>
            <Link 
                href="/clients/new" 
                className="w-full sm:w-auto px-6 py-3 bg-primary text-white font-bold text-sm rounded-xl shadow-[0_4px_12px_rgba(46,189,142,0.25)] hover:bg-primary-dark transition-colors text-center"
            >
              + New Client
            </Link>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-6 flex flex-col gap-4 border border-gray-50">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Search Company / SSM</label>
                <input 
                    type="text" 
                    placeholder="e.g. Acme Corp" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition" 
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Filter Join Month</label>
                <select 
                    value="" 
                    onChange={(e) => { if (e.target.value && !selectedMonths.includes(e.target.value)) setSelectedMonths([...selectedMonths, e.target.value]); }} 
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition bg-white"
                >
                  <option value="">+ Add Month...</option>
                  {monthsList.filter(m => !selectedMonths.includes(m)).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

             {selectedMonths.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500 flex items-center mr-1">Active Filters:</span>
                    {selectedMonths.map(m => (
                        <div key={m} className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-yellow-200">
                            📅 {m} <button onClick={() => setSelectedMonths(selectedMonths.filter(x => x !== m))} className="hover:text-yellow-900 border-none bg-transparent cursor-pointer">×</button>
                        </div>
                    ))}
                    <button onClick={() => { setSelectedMonths([]); }} className="text-gray-500 hover:text-gray-900 bg-transparent border-none text-xs cursor-pointer underline">Clear All</button>
                </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 md:p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-50 text-center sm:text-left">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider m-0">Total Clients</p>
              <p className="text-2xl md:text-3xl font-black text-gray-900 m-0 mt-1">{clients.length}</p>
            </div>
            <div className="bg-white rounded-xl p-5 md:p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-50 text-center sm:text-left">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider m-0">Active Clients</p>
              <p className="text-2xl md:text-3xl font-black text-primary-dark m-0 mt-1">{clients.filter(c => !c.company_name?.startsWith('(INACTIVE) ')).length}</p>
            </div>
          </div>

          {loading ? (
             <div className="flex items-center justify-center p-20 flex-1">
                 <div className="w-10 h-10 border-4 border-primary-mid border-t-primary rounded-full animate-spin mx-auto mb-4" />
             </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-50 flex flex-col items-center justify-center">
                <div className="text-5xl mb-4">🏢</div>
                <p className="text-gray-500 font-bold">No clients found.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((client) => {
                const isDeactivated = client.company_name?.startsWith('(INACTIVE) ')
                const displayName = isDeactivated ? client.company_name.replace('(INACTIVE) ', '') : client.company_name
                return (
                  <div key={client.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 bg-white rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] gap-4 transition-opacity ${isDeactivated ? 'opacity-60 bg-gray-50' : ''}`}>
                    
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-extrabold text-xl md:text-2xl shrink-0 ${isDeactivated ? 'bg-gray-200 text-gray-500' : 'bg-primary-light text-primary-dark'}`}>
                        {displayName[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-gray-900 text-base md:text-lg break-all leading-tight">
                          {displayName}
                          {isDeactivated && <span className="text-[0.65rem] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md ml-2 align-middle">INACTIVE</span>}
                        </div>
                        {client.address && <div className="text-sm text-gray-500 mt-1 truncate">📍 {client.address}</div>}
                      </div>
                    </div>

                    <div className="flex gap-2 self-end sm:self-auto w-full sm:w-auto">
                      <Link 
                        href={`/clients/${client.id}/orders`} 
                        className="flex-1 sm:flex-none px-4 py-2 bg-primary text-white rounded-lg text-center font-bold text-sm shadow-sm hover:bg-primary-dark transition-colors"
                      >
                        Orders
                      </Link>
                      <button 
                         onClick={() => promptToggleActive(client, !isDeactivated)} 
                         className={`flex-1 sm:flex-none px-4 py-2 border-none rounded-lg font-bold text-sm cursor-pointer transition-colors text-center ${isDeactivated ? 'bg-primary-light text-primary-dark hover:bg-primary-light/80' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                      >
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