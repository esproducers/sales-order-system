import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkClientAgent() {
    console.log('--- Checking Clients with Agent ID ---');
    const { data: clients, error } = await supabase.from('clients').select('id, company_name, agent_id');
    if (error) {
        console.log('Error fetching clients:', error.message);
    } else {
        console.log('Clients count:', clients.length);
        for (const c of clients) {
            console.log(`Client ID: ${c.id}, Company: ${c.company_name}, Agent ID: ${c.agent_id}`);
        }
    }
}

checkClientAgent();
