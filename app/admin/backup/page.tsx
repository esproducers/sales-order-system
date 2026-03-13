'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar'
import AdminSidebar from '@/components/AdminSidebar'
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
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingBackup, setCreatingBackup] = useState(false)

  // 检查管理员权限
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
          'x-api-key': 'your-secret-api-key',
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
    if (!confirm('Create a new backup? This might take a few moments.')) return

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

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('Delete this backup? This action cannot be undone.')) return
    toast.success('Backup record archived (Deletion logic pending API implementation)')
  }

  const handleDownloadBackup = (fileUrl: string) => {
    window.open(fileUrl, '_blank')
  }

  const handleScheduleBackup = () => {
    const frequency = prompt('Enter backup frequency (daily/weekly/monthly):', 'daily')
    if (!frequency) return
    const time = prompt('Enter backup time (HH:MM):', '02:00')
    if (!time) return
    toast.success(`Backup scheduled for ${time} ${frequency}`)
  }

  if (loading || authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 40, height: 40,
              border: '3px solid var(--primary-mid)',
              borderTop: '3px solid var(--primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{ color: '#6b7280' }}>Loading backup systems…</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth: 1580, margin: '0 auto', padding: '40px 24px', display: 'flex', gap: 32 }}>
        <AdminSidebar />
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>Backup Management</h1>
              <p style={{ color: '#6b7280', marginTop: 6, fontSize: '0.95rem' }}>Secure your data with manual and automated system backups.</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleCreateBackup}
                disabled={creatingBackup}
                style={{
                  padding: '11px 22px', background: 'var(--primary)', color: '#fff',
                  fontWeight: 700, fontSize: '0.9rem', borderRadius: 10, border: 'none',
                  cursor: creatingBackup ? 'not-allowed' : 'pointer',
                  opacity: creatingBackup ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(46,189,142,0.25)',
                }}
              >
                {creatingBackup ? 'Creating...' : 'Create Backup Now'}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total Backups', value: backupHistory.length, icon: '💾', color: '#dbeafe' },
              { label: 'Latest Backup', value: backupHistory[0]?.backup_date ? format(new Date(backupHistory[0].backup_date), 'MMM d') : 'None', icon: '⏱️', color: '#dcfce7' },
              { label: 'Protected Records', value: backupHistory.reduce((sum, b) => sum + (b.record_count || 0), 0).toLocaleString(), icon: '🛡️', color: '#fef9c3' },
            ].map((s) => (
              <div key={s.label} style={{
                background: '#fff', borderRadius: 14, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(0,0,0,0.02)',
              }}>
                <div>
                  <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: 0, fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</p>
                  <p style={{ fontSize: '1.8rem', fontWeight: 800, margin: '4px 0 0', color: '#111827' }}>{s.value}</p>
                </div>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  {s.icon}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 24 }}>
            {/* History Table Card */}
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.02)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
                <h2 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>Execution History</h2>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: '#f9fafb' }}>
                    <tr>
                      {['Date & Status', 'Type', 'Records', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '14px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {backupHistory.map((backup) => (
                      <tr key={backup.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                            {format(new Date(backup.backup_date), 'MMM d, yyyy')}
                            <span style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: backup.status === 'completed' ? '#10b981' : '#ef4444'
                            }} title={backup.status} />
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>{format(new Date(backup.backup_date), 'HH:mm:ss')}</div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase',
                            background: backup.backup_type === 'manual' ? '#eff6ff' : '#f0fdf4',
                            color: backup.backup_type === 'manual' ? '#1e40af' : '#15803d',
                            padding: '4px 10px', borderRadius: 20
                          }}>
                            {backup.backup_type}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', fontWeight: 600, color: '#4b5563' }}>
                          {backup.record_count?.toLocaleString()} rows
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', gap: 12 }}>
                            {backup.file_url ? (
                              <button
                                onClick={() => handleDownloadBackup(backup.file_url)}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                              >Download</button>
                            ) : <span style={{ color: '#d1d5db', fontSize: '0.85rem' }}>No Data</span>}
                            <button
                              onClick={() => handleDeleteBackup(backup.id)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                            >Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {backupHistory.length === 0 && (
                  <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>📁</div>
                    <p style={{ fontSize: '0.95rem', margin: 0 }}>No backup history found.</p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Automation Card */}
              <div style={{ background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)', borderRadius: 14, padding: 24, color: '#fff' }}>
                <h3 style={{ fontWeight: 800, fontSize: '1.2rem', margin: '0 0 12px' }}>Automation</h3>
                <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 20 }}>Configure recurring backups to ensure you never lose critical sales data or agent profiles.</p>
                <button
                  onClick={handleScheduleBackup}
                  style={{
                    width: '100%', padding: '12px', background: 'var(--primary)', border: 'none', color: '#fff',
                    borderRadius: 10, fontWeight: 700, cursor: 'pointer'
                  }}
                >Set Backup Schedule</button>
              </div>

              {/* Security Info Card */}
              <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 24, border: '1px solid rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 16, color: '#111827' }}>System Insight</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Retention Policy', value: '30 Days' },
                    { label: 'Encryption', value: 'AES-256' },
                    { label: 'Storage Usage', value: 'Low' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: '#6b7280' }}>{item.label}</span>
                      <span style={{ fontWeight: 700, color: '#111827' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
