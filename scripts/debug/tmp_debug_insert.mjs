import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function tryInsert() {
    console.log('Attempting to insert dummy product...');
    const { data, error } = await supabase.from('products').insert([{ name: 'Test', price_per_ctn: 0, units_per_ctn: 1 }]);
    if (error) {
        console.log('FULL ERROR:', JSON.stringify(error, null, 2));
    } else {
        console.log('SUCCESS!');
    }
}
tryInsert();
