import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function forceLink() {
    console.log('--- Force Linking Client to User ---');

    const { data: { users } } = await supabase.auth.admin.listUsers();
    if (!users || users.length === 0) return;
    const targetUserId = users[0].id;
    console.log(`Targeting User ID: ${targetUserId}`);

    const { data: clients } = await supabase.from('clients').select('id');
    if (!clients || clients.length === 0) return;

    for (const c of clients) {
        console.log(`Linking Client ${c.id} to user ${targetUserId}...`);
        const { error } = await supabase.from('clients').update({ agent_id: targetUserId }).eq('id', c.id);
        if (error) console.log(`  ERROR: ${error.message}`);
        else console.log(`  SUCCESS`);
    }
}

forceLink();
