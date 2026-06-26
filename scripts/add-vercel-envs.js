import fs from 'fs';
import { execSync, spawnSync } from 'child_process';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = [];
envContent.split('\n').forEach((line) => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    if (key && val) {
      env.push({ key, val });
    }
  }
});

for (const { key, val } of env) {
  console.log(`Syncing ${key}...`);
  
  // Sync to production
  try {
    const res = spawnSync('npx', ['vercel', 'env', 'add', key, 'production', '--value', val, '--force', '--yes'], {
      timeout: 20000,
      shell: true,
      env: { ...process.env, VERCEL_TELEMETRY_DISABLED: '1', NO_UPDATE_NOTIFIER: '1' }
    });
    if (res.status !== 0) {
      console.log(`  - Failed syncing ${key} for production:`, res.stderr?.toString() || res.error?.message);
    } else {
      console.log(`  - Synced ${key} for production`);
    }
  } catch (err) {
    console.log(`  - Failed or timed out syncing ${key} for production:`, err.message);
  }

  // Sync to development
  try {
    const res = spawnSync('npx', ['vercel', 'env', 'add', key, 'development', '--value', val, '--force', '--yes'], {
      timeout: 20000,
      shell: true,
      env: { ...process.env, VERCEL_TELEMETRY_DISABLED: '1', NO_UPDATE_NOTIFIER: '1' }
    });
    if (res.status !== 0) {
      console.log(`  - Failed syncing ${key} for development:`, res.stderr?.toString() || res.error?.message);
    } else {
      console.log(`  - Synced ${key} for development`);
    }
  } catch (err) {
    console.log(`  - Failed or timed out syncing ${key} for development:`, err.message);
  }
}

console.log("Triggering production redeployment...");
try {
  execSync('npx vercel --prod --yes', {
    stdio: 'ignore',
    timeout: 60000,
    env: { ...process.env, VERCEL_TELEMETRY_DISABLED: '1', NO_UPDATE_NOTIFIER: '1' }
  });
  console.log("Redeployment initiated successfully!");
} catch (err) {
  console.error("Redeployment finished/failed:", err.message);
}
