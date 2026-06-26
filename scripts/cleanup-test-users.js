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

async function cleanup() {
  const targetUsernames = ['testsyncuser', 'testsyncuser2', 'testwebsync'];
  const targetEmails = ['testsyncuser@gmail.com', 'testsyncuser2@gmail.com', 'testwebsync@gmail.com'];

  console.log("1. Cleaning up from Supabase Auth...");
  // List all users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError.message);
    return;
  }

  for (const user of users) {
    if (targetEmails.includes(user.email)) {
      console.log(`Deleting Auth user: ${user.email} (${user.id})...`);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error(`Error deleting ${user.email}:`, deleteError.message);
      } else {
        console.log(`Successfully deleted ${user.email}`);
      }
    }
  }

  console.log("\n2. Cleaning up from public.var_nhan_vien...");
  for (const username of targetUsernames) {
    console.log(`Deleting database employee with username: ${username}...`);
    const { data, error: dbError } = await supabase
      .from('var_nhan_vien')
      .delete()
      .eq('ten_dang_nhap', username)
      .select();

    if (dbError) {
      console.error(`Error deleting database record for ${username}:`, dbError.message);
    } else {
      console.log(`Successfully deleted database record for ${username} (deleted count: ${data?.length || 0})`);
    }
  }
  
  console.log("\nCleanup finished.");
}

cleanup();
