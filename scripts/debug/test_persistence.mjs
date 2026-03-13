import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function test() {
    const userId = "04f7603d-ac10-4111-a43f-b7c618aa5b42" // New Agent
    console.log('--- Testing deactivation for user:', userId)

    const { data: before } = await supabase.from('profiles').select('role').eq('id', userId).single()
    console.log('Before:', before)

    const { error: updateErr } = await supabase.from('profiles').update({ role: 'deactivated' }).eq('id', userId)
    if (updateErr) console.error('Update Error:', updateErr)
    else console.log('Update Success')

    const { data: after } = await supabase.from('profiles').select('role').eq('id', userId).single()
    console.log('After:', after)
}

test()
