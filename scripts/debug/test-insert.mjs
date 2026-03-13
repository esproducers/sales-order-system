import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
    const { data, error } = await supabase.from('clients').insert({
        company_name: 'Test Client',
        agent_id: 'db61bfa2-37ca-4139-8692-fd0cfcedd598' // guessing an ID or it doesn't matter, just trying to trigger RLS
    });
    console.log('Insert:', error ? error.message : 'success');
}
testInsert();
