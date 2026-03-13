import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery() {
    const { data, error } = await supabase.from('clients').select('id').eq('agent_id', 'db61bfa2-37ca-4139-8692-fd0cfcedd598');
    console.log('Query:', error ? error.message : 'success', data);
}
testQuery();
