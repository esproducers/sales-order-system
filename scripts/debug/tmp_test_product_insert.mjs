import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInsertProduct() {
    console.log('--- Testing Product Insertion ---');
    const { data, error } = await supabase.from('products').insert({
        name: 'Test Product ' + Date.now(),
        price_per_ctn: 100,
        units_per_ctn: 10,
        photo_url: ''
    }).select();

    if (error) {
        console.error('Insert Error:', error.message, error.code, error.details);
    } else {
        console.log('Insert Success! Created ID:', data[0].id);
    }
}

testInsertProduct();
