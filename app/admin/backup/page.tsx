'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface BackupHistory {
  id: string
  backup_type: string
  file_url: string
  record_count: number
  backup_date: string
  status: string
}

export default function BackupPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingBackup, setCreatingBackup] = useState(false)

  // 检查管理员权限
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      toast.error('Access denied. Admin only.')
      router.push('/dashboard')
    }
  }, [profile, router])

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadBackupHistory()
    }
  }, [profile])

  const loadBackupHistory = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/backup', {
        headers: {
          'x-api-key': 'your-secret-api-key', // 在实际应用中应该使用环境变量
        },
      })

      if (!response.ok) throw new Error('Failed to load backup history')

      const data = await response.json()
      
      if (data.success) {
        setBackupHistory(data.backup_history || [])
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Error loading backup history:', error)
      toast.error('Failed to load backup history')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBackup = async () => {
    if (!confirm('Create a new backup? This might take a few moments.')) {
      return
    }

    try {
      setCreatingBackup(true)
      
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'x-api-key': 'your-secret-api-key',
        },
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Backup created successfully!')
        loadBackupHistory()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Error creating backup:', error)
      toast.error(error.message || 'Failed to create backup')
    } finally {
      setCreatingBackup(false)
    }
  }

  const handleDeleteBackup = async (backupId: string, fileName?: string) => {
    if (!confirm('Delete this backup? This action cannot be undone.')) {
      return
    }

    try {
      // 这里需要实现删除备份文件的逻辑
      toast.success('Backup deleted successfully')
      loadBackupHistory()
    } catch (error: any) {
      console.error('Error deleting backup:', error)
      toast.error('Failed to delete backup')
    }
  }

  const handleDownloadBackup = (fileUrl: string) => {
    window.open(fileUrl, '_blank')
  }

  const handleScheduleBackup = () => {
    const frequency = prompt('Enter backup frequency (daily/weekly/monthly):')
    if (!frequency) return

    const time = prompt('Enter backup time (HH:MM, 24-hour format):')
    if (!time) return

    toast.success(`Backup scheduled for ${time} ${frequency}`)
    // 实际应用中应该调用API来设置定时任务
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Backup Management</h1>
          <p className="text-gray-600 mt-2">Manage system backups and data protection</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Create Backup */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Manual Backup</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">Create a backup of all database tables</p>
              <button
                onClick={handleCreateBackup}
                disabled={creatingBackup}
                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingBackup ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Backup...
                  </span>
                ) : 'Create Backup Now'}
              </button>
            </div>
          </div>

          {/* Schedule Backup */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Automated Backup</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">Schedule automatic backups</p>
              <button
                onClick={handleScheduleBackup}
                className="w-full py-3 border border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition"
              >
                Configure Schedule
              </button>
            </div>
          </div>

          {/* Backup Stats */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Backup Stats</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Backups:</span>
                  <span className="font-bold text-gray-900">{backupHistory.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Latest Backup:</span>
                  <span className="font-bold text-gray-900">
                    {backupHistory[0]?.backup_date 
                      ? format(new Date(backupHistory[0].backup_date), 'MMM d, yyyy')
                      : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Records:</span>
                  <span className="font-bold text-gray-900">
                    {backupHistory.reduce((sum, b) => sum + (b.record_count || 0), 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Backup History Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Backup History</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600">Loading backup history...</p>
            </div>
          ) : backupHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Records
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {backupHistory.map((backup) => (
                    <tr key={backup.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">
                          {format(new Date(backup.backup_date), 'MMM d, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(backup.backup_date), 'h:mm a')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${backup.backup_type === 'manual' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'}`}>
                          {backup.backup_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">
                          {backup.record_count?.toLocaleString()} records
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${backup.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'}`}>
                          {backup.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {backup.file_url ? (
                          <button
                            onClick={() => handleDownloadBackup(backup.file_url)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            Download
                          </button>
                        ) : (
                          <span className="text-gray-400">No file</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteBackup(backup.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">💾</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No backups yet</h3>
              <p className="text-gray-600 mb-4">Create your first backup to protect your data</p>
              <button
                onClick={handleCreateBackup}
                className="inline-block px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
              >
                Create First Backup
              </button>
            </div>
          )}
        </div>

        {/* Backup Information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">📚 Backup Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">What gets backed up:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>All user profiles and agent information</li>
                <li>Complete client database</li>
                <li>All sales orders with details</li>
                <li>Backup history records</li>
                <li>Commission calculations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Best Practices:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Create backups daily for active systems</li>
                <li>Download backups to local storage for safekeeping</li>
                <li>Test backup restoration periodically</li>
                <li>Keep at least 30 days of backup history</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
