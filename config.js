// API Worker URL (see worker/ and the README). It gives the live delivery charge for a PIN code.
// Leave it empty to fall back to the plain Instagram-DM order request (no delivery quote).
// On localhost the site talks to a local Worker (`npx wrangler dev` in worker/) instead.
window.HETAAS_API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    ? 'http://127.0.0.1:8787' // wrangler dev listens on IPv4 only; "localhost" may resolve to IPv6
    : 'https://hetaas-api.automated-aesthetix.workers.dev';
