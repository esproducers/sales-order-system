import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkClients() {
    const { data, error } = await supabase.from('clients').select('id, company_name, agent_id').order('created_at', { ascending: false }).limit(5);
    console.log('Clients:', data);
}
checkClients();
