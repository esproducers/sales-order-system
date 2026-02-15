'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { format } from 'date-fns'

export default function DashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalClients: 0,
    totalCommission: 0,
    recentOrders: [] as any[],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      loadDashboardData()
    }
  }, [profile])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // 获取订单统计
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, clients(company_name)')
        .eq('agent_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (ordersError) throw ordersError

      // 获取客户统计
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id')
        .eq('agent_id', profile.id)

      if (clientsError) throw clientsError

      // 计算总佣金
      const totalCommission = ordersData?.reduce(
        (sum, order) => sum + (order.commission_amount || 0),
        0
      )

      setStats({
        totalOrders: ordersData?.length || 0,
        totalClients: clientsData?.length || 0,
        totalCommission: totalCommission || 0,
        recentOrders: ordersData || [],
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your sales today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalClients}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Commission</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${stats.totalCommission.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    href="/orders/new"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition group"
                  >
                    <div className="p-3 bg-indigo-100 rounded-lg mr-4">
                      <span className="text-xl">➕</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 group-hover:text-indigo-600">
                        New Order
                      </h3>
                      <p className="text-sm text-gray-600">Create a new sales order</p>
                    </div>
                  </Link>

                  <Link
                    href="/clients/new"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition group"
                  >
                    <div className="p-3 bg-green-100 rounded-lg mr-4">
                      <span className="text-xl">👤</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 group-hover:text-green-600">
                        Add Client
                      </h3>
                      <p className="text-sm text-gray-600">Add a new client</p>
                    </div>
                  </Link>

                  <Link
                    href="/orders"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition group"
                  >
                    <div className="p-3 bg-blue-100 rounded-lg mr-4">
                      <span className="text-xl">📋</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                        View Orders
                      </h3>
                      <p className="text-sm text-gray-600">See all your orders</p>
                    </div>
                  </Link>

                  <Link
                    href="/clients"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition group"
                  >
                    <div className="p-3 bg-purple-100 rounded-lg mr-4">
                      <span className="text-xl">🏢</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 group-hover:text-purple-600">
                        Client List
                      </h3>
                      <p className="text-sm text-gray-600">Manage your clients</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div>
            <div className="bg-white rounded-xl shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
              </div>
              <div className="p-6">
                {stats.recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{order.item_name}</p>
                          <p className="text-sm text-gray-600">
                            {order.clients?.company_name} • {format(new Date(order.purchase_date), 'MMM d')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">${order.total_amount}</p>
                          <p className="text-sm text-green-600">
                            +${order.commission_amount?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent orders</p>
                )}
                
                <Link
                  href="/orders"
                  className="block mt-4 text-center text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  View all orders →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}