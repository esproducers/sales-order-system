import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase.from('orders').select('*').limit(1);
    if (!error) {
        if (data.length > 0) {
            console.log('Orders columns:', Object.keys(data[0]));
        } else {
            // Try to find columns by inserting dummy
            const { error: err2 } = await supabase.from('orders').insert([{}]).select();
            console.log('Insert attempt error (to see columns):', err2?.message);
            // If we can't see columns, we assume it's blank or we need to add them
        }
    } else {
        console.log('Error for orders:', error.message);
    }
}
check();
