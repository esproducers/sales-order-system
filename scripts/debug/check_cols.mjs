import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    console.log('--- Profiles Columns ---')
    const { data: pData, error: pErr } = await supabase.from('profiles').select('*').limit(1)
    if (pErr) console.error(pErr)
    else console.log(Object.keys(pData[0] || {}))

    console.log('\n--- Clients Columns ---')
    const { data: cData, error: cErr } = await supabase.from('clients').select('*').limit(1)
    if (cErr) console.error(cErr)
    else console.log(Object.keys(cData[0] || {}))
}

check()
