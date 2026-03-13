import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
    console.log('--- Auth Users (via Service Role) ---');
    const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();
    if (uError) console.error('Auth error:', uError.message);
    else console.log('Users count:', users.length, users.map(u => ({ id: u.id, email: u.email })));

    console.log('\n--- Profiles Table ---');
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError) console.error('Profiles error:', pError.message);
    else console.log(profiles);

    console.log('\n--- Clients Table ---');
    const { data: clients, error: cError } = await supabase.from('clients').select('*');
    if (cError) console.error('Clients error:', cError.message);
    else console.log(clients);

    console.log('\n--- Products Table ---');
    const { data: products, error: prError } = await supabase.from('products').select('*');
    if (prError) console.error('Products error:', prError.message);
    else console.log(products);
}

checkData();
