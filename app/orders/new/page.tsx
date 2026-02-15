'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function NewOrderPage() {
  const { profile } = useAuth()
  const router = useRouter()
  
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    purchase_date: new Date().toISOString().split('T')[0],
    item_name: '',
    quantity: 1,
    price: 0,
  })

  useEffect(() => {
    loadClients()
  }, [profile])

  useEffect(() => {
    if (selectedClient) {
      loadRecentOrders()
    }
  }, [selectedClient])

  const loadClients = async () => {
    if (!profile) return
    
    const { data, error } = await supabase
      .from('clients')
      .select('id, company_name')
      .eq('agent_id', profile.id)
      .order('company_name')

    if (error) {
      console.error('Error loading clients:', error)
      toast.error('Failed to load clients')
    } else {
      setClients(data || [])
    }
  }

  const loadRecentOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('client_id', selectedClient)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error loading recent orders:', error)
    } else {
      setRecentOrders(data || [])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedClient) {
      toast.error('Please select a client')
      return
    }

    if (!formData.item_name || formData.quantity <= 0 || formData.price <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.from('orders').insert({
        client_id: selectedClient,
        agent_id: profile?.id,
        ...formData,
      })

      if (error) throw error

      toast.success('Order created successfully!')
      router.push('/orders')
    } catch (error: any) {
      console.error('Error creating order:', error)
      toast.error(error.message || 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = formData.quantity * formData.price
  const commissionAmount = totalAmount * ((profile?.commission_rate || 0) / 100)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Order</h1>
            <p className="text-gray-600 mt-2">Fill in the order details below</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Orders Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Client Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Client *
                    </label>
                    <select
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="">-- Select a client --</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.company_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Recent Orders Preview */}
                  {selectedClient && recentOrders.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-medium text-blue-900 mb-3">
                        📋 Recent Orders for This Client
                      </h3>
                      <div className="space-y-2">
                        {recentOrders.map((order) => (
                          <div key={order.id} className="flex justify-between items-center text-sm">
                            <div>
                              <span className="font-medium">{order.item_name}</span>
                              <span className="text-gray-600 ml-2">
                                (x{order.quantity})
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">${order.total_amount}</div>
                              <div className="text-gray-600 text-xs">
                                {new Date(order.purchase_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Order Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Purchase Date *
                      </label>
                      <input
                        type="date"
                        value={formData.purchase_date}
                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Item Name *
                      </label>
                      <input
                        type="text"
                        value={formData.item_name}
                        onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Product XYZ"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price per Unit *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating Order...' : 'Create Order'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-white rounded-xl shadow sticky top-8">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-lg font-medium">${totalAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Your Commission ({profile?.commission_rate}%)</span>
                    <span className="text-lg font-medium text-green-600">
                      +${commissionAmount.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Total Sale</span>
                      <span className="text-2xl font-bold text-indigo-600">
                        ${totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-6">
                    <div className="text-sm text-gray-600 space-y-2">
                      <p>⚠️ Note: You have 7 days to edit this order and 3 days to delete it.</p>
                      <p>📊 Your commission will be calculated automatically.</p>
                      <p>👤 Order will be linked to your profile.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}