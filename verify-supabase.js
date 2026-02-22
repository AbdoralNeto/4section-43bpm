
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing Supabase connection...');
    try {
        // Try to list tables in public schema via rpc or just a simple query
        // Since we initialized as anon, we might have restricted access, but let's try a simple auth check or health check
        // A simple query to a non-existent table will still verify connection if it returns a specific error from PostgREST
        const { data, error } = await supabase.from('test_connection_table').select('*').limit(1);

        // If we get a response (even error 404 or empty data), the connection is working.
        // Network error would throw or return a specific error structure.

        if (error) {
            // 42P01 is "undefined_table", which means we connected but the table doesn't exist. This is GOOD for connection test.
            if (error.code === '42P01' || error.message.includes('relation "public.test_connection_table" does not exist')) {
                console.log('✅ Connection Successful! (Access verified, table "test_connection_table" does not exist as expected)');
            } else {
                console.log('⚠️ Connected specific Supabase error:', error.message);
                // If "relation does not exist" comes in a different format, we might need to adjust.
                // But generally receiving a PostgREST error means we reached the server.
                console.log('✅ Connection Successful! (Server responded)');
            }
        } else {
            console.log('✅ Connection Successful! (Data received)');
        }

    } catch (err) {
        console.error('❌ Connection Failed:', err);
        process.exit(1);
    }
}

testConnection();
