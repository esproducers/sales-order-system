'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const { profile } = useAuth()
  const router = useRouter()
  
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalClients: 0,
    totalOrders: 0,
    totalSales: 0,
  })
  const [agents, setAgents] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 检查管理员权限
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      toast.error('Access denied. Admin only.')
      router.push('/dashboard')
    }
  }, [profile, router])

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadAdminData()
    }
  }, [profile])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      
      // 获取所有代理
      const { data: agentsData, error: agentsError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (agentsError) throw agentsError

      // 获取所有订单
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, clients(company_name), profiles(name)')
        .order('created_at', { ascending: false })
        .limit(10)

      if (ordersError) throw ordersError

      // 获取所有客户
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id')

      if (clientsError) throw clientsError

      // 计算统计数据
      const totalSales = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

      setStats({
        totalAgents: agentsData?.filter(a => a.role === 'agent').length || 0,
        totalClients: clientsData?.length || 0,
        totalOrders: ordersData?.length || 0,
        totalSales,
      })

      setAgents(agentsData || [])
      setRecentOrders(ordersData || [])
    } catch (error: any) {
      console.error('Error loading admin data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAgent = async () => {
    const email = prompt('Enter agent email:')
    if (!email) return

    const name = prompt('Enter agent name:')
    if (!name) return

    const phone = prompt('Enter agent phone:')
    const commissionRate = parseFloat(prompt('Enter commission rate (%):') || '5')

    try {
      // 创建用户（实际应用中需要发送邀请邮件）
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: 'temporary123', // 应该生成随机密码
        email_confirm: true,
      })

      if (authError) throw authError

      // 创建代理资料
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: authData.user.id,
            name,
            email,
            phone,
            role: 'agent',
            commission_rate: commissionRate,
          },
        ])

      if (profileError) throw profileError

      toast.success('Agent created successfully!')
      loadAdminData()
    } catch (error: any) {
      console.error('Error creating agent:', error)
      toast.error(error.message || 'Failed to create agent')
    }
  }

  const handleUpdateCommission = async (agentId: string, currentRate: number) => {
    const newRate = parseFloat(prompt('Enter new commission rate (%):', currentRate.toString()) || '')
    
    if (isNaN(newRate) || newRate < 0 || newRate > 100) {
      toast.error('Invalid commission rate')
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ commission_rate: newRate })
        .eq('id', agentId)

      if (error) throw error

      toast.success('Commission rate updated!')
      loadAdminData()
    } catch (error: any) {
      console.error('Error updating commission:', error)
      toast.error('Failed to update commission')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading admin panel...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your sales team and system</p>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Agents</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalAgents}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">👨‍💼</span>
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
                <span className="text-2xl">🏢</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${stats.totalSales.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Agents Management */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Agents Management</h2>
              <button
                onClick={handleCreateAgent}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
              >
                + Add Agent
              </button>
            </div>
            
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agent
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commission
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {agents.filter(a => a.role === 'agent').map((agent) => (
                      <tr key={agent.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{agent.name}</div>
                            <div className="text-sm text-gray-500">{agent.email}</div>
                            <div className="text-sm text-gray-500">{agent.phone}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900">
                            {agent.commission_rate}%
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {format(new Date(agent.created_at), 'MMM d, yyyy')}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleUpdateCommission(agent.id, agent.commission_rate)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit Rate
                            </button>
                            <Link
                              href={`/admin/agent/${agent.id}`}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            </div>
            
            <div className="p-6">
              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{order.item_name}</p>
                        <p className="text-sm text-gray-600">
                          {order.clients?.company_name} • By {order.profiles?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${order.total_amount?.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(order.created_at), 'MMM d')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent orders</p>
              )}
              
              <Link
                href="/admin/orders"
                className="block mt-4 text-center text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View all orders →
              </Link>
            </div>
          </div>
        </div>

        {/* Backup Section */}
        <div className="mt-8 bg-white rounded-xl shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">System Management</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Backup System</h3>
                <p className="text-sm text-gray-600 mb-4">Create manual database backup</p>
                <button
                  onClick={() => {/* 触发备份 */}}
                  className="w-full py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                >
                  Create Backup
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">System Logs</h3>
                <p className="text-sm text-gray-600 mb-4">View system activity logs</p>
                <Link
                  href="/admin/logs"
                  className="block w-full py-2 text-center border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  View Logs
                </Link>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Settings</h3>
                <p className="text-sm text-gray-600 mb-4">System configuration</p>
                <Link
                  href="/admin/settings"
                  className="block w-full py-2 text-center border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Configure
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}