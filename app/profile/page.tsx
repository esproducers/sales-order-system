'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import toast from 'react-hot-toast'
import { updateAgentAdmin } from '@/actions/agents'

export default function ProfilePage() {
    const { profile, loading: authLoading } = useAuth()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
    })

    useEffect(() => {
        if (profile) {
            setForm({
                name: profile.name || '',
                phone: profile.phone || '',
                email: profile.email || '',
            })
        }
    }, [profile])

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile?.id) return
        try {
            setLoading(true)
            const { error: serverError } = await updateAgentAdmin(profile.id, {
                name: form.name,
                phone: form.phone,
            })

            if (serverError) throw new Error(serverError)

            toast.success('Profile updated successfully! Refreshing...')
            window.location.reload()
        } catch (err: any) {
            toast.error('Failed to update profile: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    if (authLoading) return <div className="p-20 text-center">Loading…</div>

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="max-w-[1580px] mx-auto px-4 sm:px-6 py-8 w-full flex flex-col md:flex-row gap-6 md:gap-8 flex-1">
                <Sidebar />
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 mt-0">My Profile</h1>
                    <p className="text-gray-500 mb-6 md:mb-8 text-sm md:text-base">Manage your profile and account information</p>

                    <div className="flex flex-col gap-6">
                        {/* Profile Section */}
                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100">
                            <h2 className="text-lg md:text-xl font-extrabold mb-6 pb-3 border-b-2 border-primary-light text-gray-900 mt-0">My Profile Details</h2>
                            <form onSubmit={handleUpdateProfile}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-gray-700">Full Name</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            className="w-full p-3 rounded-xl border-2 border-gray-200 outline-none focus:border-primary transition-colors bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-gray-700">Phone Number</label>
                                        <input
                                            type="text"
                                            value={form.phone}
                                            onChange={e => setForm({ ...form, phone: e.target.value })}
                                            className="w-full p-3 rounded-xl border-2 border-gray-200 outline-none focus:border-primary transition-colors bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-gray-700">Email Address</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            disabled
                                            className="w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-gray-700">Agent Role</label>
                                        <input
                                            type="text"
                                            value={profile?.role || ''}
                                            disabled
                                            className="w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed outline-none capitalize"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full md:w-auto px-8 py-3.5 bg-primary hover:bg-primary-dark text-white border-none rounded-xl font-extrabold cursor-pointer shadow-[0_4px_12px_rgba(46,189,142,0.2)] transition-colors"
                                >
                                    {loading ? 'Updating...' : 'Save Profile Changes'}
                                </button>
                            </form>
                        </div>

                        {/* Commissions Section */}
                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 mb-8">
                            <h2 className="text-lg md:text-xl font-extrabold mb-6 pb-3 border-b-2 border-primary-light text-gray-900 mt-0">Earning Details</h2>
                            <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center">
                                <div className="w-full md:w-auto text-center bg-primary-light p-6 md:px-12 md:py-6 rounded-2xl shrink-0">
                                    <div className="text-xs md:text-sm text-primary-dark font-extrabold uppercase tracking-wide mb-1">Commission Rate</div>
                                    <div className="text-4xl md:text-5xl font-black text-primary-dark">{profile?.commission_rate || 0}%</div>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <p className="m-0 text-gray-600 text-sm md:text-base leading-relaxed">
                                        Your commission is calculated on the total sales amount of every order you place.
                                        Rates are determined by the administrator based on your performance and history.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
