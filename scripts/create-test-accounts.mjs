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
  const testUsers = [
    {
      ten_dang_nhap: 'truongphongvh',
      ho_va_ten: 'Trưởng phòng Vận hành',
      email: 'truongphongvh@gmail.com',
      id_chuc_vu: 8, // Trưởng phòng vận hành
      id_phong_ban: 9, // Phòng vận hành
      la_tai_xe: false,
    },
    {
      ten_dang_nhap: 'taixe1',
      ho_va_ten: 'Tài xế 1',
      email: 'taixe1@gmail.com',
      id_chuc_vu: 7, // Tài xế
      id_phong_ban: 14, // Phòng Nhân Viên
      la_tai_xe: true,
    }
  ];

  console.log("Cleaning up existing test users...");
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  for (const user of testUsers) {
    const foundAuth = authUsers?.users?.find(u => u.email === user.email);
    if (foundAuth) {
      console.log(`Deleting Auth user: ${user.email} (${foundAuth.id})`);
      await supabase.auth.admin.deleteUser(foundAuth.id);
    }
    console.log(`Deleting DB employee: ${user.ten_dang_nhap} / ${user.email}`);
    await supabase.from('var_nhan_vien').delete()
      .or(`ten_dang_nhap.eq.${user.ten_dang_nhap},email.eq.${user.email}`);
  }

  // Insert employees into public.var_nhan_vien
  console.log("Inserting test employees into public.var_nhan_vien...");
  for (const user of testUsers) {
    const { data, error } = await supabase
      .from('var_nhan_vien')
      .insert({
        ho_va_ten: user.ho_va_ten,
        ten_dang_nhap: user.ten_dang_nhap,
        email: user.email,
        id_chuc_vu: user.id_chuc_vu,
        id_phong_ban: user.id_phong_ban,
        la_tai_xe: user.la_tai_xe,
        trang_thai: 'Đang hoạt động'
      })
      .select();

    if (error) {
      console.error(`Failed to insert ${user.ten_dang_nhap} into DB:`, error.message);
    } else {
      console.log(`Inserted employee ${user.ten_dang_nhap}:`, data[0]);
    }
  }

  // Run reconciliation to create Supabase Auth users
  console.log("Reconciling with Supabase Auth to create accounts...");
  for (const user of testUsers) {
    const email = user.email;
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password: '123456',
      email_confirm: true,
      user_metadata: {
        ten_dang_nhap: user.ten_dang_nhap,
        full_name: user.ho_va_ten,
        id_chuc_vu: String(user.id_chuc_vu),
        id_phong_ban: String(user.id_phong_ban),
        role: 'staff'
      }
    });

    if (createErr) {
      console.error(`Failed to create Auth user for ${user.ten_dang_nhap}:`, createErr.message);
    } else {
      console.log(`Created Auth user for ${user.ten_dang_nhap}:`, newUser.user.id);
    }
  }

  console.log("Verification account creation completed!");
}

run();
