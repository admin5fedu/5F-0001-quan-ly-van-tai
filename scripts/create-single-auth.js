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

async function run() {
  const email = 'testsyncuser@gmail.com';
  const username = 'testsyncuser';
  const fullName = 'Test Sync User';

  console.log(`Creating Supabase Auth user: ${email}...`);
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      ten_dang_nhap: username,
      full_name: fullName,
      role: 'staff'
    }
  });

  if (error) {
    console.error("Error creating user:", error.message);
  } else {
    console.log("Successfully created user!");
    console.log(JSON.stringify(data.user, null, 2));
  }
}

run();
