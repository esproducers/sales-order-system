'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import toast from 'react-hot-toast'

export default function SettingsPage() {
    const { loading: authLoading } = useAuth()
    const { fontSize, setFontSize } = useTheme()

    if (authLoading) return <div className="p-20 text-center">Loading…</div>

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="max-w-[1580px] mx-auto px-4 sm:px-6 py-8 w-full flex flex-col md:flex-row gap-6 md:gap-8 flex-1">
                <Sidebar />
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 mt-0">Account Settings</h1>
                    <p className="text-gray-500 mb-6 md:mb-8 text-sm md:text-base">Manage your application preferences</p>

                    <div className="flex flex-col gap-6">
                        {/* App Customization Section */}
                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 mb-8">
                            <h2 className="text-lg md:text-xl font-extrabold mb-6 pb-3 border-b-2 border-primary-light text-gray-900 mt-0">App Word Size (Font Size)</h2>
                            <p className="text-gray-500 mb-5 text-sm md:text-base">Adjust the overall readability of the application.</p>

                            <div className="flex flex-col sm:flex-row gap-4 md:gap-5 w-full">
                                {(['small', 'medium', 'large'] as const).map((size) => {
                                    const active = fontSize === size;
                                    return (
                                        <button
                                            key={size}
                                            onClick={() => {
                                                setFontSize(size);
                                                toast.success(`${size.charAt(0).toUpperCase() + size.slice(1)} text enabled`);
                                            }}
                                            className={`
                                                flex-1 py-4 px-6 md:px-8 rounded-xl font-extrabold border-2 cursor-pointer transition-colors shadow-sm
                                                capitalize shrink-0
                                                ${active
                                                    ? 'bg-primary-light border-primary text-primary-dark'
                                                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                                                }
                                            `}
                                            style={{
                                                fontSize: size === 'small' ? '0.85rem' : size === 'medium' ? '1rem' : '1.15rem'
                                            }}
                                        >
                                            {size === 'small' ? 'Small' : size === 'medium' ? 'Normal' : 'Large'}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
