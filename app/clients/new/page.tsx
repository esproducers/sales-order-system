'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createClientAdmin } from '@/actions/clients'

export default function NewClientPage() {
  const { profile } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [formData, setFormData] = useState({
    company_name: '',
    ssm_id: '',
    tin_id: '',
    address: '',
    company_phone: '',
    contact_phone: '',
  })
  const [ssmFile, setSsmFile] = useState<File | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        toast.error('Please upload a PDF, JPG, or PNG file')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      setSsmFile(file)
    }
  }

  const uploadSSMFile = async (): Promise<string | null> => {
    if (!ssmFile || !profile) return null
    try {
      setUploadingFile(true)
      const fileExt = ssmFile.name.split('.').pop()
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('ssm-files').upload(fileName, ssmFile)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('ssm-files').getPublicUrl(fileName)
      return publicUrl
    } catch (error: any) {
      toast.error('Failed to upload SSM file')
      return null
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id) {
      toast.error('Your profile is still loading. Please try again in a moment.')
      return
    }

    setLoading(true)
    try {
      const ssmFileUrl = ssmFile ? await uploadSSMFile() : null
      const clientData = {
        ...formData,
        agent_id: profile.id,
        ssm_file_url: ssmFileUrl,
      }

      const { error } = await createClientAdmin(clientData)

      if (error) throw new Error(error)
      toast.success('Client added successfully!')
      router.push('/clients')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add client')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #d1d5db',
    borderRadius: 8,
    fontSize: '0.875rem',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontWeight: 500,
    fontSize: '0.875rem',
    color: '#374151',
    marginBottom: 6,
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading your profile... Please wait.</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Add New Client</h1>
            <p style={{ color: '#6b7280', marginTop: 6, fontSize: '0.875rem' }}>
              Enter client company details
            </p>
          </div>
          <Link
            href="/clients"
            style={{
              padding: '9px 20px',
              border: '1.5px solid #d1d5db',
              borderRadius: 8,
              textDecoration: 'none',
              color: '#374151',
              fontWeight: 500,
              fontSize: '0.875rem',
            }}
          >
            ← Back to Clients
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'flex-start' }}>
          {/* ── Main form card ── */}
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>Client Information</h2>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Company Name */}
              <div>
                <label style={labelStyle}>Company Name *</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="e.g., ABC Sdn Bhd"
                  required
                />
              </div>

              {/* SSM + TIN */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>SSM ID</label>
                  <input
                    type="text"
                    name="ssm_id"
                    value={formData.ssm_id}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="e.g., 1234567-X"
                  />
                </div>
                <div>
                  <label style={labelStyle}>TIN ID</label>
                  <input
                    type="text"
                    name="tin_id"
                    value={formData.tin_id}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="e.g., TIN-1234567"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label style={labelStyle}>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder="Full company address"
                />
              </div>

              {/* Phones */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Company Phone</label>
                  <input
                    type="tel"
                    name="company_phone"
                    value={formData.company_phone}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="e.g., +603-1234 5678"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Contact Person Phone</label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="e.g., +6012-345 6789"
                  />
                </div>
              </div>

              {/* SSM Upload */}
              <div>
                <label style={labelStyle}>SSM Document (Optional)</label>
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    padding: '28px 20px',
                    border: '2px dashed',
                    borderColor: ssmFile ? 'var(--primary)' : '#d1d5db',
                    borderRadius: 10,
                    background: ssmFile ? 'var(--primary-light)' : '#fafafa',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>{ssmFile ? '📄' : '📁'}</span>
                  <div style={{ textAlign: 'center' }}>
                    {ssmFile ? (
                      <>
                        <div style={{ fontWeight: 600, color: 'var(--primary-dark)', fontSize: '0.875rem' }}>
                          ✓ {ssmFile.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>
                          Click to change file
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 600, color: 'var(--primary-dark)', fontSize: '0.875rem' }}>
                          Click to upload a file
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>
                          PDF, JPG, or PNG up to 5MB
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </label>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                <button
                  type="button"
                  onClick={() => router.back()}
                  style={{
                    padding: '10px 24px',
                    border: '1.5px solid #d1d5db',
                    background: '#fff',
                    borderRadius: 8,
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    color: '#374151',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingFile}
                  style={{
                    padding: '10px 28px',
                    background: (loading || uploadingFile) ? '#9ca3af' : 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: (loading || uploadingFile) ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  {loading ? 'Adding Client…' : uploadingFile ? 'Uploading…' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>

          {/* ── Right: Tips card ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                padding: 20,
                borderLeft: '4px solid var(--primary)',
              }}
            >
              <h3 style={{ fontWeight: 700, fontSize: '0.9rem', margin: '0 0 12px', color: '#111827' }}>
                📝 Tips for adding clients
              </h3>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Fill in as much information as possible for better record keeping',
                  'Upload SSM documents for verification purposes',
                  'You can always edit client information later',
                  'All clients will be linked to your agent profile',
                ].map((tip) => (
                  <li key={tip} style={{ display: 'flex', gap: 8, fontSize: '0.8rem', color: '#374151', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Required fields note */}
            <div
              style={{
                background: 'var(--primary-light)',
                borderRadius: 12,
                padding: 16,
                fontSize: '0.8rem',
                color: 'var(--primary-darker)',
                lineHeight: 1.6,
              }}
            >
              <strong>* Required field</strong>
              <br />
              Only company name is mandatory. All other fields are optional but recommended.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}