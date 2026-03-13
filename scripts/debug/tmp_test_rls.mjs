import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLS() {
    console.log('--- Testing RLS for Clients ---');
    // Service role should bypass RLS
    const { data: adminData } = await supabase.from('clients').select('*');
    console.log('Admin saw clients:', adminData?.length);

    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const anonSupabase = createClient(supabaseUrl, anonKey);

    const { data: anonData, error: anonError } = await anonSupabase.from('clients').select('*');
    if (anonError) console.log('Anon Error (expected if RLS on):', anonError.message);
    else console.log('Anon saw clients (RLS may be OFF!):', anonData?.length);

    console.log('\n--- Testing RLS for Products ---');
    const { data: pData, error: pError } = await anonSupabase.from('products').select('*');
    if (pError) console.log('Products Error:', pError.message);
    else console.log('Products visible to anon:', pData?.length);
}

checkRLS();
