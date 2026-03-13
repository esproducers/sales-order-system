import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finalRepair() {
    console.log('--- Final Repair ---');

    // 1. Get profile
    const { data: profiles } = await supabase.from('profiles').select('id, user_id');
    if (!profiles || profiles.length === 0) {
        console.log('STILL NO PROFILES! Check table name or creation.');
        return;
    }
    const profileId = profiles[0].id;
    console.log(`Using Profile ID: ${profileId}`);

    // 2. Link clients
    console.log('Linking clients to profile...');
    const { error } = await supabase.from('clients').update({ agent_id: profileId }).is('agent_id', null);
    if (error) console.log('Link failure:', error.message);
    else console.log('Successfully linked clients!');

    // 3. Check products table
    console.log('Checking products table existence...');
    const { error: prError } = await supabase.from('products').select('*').limit(1);
    if (prError) console.log('Products table error:', prError.message);
    else console.log('Products table exists and is accessible!');
}

finalRepair();
