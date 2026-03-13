import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function repairAll() {
    console.log('--- Repairing All Users ---');

    const { data: { users } } = await supabase.auth.admin.listUsers();

    for (const u of users) {
        console.log(`Checking user: ${u.email}...`);
        const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', u.id).single();

        if (!profile) {
            console.log(`  Creating profile for ${u.email}...`);
            const { data: newProfile, error } = await supabase.from('profiles').insert({
                user_id: u.id,
                name: u.user_metadata?.name || u.email.split('@')[0],
                email: u.email,
                role: 'admin',
                commission_rate: 5
            }).select().single();
            if (error) console.log(`  ERROR: ${error.message}`);
            else console.log(`  Profile created: ${newProfile.id}`);
        } else {
            console.log(`  Profile exists. Ensuring admin role...`);
            await supabase.from('profiles').update({ role: 'admin' }).eq('user_id', u.id);
        }
    }

    // Also link any remaining clients
    console.log('Linking any orphaned clients...');
    const { data: firstProfile } = await supabase.from('profiles').select('id').limit(1).single();
    if (firstProfile) {
        const { error } = await supabase.from('clients').update({ agent_id: firstProfile.id }).is('agent_id', null);
        if (!error) console.log('Orphaned clients linked.');
    }
}

repairAll();
