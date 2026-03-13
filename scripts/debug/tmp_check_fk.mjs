import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFK() {
    console.log('--- Checking Foreign Key Targets ---');
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError) {
        console.log('Profiles table error:', pError.message);
    } else {
        console.log('Profiles:', profiles.length, profiles);
    }

    const { data: clients, error: cError } = await supabase.from('clients').select('id, agent_id').limit(1);
    if (!cError && clients.length > 0) {
        console.log('Sample client:', clients[0]);
    }
}

checkFK();
