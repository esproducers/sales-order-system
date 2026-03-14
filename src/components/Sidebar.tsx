'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface SidebarProps {
    totalCommission?: number
}

export default function Sidebar({ totalCommission = 0 }: SidebarProps) {
    const { user, profile } = useAuth()
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    const navItems = [
        { label: 'My Profile', icon: '👤', href: '/profile' },
        { label: 'My Client', icon: '🏢', href: '/clients' },
        { label: 'My Orders', icon: '📦', href: '/orders' },
        { label: 'My Sales', icon: '💰', href: '/sales' },
        {
            label: 'My Commission',
            icon: '🎫',
            href: '/commission',
            badge: totalCommission > 0 ? `RM ${totalCommission.toFixed(0)}` : undefined
        },
        { label: 'Account Settings', icon: '⚙️', href: '/settings' },
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
                        <span>☰</span> Menu
                    </span>
                    <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
                </button>
            </div>

            {/* Sidebar Content (Toggled on mobile, always visible on desktop) */}
            <div className={`${isOpen ? 'block' : 'hidden'} md:block mb-6 md:mb-0`}>
                {/* Profile card */}
                <div className="bg-white rounded-xl p-4 mb-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shrink-0">
                        {(profile?.name || user?.user_metadata?.full_name || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <div className="font-bold text-[0.95rem] overflow-hidden text-ellipsis whitespace-nowrap text-gray-900">
                            {profile?.name || user?.user_metadata?.full_name || 'User'}
                        </div>
                        <div className="text-[0.78rem] text-gray-500 capitalize">{profile?.role}</div>
                    </div>
                </div>

                {/* Nav menu */}
                <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                    {navItems.map((item) => {
                        const active = pathname === item.href
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center justify-between px-4 py-[13px] text-sm transition-colors border-b border-gray-50 last:border-0 ${
                                    active
                                        ? 'bg-primary text-white font-semibold'
                                        : 'bg-white text-gray-700 font-normal hover:bg-gray-50'
                                }`}
                            >
                                <span className="flex items-center gap-2.5">
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    {item.badge && (
                                        <span className={`text-[0.7rem] font-bold px-2 py-0.5 rounded-full ${
                                            active ? 'bg-white/25 text-white' : 'bg-primary-light text-primary-dark'
                                        }`}>
                                            {item.badge}
                                        </span>
                                    )}
                                    <span className="opacity-50 text-[0.75rem]">›</span>
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </aside>
    )
}
