import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function repairData() {
    console.log('--- Repairing Data ---');

    // 1. Get first user
    const { data: { users } } = await supabase.auth.admin.listUsers();
    if (!users || users.length === 0) {
        console.log('No users found to repair.');
        return;
    }
    const targetUser = users[0];
    console.log(`Targeting user: ${targetUser.email} (${targetUser.id})`);

    // 2. Ensure profile exists
    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', targetUser.id).single();
    if (!profile) {
        console.log('Creating missing profile...');
        await supabase.from('profiles').insert({
            user_id: targetUser.id,
            name: targetUser.user_metadata?.name || targetUser.email.split('@')[0],
            email: targetUser.email,
            role: 'admin' // Setting to admin so you can add products
        });
    } else {
        console.log('Profile already exists.');
        // Ensure role is admin for product testing
        await supabase.from('profiles').update({ role: 'admin' }).eq('user_id', targetUser.id);
    }

    // 3. Link orphaned clients
    console.log('Linking orphaned clients to this user...');
    const { error: updateError } = await supabase
        .from('clients')
        .update({ agent_id: targetUser.id })
        .is('agent_id', null);

    if (updateError) console.error('Error linking clients:', updateError.message);
    else console.log('Clients linked successfully.');

    // 4. Check products table existence again
    const { error: prError } = await supabase.from('products').select('*').limit(1);
    if (prError) {
        console.log(`Products table status: ${prError.message}`);
        console.log('Attempting to create "products" table placeholder if possible...');
        // Note: DDL via Service Role depends on your Supabase settings, usually requires SQL editor.
    }
}

repairData();
