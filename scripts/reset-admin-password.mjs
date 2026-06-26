import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(path = '.env.local') {
  const content = fs.readFileSync(path, 'utf8');
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SECRET_KEY;

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function resetPassword() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error(error);
    return;
  }
  const adminUser = data.users.find(u => u.email === 'admin@gmail.com');
  if (!adminUser) {
    console.error("Admin user not found in Auth!");
    return;
  }
  console.log(`Found admin user: ${adminUser.id}. Resetting password to '123456'...`);
  const { error: updateError } = await supabase.auth.admin.updateUserById(adminUser.id, {
    password: '123456'
  });
  if (updateError) {
    console.error("Error updating password:", updateError);
  } else {
    console.log("Admin password successfully reset to '123456'!");
  }
}

resetPassword();
