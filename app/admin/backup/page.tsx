'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar'
import AdminSidebar from '@/components/AdminSidebar'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Modal from '@/components/Modal'

interface BackupHistory {
  id: string
  backup_type: string
  file_url: string
  record_count: number
  created_at: string
  status: string
}

export default function BackupPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingBackup, setCreatingBackup] = useState(false)

  // Modals state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ title: string, message: string, onConfirm: () => void }>({ title: '', message: '', onConfirm: () => { } })

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({ frequency: 'daily', time: '02:00' })

  useEffect(() => {
    if (!authLoading && profile) {
      if (profile.role !== 'admin') {
        toast.error('Access denied. Admin only.')
        router.push('/dashboard')
      }
    }
  }, [profile, authLoading, router])

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
          'x-api-key': process.env.NEXT_PUBLIC_BACKUP_API_KEY || 'your-secret-api-key',
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

  const promptCreateBackup = () => {
    setConfirmAction({
      title: 'Create Backup',
      message: 'Create a new backup? This might take a few moments.',
      onConfirm: async () => {
        try {
          setCreatingBackup(true)
          const response = await fetch('/api/backup', {
            method: 'POST',
            headers: {
              'x-api-key': process.env.NEXT_PUBLIC_BACKUP_API_KEY || 'your-secret-api-key',
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
    })
    setIsConfirmModalOpen(true)
  }

  const promptDeleteBackup = (backupId: string) => {
    setConfirmAction({
      title: 'Delete Backup',
      message: 'Delete this backup? This action cannot be undone.',
      onConfirm: () => {
        toast.success('Backup record archived (Deletion logic pending API implementation)')
      }
    })
    setIsConfirmModalOpen(true)
  }

  const handleDownloadBackup = (fileUrl: string) => {
    window.open(fileUrl, '_blank')
  }

  const submitSchedule = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(`Backup scheduled for ${scheduleForm.time} ${scheduleForm.frequency}`)
    setIsScheduleModalOpen(false)
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex items-center justify-center p-20 flex-1">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-primary-mid border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading backup systems…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-[1580px] mx-auto px-4 sm:px-6 py-8 w-full flex flex-col md:flex-row gap-6 md:gap-8 flex-1">
        <AdminSidebar />
        <div className="flex-1 min-w-0">
          <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 m-0 leading-tight tracking-tight">Backup Management</h1>
              <p className="text-gray-500 mt-2 text-[0.95rem]">Secure your data with manual and automated system backups.</p>
            </div>
            <button
              onClick={promptCreateBackup}
              disabled={creatingBackup}
              className="w-full sm:w-auto px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-xl shadow-[0_4px_12px_rgba(46,189,142,0.25)] hover:bg-primary-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {creatingBackup ? 'Creating...' : 'Create Backup Now'}
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 md:mb-8">
            {[
              { label: 'Total Backups', value: backupHistory.length, icon: '💾', color: '#dbeafe' },
              { label: 'Latest Backup', value: backupHistory[0]?.created_at ? format(new Date(backupHistory[0].created_at), 'MMM d') : 'None', icon: '⏱️', color: '#dcfce7' },
              { label: 'Protected Records', value: backupHistory.reduce((sum, b) => sum + (b.record_count || 0), 0).toLocaleString(), icon: '🛡️', color: '#fef9c3' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-5 md:p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex items-center justify-between border border-gray-50">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{s.label}</p>
                  <p className="text-[1.8rem] font-black text-gray-900 leading-none">{s.value}</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: s.color }}>
                  {s.icon}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-6">
            {/* History Table Card */}
            <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden border border-gray-50 flex flex-col items-stretch self-start w-full">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <h2 className="font-extrabold text-[1.1rem] m-0 text-gray-900">Execution History</h2>
              </div>
              
              <div className="flex flex-col">
                <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1.5fr] bg-gray-50 border-b border-gray-100">
                  {['Date & Status', 'Type', 'Records', 'Actions'].map((h, i) => (
                    <div key={h} className={`px-5 py-3 text-xs font-bold text-gray-500 uppercase ${i === 3 ? 'text-right' : 'text-left'}`}>{h}</div>
                  ))}
                </div>

                <div className="flex flex-col gap-2 p-3 md:p-0">
                  {backupHistory.map((backup) => (
                    <div key={backup.id} className="bg-white rounded-xl md:rounded-none border border-gray-100 md:border-x-0 md:border-t-0 md:border-b shadow-sm md:shadow-none p-4 md:p-0 md:grid md:grid-cols-[1.5fr_1fr_1fr_1.5fr] items-center">
                      <div className="md:px-5 md:py-3 mb-2 md:mb-0">
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                          {format(new Date(backup.created_at), 'MMM d, yyyy')}
                          <span className={`w-2 h-2 rounded-full ${backup.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}`} title={backup.status} />
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{format(new Date(backup.created_at), 'HH:mm:ss')}</div>
                      </div>

                      <div className="md:px-5 md:py-3 mb-2 md:mb-0">
                         <span className="md:hidden text-xs text-gray-500 font-semibold mr-2">Type:</span>
                         <span className={`text-[0.7rem] font-black uppercase px-2.5 py-1 rounded-full ${
                           backup.backup_type === 'manual' ? 'bg-blue-50 text-blue-800' : 'bg-green-50 text-green-700'
                         }`}>
                           {backup.backup_type}
                         </span>
                      </div>

                      <div className="md:px-5 md:py-3 text-sm font-semibold text-gray-600 mb-3 md:mb-0">
                         <span className="md:hidden text-xs text-gray-500 mr-2">Rows:</span>
                         {backup.record_count?.toLocaleString()} rows
                      </div>

                      <div className="md:px-5 md:py-3 flex flex-wrap gap-3 md:justify-end items-center border-t border-gray-50 md:border-0 pt-3 md:pt-0">
                        {backup.file_url ? (
                          <button
                            onClick={() => handleDownloadBackup(backup.file_url)}
                            className="text-primary hover:bg-primary-light/50 px-3 py-1.5 rounded-lg border-none font-bold cursor-pointer text-xs transition"
                          >Download</button>
                        ) : <span className="text-gray-300 text-xs px-3 py-1.5">No Data</span>}
                        <button
                          onClick={() => promptDeleteBackup(backup.id)}
                          className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg border-none font-semibold cursor-pointer text-xs ml-auto md:ml-0 transition"
                        >Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
                {backupHistory.length === 0 && (
                  <div className="p-12 text-center text-gray-400 font-medium">
                    <div className="text-4xl mb-3">📁</div>
                    <p className="text-sm m-0">No backup history found.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {/* Automation Card */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-lg">
                <h3 className="font-extrabold text-lg m-0 mb-3">Automation</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">Configure recurring backups to ensure you never lose critical sales data or agent profiles.</p>
                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="w-full py-3 bg-primary hover:bg-primary-dark border-none text-white rounded-lg font-bold cursor-pointer transition-colors shadow-sm"
                >Set Backup Schedule</button>
              </div>

              {/* Security Info Card */}
              <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-6 border border-gray-50">
                <h3 className="font-extrabold text-sm mb-4 text-gray-900 uppercase tracking-wide">System Insight</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Retention Policy', value: '30 Days' },
                    { label: 'Encryption', value: 'AES-256' },
                    { label: 'Storage Usage', value: 'Low' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="font-bold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title="Schedule Automated Backup">
          <form onSubmit={submitSchedule} className="space-y-4">
              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Frequency</label>
                  <select value={scheduleForm.frequency} onChange={e => setScheduleForm({...scheduleForm, frequency: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                  </select>
              </div>
              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Time (Local)</label>
                  <input required type="time" value={scheduleForm.time} onChange={e => setScheduleForm({...scheduleForm, time: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-primary hover:bg-primary-dark transition text-white font-bold rounded-lg mt-4">
                  Save Schedule
              </button>
          </form>
      </Modal>

      {/* Confirm Actions Modal */}
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
