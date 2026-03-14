'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function AdminSidebar() {
    const { user, profile } = useAuth()
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    const navItems = [
        { label: 'Admin Dashboard', icon: '📊', href: '/admin' },
        { label: 'Orders Analysis', icon: '📦', href: '/admin/orders' },
        { label: 'Client Management', icon: '🏢', href: '/admin/clients' },
        { label: 'Agent Management', icon: '👨‍💼', href: '/admin/agent' },
        { label: 'Admin Management', icon: '👤', href: '/admin/admins' },
        { label: 'Backup & Restore', icon: '💾', href: '/admin/backup' },
        { label: 'Site Settings', icon: '⚙️', href: '/admin/settings' },
    ]

    return (
        <aside className="w-full md:w-[240px] shrink-0">
            {/* Mobile Dropdown Toggle (Hidden on desktop) */}
            <div className="md:hidden mb-4">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100 text-gray-700 font-semibold"
                >
                    <span className="flex items-center gap-2">
                        <span>☰</span> Admin Menu
                    </span>
                    <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
                </button>
            </div>

            {/* Sidebar Content (Toggled on mobile, always visible on desktop) */}
            <div className={`${isOpen ? 'block' : 'hidden'} md:block mb-6 md:mb-0`}>
                {/* Admin Profile card */}
                <div className="bg-white rounded-xl p-4 mb-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border-l-4 border-gray-900 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
                        {(profile?.name || user?.user_metadata?.full_name || 'A')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <div className="font-bold text-[0.95rem] overflow-hidden text-ellipsis whitespace-nowrap text-gray-900">
                            {profile?.name || user?.user_metadata?.full_name || 'Admin'}
                        </div>
                        <div className="text-[0.78rem] text-gray-500 font-semibold">System Administrator</div>
                    </div>
                </div>

                {/* Admin Nav menu */}
                <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                    {navItems.map((item) => {
                        const active = pathname === item.href
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center justify-between px-4 py-[13px] text-sm transition-all border-b border-gray-50 last:border-0 ${
                                    active
                                        ? 'bg-gray-900 text-white font-semibold'
                                        : 'bg-white text-gray-700 font-normal hover:bg-gray-50'
                                }`}
                            >
                                <span className="flex items-center gap-2.5">
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </span>
                                <span className="opacity-50 text-[0.75rem]">›</span>
                            </Link>
                        )
                    })}
                </div>

                {/* Return to Agent View */}
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 mt-3 px-4 py-3 bg-white rounded-xl text-primary-dark font-semibold text-[0.85rem] shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-primary-light transition-colors hover:bg-gray-50"
                >
                    <span>⬅️</span>
                    <span>Agent Dashboard</span>
                </Link>
            </div>
        </aside>
    )
}
