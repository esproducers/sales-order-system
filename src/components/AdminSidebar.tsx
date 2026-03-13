'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'

export default function AdminSidebar() {
    const { user, profile } = useAuth()
    const pathname = usePathname()

    const navItems = [
        { label: 'Admin Dashboard', icon: '📊', href: '/admin' },
        { label: 'Orders Analysis', icon: '📦', href: '/admin/orders' },
        { label: 'Agent Management', icon: '👨‍💼', href: '/admin/agent' },
        { label: 'Client Management', icon: '🏢', href: '/admin/clients' },
        { label: 'Admin Management', icon: '👤', href: '/admin/admins' },
        { label: 'Backup & Restore', icon: '💾', href: '/admin/backup' },
    ]

    return (
        <aside style={{ width: 240, flexShrink: 0 }}>
            {/* Admin Profile card */}
            <div
                style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: '20px 16px',
                    marginBottom: 12,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    borderLeft: '4px solid #111827' // Recognition for admin
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: '#111827',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '1.2rem',
                        }}
                    >
                        {(profile?.name || user?.user_metadata?.full_name || 'A')[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {profile?.name || user?.user_metadata?.full_name || 'Admin'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600 }}>System Administrator</div>
                    </div>
                </div>
            </div>

            {/* Admin Nav menu */}
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
                                background: active ? '#111827' : '#fff',
                                color: active ? '#fff' : '#374151',
                                borderBottom: '1px solid #f3f4f6',
                                fontSize: '0.875rem',
                                fontWeight: active ? 600 : 400,
                                transition: 'all 0.15s',
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </span>
                            <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>›</span>
                        </Link>
                    )
                })}
            </div>

            {/* Return to Agent View */}
            <Link
                href="/dashboard"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginTop: 12,
                    padding: '12px 16px',
                    background: '#fff',
                    borderRadius: 12,
                    color: 'var(--primary-dark)',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    border: '1px solid var(--primary-light)'
                }}
            >
                <span>⬅️</span>
                <span>Agent Dashboard</span>
            </Link>
        </aside>
    )
}
