import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

function loadEnvLocal() {
  const env = {};
  for (const file of ['.env.local', '.env']) {
    if (!fs.existsSync(file)) continue;
    fs.readFileSync(file, 'utf-8')
      .split('\n')
      .forEach((line) => {
        const parts = line.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
          if (key && !key.startsWith('#')) env[key] = val;
        }
      });
    break;
  }
  return env;
}

const env = loadEnvLocal();
export const URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
export const ANON =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;
export const SECRET = env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY;

if (!URL || !SECRET) {
  throw new Error('Set SUPABASE_SECRET_KEY and VITE_SUPABASE_URL in .env.local');
}

export const PROJECT_REF = new URL(URL).hostname.split('.')[0];
export const APP = 'https://tah-app.vercel.app';
export const OUT = '/home/linhnxdeveloper/Projects/verifyimage/tah-app/functional';
export const CHROME = '/usr/bin/google-chrome-stable';
export const storageKey = `sb-${PROJECT_REF}-auth-token`;

export const db = createClient(URL, SECRET, { auth: { persistSession: false } });

export async function getSession() {
  if (!ANON) {
    throw new Error('Set VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY in .env.local');
  }
  const admin = createClient(URL, SECRET, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: 'admin@gmail.com' });
  if (error) throw new Error('genlink: ' + error.message);
  const pub = createClient(URL, ANON, { auth: { persistSession: false } });
  const v = await pub.auth.verifyOtp({ type: 'magiclink', token_hash: data.properties.hashed_token });
  if (v.error) throw new Error('verify: ' + v.error.message);
  return v.data.session;
}

export const authStorage = JSON.stringify({
  state: { user: { id: 'cd850a9d-3bbf-41be-b957-32708d8952b0', email: 'admin@gmail.com', full_name: 'Admin', role: 'admin', created_at: new Date().toISOString(), id_phong_ban: '1', id_chuc_vu: ['1'], ten_dang_nhap: 'admin' }, isAuthenticated: true },
  version: 2,
});

export async function makeContext(browser, session, mobile = false) {
  const ctx = await browser.newContext(mobile ? { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(([k, v, ak, av]) => { localStorage.setItem(k, v); localStorage.setItem('auth-remember', 'true'); localStorage.setItem(ak, av); }, [storageKey, JSON.stringify(session), 'auth-storage', authStorage]);
  return ctx;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const shot = async (t, n) => { await t.screenshot({ path: `${OUT}/${n}` }); console.log('  📸', n); };
