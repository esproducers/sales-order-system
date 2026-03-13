'use server'

import { createClient } from '@supabase/supabase-js'

export async function createProductAdmin(productData: any) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase service variables' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        console.log('Inserting product data:', productData)
        const { data, error } = await supabase.from('products').insert(productData).select()
        if (error) {
            console.error('Supabase Product Insert Error:', error)
            return { error: error.message }
        }
        return { data }
    } catch (error: any) {
        console.error('Server Action Product Error:', error)
        return { error: error.message || 'Server error creating product' }
    }
}

export async function updateProductAdmin(productId: string, productData: any) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase service variables' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        const { data, error } = await supabase.from('products').update(productData).eq('id', productId).select()
        if (error) {
            return { error: error.message }
        }
        return { data }
    } catch (error: any) {
        return { error: error.message || 'Server error updating product' }
    }
}

export async function deleteProductAdmin(productId: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase service variables' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        const { data, error } = await supabase.from('products').delete().eq('id', productId).select()
        if (error) {
            return { error: error.message }
        }
        return { data }
    } catch (error: any) {
        return { error: error.message || 'Server error deleting product' }
    }
}

export async function getProductsAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase service variables' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true })
        if (error) {
            return { error: error.message }
        }
        return { data }
    } catch (error: any) {
        return { error: error.message || 'Server error fetching products' }
    }
}
