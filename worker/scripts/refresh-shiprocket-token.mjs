// Refreshes the Shiprocket login token stored in Cloudflare KV.
//
// Shiprocket rejects logins coming from Cloudflare's servers, so the API Worker cannot log in
// by itself. This script logs in from somewhere else (the weekly GitHub job, or your computer)
// and writes the token to the KV key the Worker reads ("shiprocket:token").
//
// Env: SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD, CLOUDFLARE_API_TOKEN (Workers KV Storage: Edit),
//      CLOUDFLARE_ACCOUNT_ID, KV_NAMESPACE_ID
// Run:  node worker/scripts/refresh-shiprocket-token.mjs

const need = ['SHIPROCKET_EMAIL', 'SHIPROCKET_PASSWORD', 'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'KV_NAMESPACE_ID'];
const missing = need.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('Missing env:', missing.join(', '));
  process.exit(1);
}
const env = process.env;
const NINE_DAYS = 9 * 24 * 60 * 60;

// 1. One Shiprocket login (no retries: repeated failures get the API user blocked).
const login = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: env.SHIPROCKET_EMAIL, password: env.SHIPROCKET_PASSWORD }),
});
const loginBody = await login.json().catch(() => ({}));
if (!loginBody.token) {
  console.error('Shiprocket login failed:', login.status, loginBody.message || '');
  process.exit(1);
}
if (env.GITHUB_ACTIONS) console.log(`::add-mask::${loginBody.token}`);

// 2. Save it where the Worker looks for it.
const kv = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${env.KV_NAMESPACE_ID}/values`;
const headers = { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` };
const value = JSON.stringify({ token: loginBody.token, exp: Date.now() + NINE_DAYS * 1000 });

const put = await fetch(`${kv}/${encodeURIComponent('shiprocket:token')}?expiration_ttl=${NINE_DAYS}`, {
  method: 'PUT',
  headers: { ...headers, 'Content-Type': 'text/plain' },
  body: value,
});
const putBody = await put.json().catch(() => ({}));
if (!put.ok || !putBody.success) {
  console.error('Saving to Cloudflare KV failed:', put.status, JSON.stringify(putBody.errors || putBody).slice(0, 300));
  process.exit(1);
}

// 3. Clear any login pause left by an earlier failure.
await fetch(`${kv}/${encodeURIComponent('shiprocket:cooldown')}`, { method: 'DELETE', headers }).catch(() => {});

console.log('Shiprocket token refreshed; valid for 9 days.');
