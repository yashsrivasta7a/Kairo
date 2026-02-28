/**
 * clear-builds.mjs
 * Deletes every build record from InstantDB for the current app.
 * Run with: node scripts/clear-builds.mjs
 */
import { init } from '@instantdb/admin';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Load .env manually (no dotenv dependency needed) ─────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');
const envLines = readFileSync(envPath, 'utf-8').split('\n');
for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[key]) process.env[key] = val;
}

const APP_ID    = process.env.EXPO_PUBLIC_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_APP_ADMIN_TOKEN;

if (!APP_ID || !ADMIN_TOKEN) {
  console.error('❌ Missing EXPO_PUBLIC_INSTANT_APP_ID or INSTANT_APP_ADMIN_TOKEN in .env');
  process.exit(1);
}

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

async function clearBuilds() {
  console.log('🔍 Fetching all builds...');
  const { builds } = await db.query({ builds: {} });

  if (!builds || builds.length === 0) {
    console.log('✅ No builds found — DB is already empty.');
    return;
  }

  console.log(`🗑️  Found ${builds.length} build(s). Deleting...`);

  // InstantDB transact accepts up to ~100 ops at a time — batch if needed
  const BATCH = 50;
  for (let i = 0; i < builds.length; i += BATCH) {
    const chunk = builds.slice(i, i + BATCH);
    await db.transact(chunk.map(b => db.tx.builds[b.id].delete()));
    console.log(`   Deleted ${Math.min(i + BATCH, builds.length)} / ${builds.length}`);
  }

  console.log('✅ All builds deleted successfully.');
}

clearBuilds().catch(err => {
  console.error('❌ Failed:', err.message ?? err);
  process.exit(1);
});
