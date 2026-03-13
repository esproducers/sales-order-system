'use server'

import { createClient } from '@supabase/supabase-js'

export async function getProfileAdmin(userId: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase service variables' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single()
        if (error) {
            return { error: error.message }
        }
        return { data }
    } catch (error: any) {
        return { error: error.message || 'Server error fetching profile' }
    }
}
