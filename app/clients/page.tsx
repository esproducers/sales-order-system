'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function ClientsPage() {
  const { profile } = useAuth()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (profile) {
      loadClients()
    }
  }, [profile])

  const loadClients = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('agent_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (error: any) {
      console.error('Error loading clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This will also delete all their orders.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('agent_id', profile.id)

      if (error) throw error

      toast.success('Client deleted successfully')
      loadClients()
    } catch (error: any) {
      console.error('Error deleting client:', error)
      toast.error('Failed to delete client')
    }
  }

  const filteredClients = clients.filter(client =>
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.ssm_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_phone?.includes(searchTerm)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Clients</h1>
            <p className="text-gray-600 mt-2">Manage your client database</p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                🔍
              </div>
            </div>
            
            <Link
              href="/clients/new"
              className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
              + Add Client
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{clients.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">🏢</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">SSM Registered</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {clients.filter(c => c.ssm_id).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">📄</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Clients</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {clients.length} {/* 这里可以添加逻辑来识别活跃客户 */}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600">Loading clients...</p>
            </div>
          ) : filteredClients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{client.company_name}</div>
                          <div className="text-sm text-gray-500">{client.address}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-gray-900">📞 {client.company_phone}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            📱 {client.contact_phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          {client.ssm_id && (
                            <div className="text-gray-900">SSM: {client.ssm_id}</div>
                          )}
                          {client.tin_id && (
                            <div className="text-sm text-gray-500">TIN: {client.tin_id}</div>
                          )}
                          {client.ssm_file_url && (
                            <a
                              href={client.ssm_file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 mt-1"
                            >
                              📎 View SSM File
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">
                          {format(new Date(client.created_at), 'MMM d, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(client.created_at), 'h:mm a')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <Link
                            href={`/clients/${client.id}/orders`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Orders
                          </Link>
                          <button
                            onClick={() => handleDelete(client.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No matching clients found' : 'No clients yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try a different search term'
                  : 'Start by adding your first client'
                }
              </p>
              <Link
                href="/clients/new"
                className="inline-block px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
              >
                Add Your First Client
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}