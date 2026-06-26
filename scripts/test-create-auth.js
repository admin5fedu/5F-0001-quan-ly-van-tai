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

async function verify() {
  const testEmail = 'testtrigger@gmail.com';
  const testUsername = 'testtrigger';
  const testName = 'Test Trigger Sync';

  console.log(`1. Creating user in Supabase Auth: ${testEmail}...`);
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'password123',
    email_confirm: true,
    user_metadata: { ten_dang_nhap: testUsername, ho_va_ten: testName },
  });

  if (createError) {
    console.error("Error creating auth user:", createError);
    process.exit(1);
  }

  const userId = userData.user.id;
  console.log(`Auth user created with ID: ${userId}`);

  // Wait a moment for trigger execution
  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log(`2. Checking public.var_nhan_vien for username: ${testUsername}...`);
  const { data: dbData, error: dbError } = await supabase
    .from('var_nhan_vien')
    .select('*')
    .eq('ten_dang_nhap', testUsername)
    .maybeSingle();

  if (dbError) {
    console.error("Error querying var_nhan_vien:", dbError);
  } else if (dbData) {
    console.log("SUCCESS: Employee record found in database:", JSON.stringify(dbData, null, 2));
  } else {
    console.error("FAILURE: Employee record was not found in public.var_nhan_vien!");
  }

  console.log(`3. Cleaning up test auth user: ${userId}...`);
  const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error("Error deleting auth user:", deleteError);
  } else {
    console.log("Auth user cleaned up successfully.");
  }

  // Check if delete trigger removed or set username to null
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const { data: dbDataAfter } = await supabase
    .from('var_nhan_vien')
    .select('id, ho_va_ten, ten_dang_nhap')
    .eq('id', dbData?.id)
    .maybeSingle();

  console.log("Employee state after auth user deletion:", JSON.stringify(dbDataAfter, null, 2));
  if (dbDataAfter && dbDataAfter.ten_dang_nhap === null) {
    console.log("SUCCESS: ten_dang_nhap set to NULL on employee record after user deletion.");
    // Clean up the employee record completely
    await supabase.from('var_nhan_vien').delete().eq('id', dbData.id);
    console.log("Database employee record deleted.");
  } else {
    console.warn("WARNING: Employee record not found or ten_dang_nhap was not set to NULL.");
  }
}

verify();
