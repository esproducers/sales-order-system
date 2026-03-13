import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixStorage() {
    console.log('--- Fixing Storage Buckets ---');
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketNames = buckets.map(b => b.name);

    if (!bucketNames.includes('product-photos')) {
        console.log('Creating product-photos bucket...');
        const { error } = await supabase.storage.createBucket('product-photos', { public: true });
        if (error) console.error('  ERROR createBucket:', error.message);
        else console.log('  SUCCESS');
    } else {
        console.log('product-photos bucket already exists.');
    }
}

fixStorage();
