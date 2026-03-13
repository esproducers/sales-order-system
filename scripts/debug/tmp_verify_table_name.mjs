import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyTable() {
    console.log('Testing "products" table...');
    const { data, error } = await supabase.from('products').select('*').limit(1);

    if (error) {
        console.log('Error selecting from "products":', error.message);
        console.log('Error code:', error.code);

        console.log('\nTesting "Products" (quoted) table...');
        const { error: errorQuoted } = await supabase.from('"Products"').select('*').limit(1);
        if (errorQuoted) {
            console.log('Error selecting from "Products":', errorQuoted.message);
        } else {
            console.log('SUCCESS: Found "Products" (case sensitive)');
        }
    } else {
        console.log('SUCCESS: Table "products" exists.');
    }
}

verifyTable();
