import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function uploadProducts() {
    try {
        const workbook = XLSX.readFile('C:\\Users\\User\\Downloads\\item.xlsx');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // Read raw rows to handle the specific layout
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Skip header row
        const rows = data.slice(1);

        const productsToInsert = rows.map((row, index) => {
            // Mapping from our inspection:
            // Col 0: Name
            // Col 1: Unit per Carton
            // Col 5: Wholesale Price per CTN (RM)
            // Col 6: Photo URL

            const name = row[0];
            if (!name) return null;

            return {
                name: name,
                units_per_ctn: parseInt(row[1]) || 1,
                price_per_ctn: parseFloat(row[5]) || 0,
                photo_url: row[6] || null
            };
        }).filter(p => p !== null && p.name);

        console.log(`Found ${productsToInsert.length} products in Excel.`);

        const { data: insertedData, error } = await supabase
            .from('products')
            .insert(productsToInsert)
            .select();

        if (error) {
            if (error.code === 'PGRST205') {
                console.error('\n[ERROR] Table "products" does not exist in your Supabase database.');
                console.error('Please run the SQL I provided earlier to create the table first!');
            } else {
                throw error;
            }
            return;
        }

        console.log(`Successfully uploaded ${insertedData.length} products!`);
    } catch (error) {
        console.error('Upload failed:', error);
    }
}

uploadProducts();
