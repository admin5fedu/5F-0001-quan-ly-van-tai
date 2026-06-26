import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
});

const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SECRET_KEY;

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function check() {
  const testUsername = 'testsync';

  console.log(`Checking public.var_nhan_vien for username: ${testUsername}...`);
  const { data: dbData, error: dbError } = await supabase
    .from('var_nhan_vien')
    .select('*')
    .eq('ten_dang_nhap', testUsername)
    .maybeSingle();

  if (dbError) {
    console.error("Error querying var_nhan_vien:", dbError);
  } else if (dbData) {
    console.log("SUCCESS: Employee record found in database:", JSON.stringify(dbData, null, 2));
    
    // Clean up
    console.log("Cleaning up test user from Auth and DB...");
    const { data: userData } = await supabase.auth.admin.listUsers();
    const authUser = userData?.users.find((u) => u.email === 'testsync@gmail.com');
    if (authUser) {
      await supabase.auth.admin.deleteUser(authUser.id);
      console.log("Auth user deleted.");
    }
    await supabase.from('var_nhan_vien').delete().eq('id', dbData.id);
    console.log("Database employee record deleted.");
  } else {
    console.error("FAILURE: Employee record was not found in public.var_nhan_vien!");
  }
}

check();
