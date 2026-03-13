import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listSchema() {
    console.log('--- Listing All Tables ---');
    // Using RPC to query if enabled, otherwise raw select
    const { data, error } = await supabase.from('pg_tables').select('tablename').eq('schemaname', 'public');
    if (error) {
        console.log('Error querying pg_tables (as expected if RLS on system schema):', error.message);
        // Fallback: try common names to deduce schema structure
        const guesses = ['profiles', 'clients', 'products', 'product', 'orders', 'items'];
        for (const g of guesses) {
            const { error: e } = await supabase.from(g).select('*', { count: 'exact', head: true });
            console.log(`Table "${g}" exists? ${e ? 'NO: ' + e.message : 'YES'}`);
        }
    } else {
        console.log('Tables:', data.map(t => t.tablename).join(', '));
    }
}

listSchema();
