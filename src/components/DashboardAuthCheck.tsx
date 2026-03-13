'use client'

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardAuthCheck() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data, error } = await supabase.auth.getUser();
                if (error) {
                    console.error("Auth error:", error);
                } else {
                    console.log("Current user session check:", data.user);
                    setUser(data.user);
                }
            } catch (err) {
                console.error("Check user error:", err);
            } finally {
                setLoading(false);
            }
        };

        checkUser();
    }, []);

    if (loading) return (
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 14, height: 14, border: '2px solid #e2e8f0', borderTop: '2px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Verifying auth session...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{
            padding: '16px 20px',
            background: user ? 'rgba(46, 189, 142, 0.05)' : 'rgba(239, 68, 68, 0.05)',
            borderRadius: 12,
            border: `1.5px solid ${user ? 'var(--primary-dark)' : '#ef4444'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            marginBottom: 20
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1rem' }}>{user ? '🔒' : '⚠️'}</span>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: user ? 'var(--primary-dark)' : '#ef4444' }}>
                    Auth Verification Status
                </h4>
                <div style={{
                    marginLeft: 'auto',
                    padding: '2px 8px',
                    borderRadius: 20,
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    background: user ? 'var(--primary-dark)' : '#ef4444',
                    color: '#fff'
                }}>
                    {user ? 'Authenticated' : 'No Session'}
                </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: user ? '#374151' : '#b91c1c', marginTop: 4 }}>
                {user ? (
                    <>
                        Current User UUID: <code style={{ background: 'rgba(255,255,255,0.6)', padding: '2px 4px', borderRadius: 4, fontWeight: 700, fontFamily: 'monospace' }}>{user.id}</code>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
                            Token is active. RLS will identify this user as <code style={{ fontWeight: 600 }}>auth.uid()</code>.
                        </div>
                    </>
                ) : (
                    <>
                        No user logged in. Supabase RLS will treat this request as <code style={{ fontWeight: 700 }}>NULL</code>.
                        <div style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: 4 }}>
                            Please check your login flow or provider configuration.
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
