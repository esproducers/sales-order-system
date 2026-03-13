'use server'

import { createClient } from '@supabase/supabase-js'

export async function createClientAdmin(clientData: any) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase service variables' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        console.log('Inserting client data:', clientData)
        const { data, error } = await supabase.from('clients').insert(clientData).select()
        if (error) {
            console.error('Supabase Client Insert Error:', error)
            return { error: error.message }
        }
        return { data }
    } catch (error: any) {
        console.error('Server Action Client Error:', error)
        return { error: error.message || 'Server error creating client' }
    }
}

export async function updateClientAdmin(clientId: string, agentId: string, clientData: any) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase service variables' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        console.log('Updating client data:', clientData)
        const { data, error } = await supabase.from('clients').update(clientData).eq('id', clientId).eq('agent_id', agentId).select()
        if (error) {
            console.error('Supabase Client Update Error:', error)
            return { error: error.message }
        }
        return { data }
    } catch (error: any) {
        console.error('Server Action Client Error:', error)
        return { error: error.message || 'Server error updating client' }
    }
}

export async function deleteClientAdmin(clientId: string, agentId: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase service variables' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        const { data, error } = await supabase.from('clients').delete().eq('id', clientId).eq('agent_id', agentId).select()
        if (error) {
            return { error: error.message }
        }
        return { data }
    } catch (error: any) {
        return { error: error.message || 'Server error deleting client' }
    }
}

export async function deactivateClientAdmin(clientId: string, agentId: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase service variables' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        const { data, error } = await supabase.from('clients').update({ is_active: false }).eq('id', clientId).eq('agent_id', agentId).select()
        if (error) {
            return { error: error.message }
        }
        return { data }
    } catch (error: any) {
        return { error: error.message || 'Server error deactivating client' }
    }
}

export async function activateClientAdmin(clientId: string, agentId: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase service variables' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        const { data, error } = await supabase.from('clients').update({ is_active: true }).eq('id', clientId).eq('agent_id', agentId).select()
        if (error) {
            return { error: error.message }
        }
        return { data }
    } catch (error: any) {
        return { error: error.message || 'Server error activating client' }
    }
}

export async function updateClientStatusAdmin(clientId: string, isActive: boolean) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase service variables' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        // Since is_active column is missing, we use a name prefix workaround
        const { data: client } = await supabase.from('clients').select('company_name').eq('id', clientId).single()
        let newName = client?.company_name || ''

        if (!isActive) {
            if (!newName.startsWith('(INACTIVE) ')) {
                newName = '(INACTIVE) ' + newName
            }
        } else {
            newName = newName.replace('(INACTIVE) ', '')
        }

        const { data, error } = await supabase.from('clients').update({ company_name: newName }).eq('id', clientId).select()
        if (error) return { error: error.message }
        return { data }
    } catch (error: any) {
        return { error: error.message || 'Server error updating client status' }
    }
}

export async function updateAgentStatusAdmin(agentId: string, isActive: boolean) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase service variables' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        const { data: profile } = await supabase.from('profiles').select('name').eq('id', agentId).single()
        let newName = profile?.name || ''

        if (!isActive) {
            if (!newName.startsWith('(INACTIVE) ')) {
                newName = '(INACTIVE) ' + newName
            }
        } else {
            newName = newName.replace('(INACTIVE) ', '')
        }

        const { data, error } = await supabase.from('profiles').update({ name: newName }).eq('id', agentId).select().single()
        if (error) return { error: error.message }
        return { data }
    } catch (error: any) {
        return { error: error.message || 'Server error updating status' }
    }
}

export async function getClientsAdmin(agentId: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase service variables' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        const { data, error } = await supabase.from('clients').select('*').eq('agent_id', agentId).order('created_at', { ascending: false })
        if (error) {
            return { error: error.message }
        }
        return { data }
    } catch (error: any) {
        return { error: error.message || 'Server error fetching clients' }
    }
}

export async function getClientsAdminDashboard(agentId: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase service variables' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        const { data, error } = await supabase.from('clients').select('id').eq('agent_id', agentId)
        if (error) {
            return { error: error.message }
        }
        return { data }
    } catch (error: any) {
        return { error: error.message || 'Server error fetching clients' }
    }
}

export async function getClientAdmin(clientId: string, agentId: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase service variables' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        const { data, error } = await supabase.from('clients').select('*').eq('id', clientId).eq('agent_id', agentId).single()
        if (error) {
            return { error: error.message }
        }
        return { data }
    } catch (error: any) {
        return { error: error.message || 'Server error fetching client' }
    }
}
