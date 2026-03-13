import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findProducts() {
    console.log('--- Scanning for Products Table ---');
    const tables = ['products', 'product', 'items', 'inventory', 'Inventory', 'Products', 'Product'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (!error) {
            console.log(`FOUND table: "${table}"`);
        } else {
            // console.log(`Table "${table}" not found: ${error.message}`);
        }
    }
}

findProducts();
