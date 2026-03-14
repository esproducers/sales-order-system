'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Modal from '@/components/Modal'

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

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ title: string, message: string, onConfirm: () => void }>({ title: '', message: '', onConfirm: () => { } })


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

  const promptDelete = (orderId: string) => {
    setConfirmAction({
        title: 'Delete Order',
        message: 'Delete this order? This cannot be undone.',
        onConfirm: async () => {
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
    })
    setIsConfirmModalOpen(true)
  }

  const canEdit = (order: any) => new Date(order.can_edit_until) > new Date()
  const totalCommission = orders.reduce((sum, o) => sum + (o.commission_amount || 0), 0)

  // Filter orders based on tab
  const displayOrders = orders.filter(o => {
    if (tab === 'all') return true
    if (tab === 'upcoming') return canEdit(o)
    return !canEdit(o)
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="max-w-[1580px] mx-auto px-4 sm:px-6 py-8 w-full flex flex-col md:flex-row gap-6 md:gap-8 flex-1">
        <Sidebar totalCommission={totalCommission} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 m-0">Client Orders</h1>
              <p className="text-gray-500 mt-2 text-[0.95rem]">View specific orders for this client</p>
            </div>
            <Link
              href="/clients"
              className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-300 transition-colors text-center"
            >
              ← Back to Clients
            </Link>
          </div>

          {/* Tab bar */}
          <div className="flex overflow-x-auto border-b-2 border-gray-200 mb-6 gap-2 hide-scrollbar">
            {(
              [
                { key: 'upcoming', label: `Upcoming (${orders.filter((o) => canEdit(o)).length})` },
                { key: 'previous', label: `Previous (${orders.filter((o) => !canEdit(o)).length})` },
                { key: 'all', label: `All (${orders.length})` },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2.5 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors ${
                  tab === key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                style={{ marginBottom: '-2px' }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Order cards */}
          {loading ? (
             <div className="flex items-center justify-center p-20 flex-1">
                 <div className="w-10 h-10 border-4 border-primary-mid border-t-primary rounded-full animate-spin mx-auto mb-4" />
             </div>
          ) : displayOrders.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-50 flex flex-col items-center justify-center">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="font-bold text-lg mb-2 text-gray-900">No orders yet</h3>
              <p className="text-gray-500 mb-6 text-sm">Start by creating your first order for this client</p>
              <Link
                href="/orders/new"
                className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition"
              >
                Create Order
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {displayOrders.map((order: any, idx) => {
                let stepIndex = 0
                const s = (order.status || '').toLowerCase()
                if (s === 'preparing') stepIndex = 1
                if (s === 'picked up') stepIndex = 2
                if (s === 'delivered') stepIndex = 3

                return (
                  <div key={order.id} className="bg-white rounded-xl p-5 md:p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-50 flex flex-col relative overflow-hidden">
                    
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="w-11 h-11 rounded-full bg-primary-light flex items-center justify-center text-xl shrink-0">📦</div>
                        <div>
                          <div className="font-extrabold text-gray-900 text-sm md:text-base">
                            Order #{order.id?.slice(0, 8).toUpperCase() ?? '------'}
                          </div>
                          <div className="text-primary-dark font-black text-sm mt-0.5">
                            RM {order.total_amount?.toFixed(2) ?? '0.00'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
                        <button
                          onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }}
                          className="flex-1 sm:flex-none px-4 py-2 bg-primary text-white border-none rounded-lg font-bold text-xs cursor-pointer shadow-sm hover:bg-primary-dark transition text-center"
                        >
                          Details
                        </button>
                        {stepIndex < 2 && canEdit(order) && (
                          <button
                            onClick={() => promptDelete(order.id)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border-none rounded-lg font-bold text-xs cursor-pointer transition text-center"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar Container - Scrollable on very small screens */}
                    <div className="mb-5 overflow-x-auto py-2 hide-scrollbar">
                      <div className="flex items-start relative min-w-[280px]">
                        <div className="absolute top-2.5 left-[12.5%] w-[75%] h-[2px] bg-gray-200 z-0" />
                        <div 
                          className="absolute top-2.5 left-[12.5%] h-[2px] bg-primary z-0 transition-all duration-300"
                          style={{ width: `${(stepIndex / (STATUS_STEPS.length - 1)) * 75}%` }}
                        />
                        {STATUS_STEPS.map((step, i) => {
                          const done = i <= stepIndex
                          const active = i === stepIndex
                          return (
                            <div key={step} className="flex flex-col items-center flex-1 relative z-10">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 bg-white ${active ? 'border-primary ring-2 ring-primary-light ring-offset-1' : done ? 'border-primary' : 'border-gray-300'}`}>
                                <div className={`w-2.5 h-2.5 rounded-full ${done ? 'bg-primary' : 'bg-transparent'}`} />
                              </div>
                              <span className={`mt-2 text-[0.65rem] font-bold ${active ? 'text-primary-dark' : done ? 'text-primary' : 'text-gray-400'}`}>
                                {step}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Meta Footer */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 font-medium bg-gray-50 -mx-5 -mb-5 p-3 md:px-6 md:py-3 mt-auto">
                      <span>{order.quantity ?? Object.values(order.items || {}).reduce((s:any, item:any)=> s + item.quantity, 0)} Items</span>
                      <span className="text-gray-300">•</span>
                      <span className="truncate max-w-[120px] sm:max-w-none">{order.clients?.company_name ?? 'Client'}</span>
                      <span className="text-gray-300">•</span>
                      <span>{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
                      
                      {order.commission_amount > 0 && (
                        <>
                          <span className="text-gray-300 hidden sm:inline">•</span>
                          <span className="text-primary-dark font-bold ml-auto sm:ml-0 bg-primary-light/30 px-2 py-0.5 rounded-md">
                            +RM {order.commission_amount?.toFixed(2)} comm.
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

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Order Details">
          {selectedOrder && (
              <div className="flex flex-col max-h-[70vh] -mx-6 -mt-2">
                 {/* Header Banner */}
                 <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Order ID</div>
                        <div className="font-extrabold text-primary-dark text-sm">#{selectedOrder.id?.slice(0, 8).toUpperCase()}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Date</div>
                        <div className="font-bold text-gray-900 text-sm">{format(new Date(selectedOrder.created_at), 'MMM d, yyyy')}</div>
                    </div>
                 </div>

                 <div className="p-6 overflow-y-auto">
                    <div className="mb-6">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Client</div>
                        <div className="font-extrabold text-gray-900 text-lg">{selectedOrder.clients?.company_name}</div>
                    </div>

                    <div className="space-y-3 mb-8">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Items Ordered</div>
                        {(selectedOrder.items || []).map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                                <div>
                                    <div className="font-bold text-gray-900 text-sm">{item.item_name}</div>
                                    <div className="text-xs text-gray-500 mt-0.5 font-medium">{item.quantity} CTN × RM {item.price?.toFixed(2)}</div>
                                </div>
                                <div className="font-black text-gray-900 text-sm">
                                    RM {(item.quantity * item.price).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t-2 border-dashed border-gray-200 pt-5 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-gray-500">Comm. ({selectedOrder.commission_rate ?? profile?.commission_rate ?? 5}%)</span>
                            <span className="font-black text-primary-dark">RM {selectedOrder.commission_amount?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-extrabold text-gray-900 text-base">Total Due</span>
                            <span className="font-black text-gray-900 text-xl">RM {selectedOrder.total_amount?.toFixed(2)}</span>
                        </div>
                    </div>
                 </div>
              </div>
          )}
      </Modal>

      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title={confirmAction.title}>
          <div className="space-y-6">
              <p className="text-gray-600">{confirmAction.message}</p>
              <div className="flex gap-3 pt-2">
                  <button onClick={() => setIsConfirmModalOpen(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition">Cancel</button>
                  <button onClick={() => { setIsConfirmModalOpen(false); confirmAction.onConfirm(); }} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition">Confirm Delete</button>
              </div>
          </div>
      </Modal>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </div>
  )
}