import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStorage() {
    console.log('--- Checking Storage Buckets ---');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error('Storage error:', error.message);
    } else {
        console.log('Buckets:', buckets.map(b => b.name).join(', '));
    }
}

checkStorage();
