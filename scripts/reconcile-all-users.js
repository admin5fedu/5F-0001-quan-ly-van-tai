import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

function loadEnv() {
  const env = { ...process.env };
  try {
    const envContent = fs.readFileSync('.env.local', 'utf-8');
    envContent.split('\n').forEach((line) => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        env[key] = val;
      }
    });
  } catch {
    // .env.local optional when process.env is set
  }
  return env;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing Supabase credentials in .env.local!");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function usernameToEmail(username) {
  const clean = username.trim().toLowerCase();
  return clean.includes('@') ? clean : `${clean}@gmail.com`;
}

async function reconcile() {
  console.log("Fetching employees from var_nhan_vien...");
  const { data: employees, error: dbError } = await supabase
    .from('var_nhan_vien')
    .select('id, ho_va_ten, ten_dang_nhap, email, id_chuc_vu, id_phong_ban')
    .not('ten_dang_nhap', 'is', null);

  if (dbError) {
    console.error("Error fetching employees:", dbError);
    return;
  }

  console.log(`Found ${employees.length} employees with usernames. Checking Supabase Auth...`);

  // List all auth users
  let authUsers = [];
  let page = 1;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error("Error listing Auth users:", error);
      return;
    }
    authUsers = authUsers.concat(data.users);
    if (data.users.length < 1000) break;
    page += 1;
  }

  console.log(`Found ${authUsers.length} users in Supabase Auth.`);

  for (const emp of employees) {
    const username = emp.ten_dang_nhap.trim();
    if (!username) continue;

    const email = usernameToEmail(username);
    const existingUser = authUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      console.log(`User ${username} (${email}) already exists in Auth. Updating metadata...`);
      const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
        email_confirm: true,
        user_metadata: {
          ten_dang_nhap: username,
          full_name: emp.ho_va_ten,
          id_chuc_vu: emp.id_chuc_vu,
          id_phong_ban: emp.id_phong_ban,
        },
      });
      if (error) {
        console.error(`Failed to update ${username}:`, error);
      }
    } else {
      console.log(`User ${username} (${email}) is missing from Auth. Creating user...`);
      const { error } = await supabase.auth.admin.createUser({
        email,
        password: '123456',
        email_confirm: true,
        user_metadata: {
          ten_dang_nhap: username,
          full_name: emp.ho_va_ten,
          id_chuc_vu: emp.id_chuc_vu,
          id_phong_ban: emp.id_phong_ban,
        },
      });
      if (error) {
        console.error(`Failed to create ${username}:`, error);
      } else {
        console.log(`Successfully created ${username} in Auth.`);
      }
    }
  }

  console.log("Reconciliation complete!");
}

reconcile();
