import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
    const tables = ['items', 'inventory', 'Products', 'Product', 'products'];
    for (const table of tables) {
        console.log(`Checking table: ${table}`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`  Error: ${error.message} (${error.code})`);
        } else {
            console.log(`  SUCCESS! Data: ${JSON.stringify(data)}`);
        }
    }
}
checkTables();
