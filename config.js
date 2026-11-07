// API Worker URL (see worker/ and the README). Leave it empty to keep the original
// Instagram-DM checkout and hide the chat.
// On localhost the site talks to a local Worker (`npx wrangler dev` in worker/) instead.
window.HETAAS_API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    ? 'http://127.0.0.1:8787' // wrangler dev listens on IPv4 only; "localhost" may resolve to IPv6
    : 'https://hetaas-api.automated-aesthetix.workers.dev';

// Two modes, chosen by the site address:
//   'live' - the real shop (GitHub Pages): no PayPal. Delivery orders are sent to the artist on
//            Instagram with the delivery charge, and paid after the artist confirms.
//   'demo' - the PayPal hackathon demo (Cloudflare Pages, and localhost for testing):
//            PayPal sandbox checkout and every other feature.
window.HETAAS_MODE = /(\.pages\.dev|^localhost|^127\.0\.0\.1)$/.test(location.hostname) ? 'demo' : 'live';
