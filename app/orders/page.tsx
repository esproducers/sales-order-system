'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function OrdersPage() {
  const { profile } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'editable', 'deletable'

  useEffect(() => {
    if (profile) {
      loadOrders()
    }
  }, [profile, filter])

  const loadOrders = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('orders')
        .select('*, clients(company_name)')
        .eq('agent_id', profile.id)
        .order('created_at', { ascending: false })

      // 应用过滤器
      if (filter === 'editable') {
        query = query.gt('can_edit_until', new Date().toISOString())
      } else if (filter === 'deletable') {
        query = query.gt('can_delete_until', new Date().toISOString())
      }

      const { data, error } = await query

      if (error) throw error
      setOrders(data || [])
    } catch (error: any) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .eq('agent_id', profile.id) // 确保只能删除自己的订单

      if (error) throw error

      toast.success('Order deleted successfully')
      loadOrders()
    } catch (error: any) {
      console.error('Error deleting order:', error)
      toast.error('Failed to delete order')
    }
  }

  const canEdit = (order: any) => {
    return new Date(order.can_edit_until) > new Date()
  }

  const canDelete = (order: any) => {
    return new Date(order.can_delete_until) > new Date()
  }

  const totalCommission = orders.reduce((sum, order) => sum + (order.commission_amount || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 mt-2">Manage all your sales orders</p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex space-x-4">
            <div className="bg-white rounded-lg border border-gray-300">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Orders</option>
                <option value="editable">Editable (7 days)</option>
                <option value="deletable">Deletable (3 days)</option>
              </select>
            </div>
            
            <Link
              href="/orders/new"
              className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
              + New Order
            </Link>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{orders.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-xl">📦</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ${orders.reduce((sum, order) => sum + (order.total_amount || 0), 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Your Commission</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  ${totalCommission.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-xl">🎯</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Editable Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {orders.filter(canEdit).length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <span className="text-xl">✏️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600">Loading orders...</p>
            </div>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{order.item_name}</div>
                          <div className="text-sm text-gray-500">
                            Qty: {order.quantity} × ${order.price}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{order.clients?.company_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{format(new Date(order.purchase_date), 'MMM d, yyyy')}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(order.created_at), 'h:mm a')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          ${order.total_amount?.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-green-600">
                          +${order.commission_amount?.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          {canEdit(order) && (
                            <button
                              onClick={() => {/* 编辑功能 */}}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                          )}
                          {canDelete(order) && (
                            <button
                              onClick={() => handleDelete(order.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          )}
                          {!canEdit(order) && !canDelete(order) && (
                            <span className="text-gray-400">View Only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-4">Start by creating your first order</p>
              <Link
                href="/orders/new"
                className="inline-block px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
              >
                Create Your First Order
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}