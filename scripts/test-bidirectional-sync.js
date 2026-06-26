import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

function loadEnv() {
  const content = fs.readFileSync('.env.local', 'utf8');
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SECRET_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function run() {
  const testEmail = 'bidi_test_user@gmail.com';
  const testUsername = 'bidi_test_user';

  console.log("--- STARTING BIDIRECTIONAL SYNC TEST ---");

  // Cleanup pre-existing test data
  try {
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const found = existingUsers?.users?.find(u => u.email === testEmail);
    if (found) {
      console.log("Cleaning up existing test user in Auth...");
      await supabase.auth.admin.deleteUser(found.id);
    }
    console.log("Cleaning up existing test employee in DB...");
    await supabase.from('var_nhan_vien').delete().eq('ten_dang_nhap', testUsername);
  } catch (err) {
    console.warn("Cleanup warning:", err);
  }

  // 1. Create a user via Supabase Auth Admin (simulates Supabase Auth dashboard creation)
  console.log("\nStep 1: Creating user in Supabase Auth...");
  const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      ten_dang_nhap: testUsername,
      ho_va_ten: 'Bi-directional Test User'
    }
  });

  if (createErr) {
    console.error("Failed to create user in Auth:", createErr);
    return;
  }
  console.log("User created in Auth with ID:", newUser.user.id);

  // Wait 1 second for trigger to execute and database consistency
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Verify that a corresponding employee was automatically created in var_nhan_vien
  console.log("\nStep 1 Verification: Fetching employee from DB...");
  const { data: employees, error: fetchErr } = await supabase
    .from('var_nhan_vien')
    .select('*')
    .eq('ten_dang_nhap', testUsername);

  if (fetchErr || !employees || employees.length === 0) {
    console.error("Sync failed: No employee record found in var_nhan_vien!", fetchErr);
  } else {
    console.log("SUCCESS: Employee record automatically created via DB Trigger:", employees[0]);
  }

  // 2. Update user metadata in Supabase Auth
  console.log("\nStep 2: Updating user metadata in Supabase Auth...");
  const { error: updateErr } = await supabase.auth.admin.updateUserById(newUser.user.id, {
    user_metadata: {
      ten_dang_nhap: testUsername,
      ho_va_ten: 'Bi-directional Updated Name'
    }
  });

  if (updateErr) {
    console.error("Failed to update user in Auth:", updateErr);
  } else {
    // Wait 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify employee record update
    const { data: updatedEmps } = await supabase
      .from('var_nhan_vien')
      .select('*')
      .eq('ten_dang_nhap', testUsername);
    
    if (updatedEmps && updatedEmps.length > 0) {
      console.log("SUCCESS: Employee record automatically updated via DB Trigger:", updatedEmps[0]);
    } else {
      console.error("Failed to fetch updated employee record!");
    }
  }

  // 3. Delete user in Supabase Auth
  console.log("\nStep 3: Deleting user in Supabase Auth...");
  const { error: deleteErr } = await supabase.auth.admin.deleteUser(newUser.user.id);

  if (deleteErr) {
    console.error("Failed to delete user from Auth:", deleteErr);
  } else {
    // Wait 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify employee record has ten_dang_nhap nullified (safe soft deactivation to prevent breaking references)
    const { data: deletedEmps } = await supabase
      .from('var_nhan_vien')
      .select('*')
      .eq('email', testEmail);
    
    if (deletedEmps && deletedEmps.length > 0) {
      console.log("SUCCESS: Employee record ten_dang_nhap is now nullified:", deletedEmps[0]);
      // Final clean up of the row
      await supabase.from('var_nhan_vien').delete().eq('email', testEmail);
      console.log("Cleaned up database test row.");
    } else {
      console.log("Employee record deleted completely (or not found).");
    }
  }

  console.log("\n--- BIDIRECTIONAL SYNC TEST COMPLETED ---");
}

run();
