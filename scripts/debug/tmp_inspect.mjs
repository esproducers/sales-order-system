import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectTables() {
    console.log('--- Inspecting Tables ---');
    const tables = ['clients', 'profiles', 'products', 'product', 'orders'];
    for (const t of tables) {
        console.log(`Checking ${t}...`);
        const { data, error } = await supabase.from(t).select('*').limit(1);
        if (error) {
            console.log(`  ERROR on ${t}: ${error.code} - ${error.message}`);
        } else {
            console.log(`  SUCCESS on ${t}. Rows: ${data.length}`);
            if (data.length > 0) {
                console.log(`  Columns: ${Object.keys(data[0]).join(', ')}`);
            }
        }
    }
}

inspectTables();
