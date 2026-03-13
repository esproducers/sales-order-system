'use server'

import { createClient } from '@supabase/supabase-js'

import nodemailer from 'nodemailer'

export async function createAgentAdmin(agentData: { email: string, name: string, phone: string, commission_rate: number }) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const emailUser = process.env.EMAIL_USER
    const emailPass = process.env.EMAIL_PASS
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase service variables' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    try {
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: agentData.email,
            password: 'temporary123',
            email_confirm: true,
            user_metadata: { name: agentData.name }
        })

        if (authError) return { error: authError.message }

        // 2. Create Profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
                user_id: authData.user.id,
                name: agentData.name,
                email: agentData.email,
                phone: agentData.phone,
                role: 'agent',
                commission_rate: agentData.commission_rate,
            }])

        if (profileError) return { error: profileError.message }

        // 3. Send Email Notification if Nodemailer is configured
        if (emailUser && emailPass) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: emailUser,
                    pass: emailPass,
                },
            })

            await transporter.sendMail({
                from: `"OhMAMA Sales" <${emailUser}>`,
                to: agentData.email,
                subject: 'Welcome to OhMAMA Sales System!',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; border-top: 5px solid #2ebd8e;">
                        <div style="background: #2ebd8e; padding: 40px 20px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 24px;">Welcome, ${agentData.name}!</h1>
                        </div>
                        <div style="padding: 30px; line-height: 1.6; color: #374151;">
                            <p>You have been added as an agent to the <strong>OhMAMA Sales Order System</strong>.</p>
                            <p>Here are your login credentials:</p>
                            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;">
                                <p style="margin: 0;"><strong>Email:</strong> ${agentData.email}</p>
                                <p style="margin: 8px 0 0;"><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">temporary123</code></p>
                            </div>
                            <p>Please log in and change your password as soon as possible.</p>
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="${siteUrl}/login" style="background: #2ebd8e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Login to Dashboard</a>
                            </div>
                        </div>
                        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
                            © 2026 OhMAMA Sales. All rights reserved.
                        </div>
                    </div>
                `
            })
        }

        return { success: true, data: authData.user }
    } catch (error: any) {
        console.error('Email send error:', error)
        // We still return success if the user was created even if email failed
        return { success: true, warning: 'Agent created but email failed to send. Please provide credentials manually.' }
    }
}

export async function updateAgentAdmin(agentId: string, updates: { name?: string; phone?: string; commission_rate?: number; role?: string }) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase service variables' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    try {
        console.log('Admin updating profile:', agentId, updates)
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', agentId)
            .select()
            .single()

        if (error) {
            console.error('Supabase Profile Update Error:', error)
            return { error: error.message }
        }
        return { data }
    } catch (error: any) {
        console.error('Catch-all updateAgentAdmin Error:', error)
        return { error: error.message || 'Server error updating agent' }
    }
}
