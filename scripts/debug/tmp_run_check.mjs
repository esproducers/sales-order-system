import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
    const results = {};

    try {
        const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();
        results.users = uError ? { error: uError.message } : users.map(u => ({ id: u.id, email: u.email }));

        const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
        results.profiles = pError ? { error: pError.message } : (profiles || []);

        const { data: clients, error: cError } = await supabase.from('clients').select('*');
        results.clients = cError ? { error: cError.message } : (clients || []);

        const { data: products, error: prError } = await supabase.from('products').select('*');
        results.products = prError ? { error: prError.message } : (products || []);

        fs.writeFileSync('tmp_full_data.json', JSON.stringify(results, null, 2));
        console.log('Results written to tmp_full_data.json');
    } catch (e) {
        console.error('Fatal check error:', e);
    }
}

checkData();
