import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLS() {
    console.log('--- Testing RLS for Clients ---');
    const { data: adminData, error: adminError } = await supabase.from('clients').select('*');
    if (adminError) console.error('Admin Error:', adminError.message);
    else console.log('Admin saw clients:', adminData?.length);

    console.log('\n--- Testing Products ---');
    const { data: pData, error: pError } = await supabase.from('products').select('*');
    if (pError) {
        console.error('Products Error:', pError.message, pError.code);
    } else {
        console.log('Products saw (service role):', pData?.length);
    }
}

checkRLS();
