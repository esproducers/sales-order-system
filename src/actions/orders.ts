'use server'

import { createClient } from '@supabase/supabase-js'

export async function createOrderAdmin(orderData: any) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase service variables' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        const { data, error } = await supabase.from('orders').insert(orderData).select()
        if (error) {
            return { error: error.message }
        }
        return { data }
    } catch (error: any) {
        return { error: error.message || 'Server error creating order' }
    }
}

export async function getRecentOrdersAdmin(clientId: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase service variables' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(5)
        if (error) {
            return { error: error.message }
        }
        return { data }
    } catch (error: any) {
        return { error: error.message || 'Server error fetching recent orders' }
    }
}

export async function updateOrderStatusAdmin(orderId: string, status: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase service variables' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId)
        if (error) {
            return { error: error.message }
        }
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Server error updating order status' }
    }
}

export async function deleteOrderAdmin(orderId: string, agentId?: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase service variables' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        let query = supabase.from('orders').delete().eq('id', orderId)
        if (agentId) {
            query = query.eq('agent_id', agentId)
        }

        const { data, error } = await query.select()
        if (error) return { error: error.message }
        if (!data || data.length === 0) return { error: 'No order found or already deleted' }
        return { success: true, data }
    } catch (error: any) {
        return { error: error.message || 'Server error deleting order' }
    }
}
