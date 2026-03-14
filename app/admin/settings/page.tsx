'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AdminSidebar from '@/components/AdminSidebar'
import toast from 'react-hot-toast'

export default function AdminSettingsPage() {
    const { profile, loading: authLoading } = useAuth()
    const router = useRouter()
    
    const [settings, setSettings] = useState({
        brand_name: '',
        company_name: '',
        registration_number: ''
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!authLoading && profile) {
            if (profile.role !== 'admin') {
                toast.error('Access denied.')
                router.push('/dashboard')
            } else {
                fetchSettings()
            }
        }
    }, [profile, authLoading])

    const fetchSettings = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/settings')
            const data = await res.json()
            if (data && !data.error) {
                setSettings({
                    brand_name: data.brand_name || '',
                    company_name: data.company_name || '',
                    registration_number: data.registration_number || ''
                })
            }
        } catch (err: any) {
            toast.error('Failed to load settings from table')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setSaving(true)
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })
            
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to update settings')
            
            toast.success('Site settings updated! Make sure site_settings table exists in Supabase.')
        } catch (err: any) {
            toast.error(err.message)
            toast.error('Did you run the CREATE TABLE sql snippet in Supabase?', { duration: 5000 })
        } finally {
            setSaving(false)
        }
    }

    if (loading || authLoading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
                <Navbar />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
                    <p>Loading site settings…</p>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            <div className="max-w-[1580px] mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row gap-6 md:gap-8">
                <AdminSidebar />
                <div className="flex-1 min-w-0">
                    <div className="mb-6">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 m-0">Footer & Site Settings</h1>
                        <p className="text-gray-500 mt-2 text-[0.9rem]">Update the professional display names for the website footer and privacy policy.</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-6 md:p-8 max-w-2xl">
                        <div className="mb-6 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-200">
                            <strong>Note:</strong> You must first run the SQL snippet in your Supabase SQL Editor to create the `site_settings` table. Ask your AI to provide the snippet if you haven't!
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Name (e.g., Oh!!MAMA)</label>
                                <input 
                                    type="text" 
                                    value={settings.brand_name}
                                    onChange={e => setSettings({...settings, brand_name: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                                    placeholder="Enter your system brand name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name (e.g., Sigi Food Industries Sdn. Bhd.)</label>
                                <input 
                                    type="text" 
                                    value={settings.company_name}
                                    onChange={e => setSettings({...settings, company_name: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                                    placeholder="Enter legal company name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Registration No. (e.g., 758837-A)</label>
                                <input 
                                    type="text" 
                                    value={settings.registration_number}
                                    onChange={e => setSettings({...settings, registration_number: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                                    placeholder="Enter company registration number"
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
