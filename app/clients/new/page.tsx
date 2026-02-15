'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      // 验证文件类型
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a PDF, JPG, or PNG file')
        return
      }
      // 验证文件大小 (5MB)
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
      
      const { error: uploadError } = await supabase.storage
        .from('ssm-files')
        .upload(fileName, ssmFile)

      if (uploadError) throw uploadError

      // 获取公共URL
      const { data: { publicUrl } } = supabase.storage
        .from('ssm-files')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error: any) {
      console.error('Error uploading file:', error)
      toast.error('Failed to upload SSM file')
      return null
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.company_name.trim()) {
      toast.error('Company name is required')
      return
    }

    setLoading(true)

    try {
      let ssmFileUrl = null
      if (ssmFile) {
        ssmFileUrl = await uploadSSMFile()
      }

      const { error } = await supabase.from('clients').insert({
        ...formData,
        agent_id: profile?.id,
        ssm_file_url: ssmFileUrl,
      })

      if (error) throw error

      toast.success('Client added successfully!')
      router.push('/clients')
    } catch (error: any) {
      console.error('Error adding client:', error)
      toast.error(error.message || 'Failed to add client')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Add New Client</h1>
            <p className="text-gray-600 mt-2">Enter client company details</p>
          </div>

          <div className="bg-white rounded-xl shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Client Information</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Company Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., ABC Sdn Bhd"
                  required
                />
              </div>

              {/* Registration Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SSM ID
                  </label>
                  <input
                    type="text"
                    name="ssm_id"
                    value={formData.ssm_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 1234567-X"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TIN ID
                  </label>
                  <input
                    type="text"
                    name="tin_id"
                    value={formData.tin_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., TIN-1234567"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Full company address"
                />
              </div>

              {/* Contact Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Phone
                  </label>
                  <input
                    type="tel"
                    name="company_phone"
                    value={formData.company_phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., +603-1234 5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person Phone
                  </label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., +6012-345 6789"
                  />
                </div>
              </div>

              {/* SSM File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SSM Document (Optional)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <div className="text-gray-400">
                      {ssmFile ? '📄' : '📁'}
                    </div>
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                        <span>{ssmFile ? ssmFile.name : 'Upload a file'}</span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, JPG, or PNG up to 5MB
                    </p>
                  </div>
                </div>
                {ssmFile && (
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <span className="mr-1">✓</span>
                    File selected: {ssmFile.name}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="pt-6 border-t border-gray-200 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingFile}
                  className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding Client...' : 
                   uploadingFile ? 'Uploading File...' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>

          {/* Help Text */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">📝 Tips for adding clients:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Fill in as much information as possible for better record keeping</li>
              <li>• Upload SSM documents for verification purposes</li>
              <li>• You can always edit client information later</li>
              <li>• All clients will be linked to your agent profile</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}