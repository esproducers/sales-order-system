'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'

interface SidebarProps {
    totalCommission?: number
}

export default function Sidebar({ totalCommission = 0 }: SidebarProps) {
    const { user, profile } = useAuth()
    const pathname = usePathname()

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
        <aside style={{ width: 240, flexShrink: 0 }}>
            {/* Profile card */}
            <div
                style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: '20px 16px',
                    marginBottom: 12,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '1.2rem',
                        }}
                    >
                        {(profile?.name || user?.user_metadata?.full_name || 'U')[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {profile?.name || user?.user_metadata?.full_name || 'User'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#6b7280', textTransform: 'capitalize' }}>{profile?.role}</div>
                    </div>
                </div>
            </div>

            {/* Nav menu */}
            <div
                style={{
                    background: '#fff',
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
            >
                {navItems.map((item) => {
                    const active = pathname === item.href
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '13px 16px',
                                textDecoration: 'none',
                                background: active ? 'var(--primary)' : '#fff',
                                color: active ? '#fff' : '#374151',
                                borderBottom: '1px solid #f3f4f6',
                                fontSize: '0.875rem',
                                fontWeight: active ? 600 : 400,
                                transition: 'background 0.15s',
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {item.badge && (
                                    <span
                                        style={{
                                            background: active ? 'rgba(255,255,255,0.25)' : 'var(--primary-light)',
                                            color: active ? '#fff' : 'var(--primary-dark)',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: 20,
                                        }}
                                    >
                                        {item.badge}
                                    </span>
                                )}
                                <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>›</span>
                            </span>
                        </Link>
                    )
                })}
            </div>
        </aside>
    )
}
