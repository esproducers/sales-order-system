import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function carefulScan() {
    const table = 'products';
    console.log(`--- Carefully checking table: ${table} ---`);
    const { data, error, status, statusText } = await supabase.from(table).select('*').limit(1);
    console.log('Status:', status, statusText);
    if (error) {
        console.log('Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Success! Data:', data);
    }
}

carefulScan();
