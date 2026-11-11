// HetAas Atelier API: a Cloudflare Worker (free tier).
// The shop's only server-side job: a live Shiprocket delivery charge for a PIN code.
// (The PayPal checkout and AI assistant live in the separate hackathon demo repo.)
//
// Routes
//   POST /api/shipping-quote   live Shiprocket delivery charge for a PIN code (cheapest + markup)
//   GET  /api/health

const CUSTOM_STICKER_FEE = 90; // must match the customizer in app.js
const MAX_ITEMS = 15;          // must match the basket limit in app.js

// Module-level caches survive between requests while the isolate is warm.
let siteCache = { at: 0, products: null, content: null };
let shiprocketTokenCache = { token: null, exp: 0 };
const shippingQuoteCache = new Map(); // `${pin}|${kg}` -> { at, quote }

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// ---------- HTTP helpers ----------

// ALLOWED_ORIGIN may list several sites (comma-separated): the live shop and the hackathon demo.
function allowedOrigin(env, request) {
  const list = String(env.ALLOWED_ORIGIN || '*').split(',').map((o) => o.trim()).filter(Boolean);
  if (list.includes('*')) return '*';
  const origin = request?.headers.get('Origin') || '';
  return list.includes(origin) ? origin : list[0];
}

// True for requests from the PayPal hackathon demo site (or local testing).
function withCors(response, env, request) {
  const r = new Response(response.body, response);
  r.headers.set('Access-Control-Allow-Origin', allowedOrigin(env, request));
  r.headers.set('Vary', 'Origin');
  return r;
}

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function respond(env, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(env) },
  });
}

function clean(value, max = 60) {
  return String(value ?? '')
    .replace(/[<>"\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

// ---------- Catalogue (read from the live site, so products.json stays the only source) ----------

async function loadSite(env) {
  const now = Date.now();
  if (siteCache.products && now - siteCache.at < 5 * 60 * 1000) return siteCache;
  const base = env.SITE_URL.replace(/\/$/, '');
  const [products, content] = await Promise.all([
    fetch(`${base}/products.json`).then((r) => r.json()),
    fetch(`${base}/content.json`).then((r) => r.json()),
  ]);
  siteCache = { at: now, products: products.products || [], content };
  return siteCache;
}

// Light stemming so "earrings" matches "earring".

function priceBasket(items, site, env = {}) {
  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, 'Basket is empty');
  let count = 0;
  return items.map((it) => {
    const qty = Math.max(1, Math.min(MAX_ITEMS, parseInt(it.qty ?? it.quantity ?? 1, 10) || 1));
    count += qty;
    if (count > MAX_ITEMS) throw new HttpError(400, `Basket limit is ${MAX_ITEMS} items`);

    if (it.custom) {
      const base = (site.content.customizer?.bases || []).find((b) => b.id === it.custom.baseId);
      if (!base) throw new HttpError(400, 'Unknown custom base');
      const sticker = !!it.custom.sticker;
      const text = clean(it.custom.text, 20);
      if (sticker && !text) throw new HttpError(400, 'Metallic sticker needs a name or initial');
      const details = [
        `Tint: ${clean(it.custom.color, 30)}`,
        `Accents: ${clean(it.custom.inclusion, 30)}`,
        sticker ? `Metallic name: "${text}"` : '',
      ].filter(Boolean);
      return {
        weight: weightFor(base.category, base.name, env),
        name: `Custom Resin ${base.name}`,
        qty,
        unit: Number(base.price) + (sticker ? CUSTOM_STICKER_FEE : 0),
        desc: details.join(' | ').slice(0, 127),
      };
    }

    const p = site.products.find((x) => String(x.id) === String(it.id));
    if (!p) throw new HttpError(400, 'Unknown product in basket');
    if (p.available === false) throw new HttpError(409, `${p.name} is currently unavailable`);
    const detail = it.customName ? `Name/inscription: "${clean(it.customName, 30)}"` : p.category;
    return { weight: weightFor(p.category, p.name, env), name: p.name, qty, unit: Number(p.price), desc: detail.slice(0, 127) };
  });
}

// ---------- Delivery charges (Shiprocket) ----------

// Packed weight per piece: pooja thalis and decor plates are heavy, everything else is light.
function weightFor(category, name, env) {
  const heavy = /thali/i.test(category) || /plate/i.test(name);
  return Number(heavy ? env.WEIGHT_HEAVY_KG || 2 : env.WEIGHT_STANDARD_KG || 0.5);
}

// Shiprocket blocks an API user after repeated logins, so the token is kept in KV (shared by
// every Worker instance) and reused for 9 days. After a failed login, wait 15 minutes before
// trying again instead of retrying on every request.
const SR_TOKEN_KEY = 'shiprocket:token';
const SR_COOLDOWN_KEY = 'shiprocket:cooldown';

async function shiprocketToken(env, force = false) {
  if (!force && shiprocketTokenCache.token && Date.now() < shiprocketTokenCache.exp) return shiprocketTokenCache.token;
  if (!force && env.ORDERS) {
    const saved = await env.ORDERS.get(SR_TOKEN_KEY, 'json');
    if (saved && saved.token && Date.now() < saved.exp) {
      shiprocketTokenCache = saved;
      return saved.token;
    }
  }
  if (!env.SHIPROCKET_EMAIL || !env.SHIPROCKET_PASSWORD) throw new HttpError(503, 'Delivery charges are not configured yet');
  if (env.ORDERS && (await env.ORDERS.get(SR_COOLDOWN_KEY))) {
    throw new HttpError(503, 'Delivery charges are temporarily unavailable. Please try again in a few minutes.');
  }

  const r = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.SHIPROCKET_EMAIL, password: env.SHIPROCKET_PASSWORD }),
  });
  const raw = await r.text();
  let d = {};
  try { d = JSON.parse(raw); } catch { /* non-JSON error page */ }
  if (!r.ok || !d.token) {
    console.error('Shiprocket login failed', r.status, raw.slice(0, 300));
    if (env.ORDERS) await env.ORDERS.put(SR_COOLDOWN_KEY, '1', { expirationTtl: 15 * 60 });
    throw new HttpError(502, 'Could not reach the delivery partner. Please try again.');
  }
  // Shiprocket tokens last 10 days; refresh after 9.
  shiprocketTokenCache = { token: d.token, exp: Date.now() + 9 * 24 * 60 * 60 * 1000 };
  if (env.ORDERS) await env.ORDERS.put(SR_TOKEN_KEY, JSON.stringify(shiprocketTokenCache), { expirationTtl: 9 * 24 * 60 * 60 });
  return d.token;
}

// Cheapest courier for this PIN code and weight, plus the shop's fixed markup (whole rupees).
async function quoteShipping(env, pincode, weightKg) {
  if (!/^[1-9]\d{5}$/.test(String(pincode))) throw new HttpError(400, 'Please enter a valid 6-digit PIN code');
  const kg = Math.max(0.5, Math.round(weightKg * 100) / 100);
  const key = `${pincode}|${kg}`;
  const cached = shippingQuoteCache.get(key);
  if (cached && Date.now() - cached.at < 10 * 60 * 1000) return cached.quote;

  const url = `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${env.PICKUP_PINCODE || '380052'}&delivery_postcode=${pincode}&weight=${kg}&cod=0`;
  let token = await shiprocketToken(env);
  let r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (r.status === 401) {
    token = await shiprocketToken(env, true);
    r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  }
  const d = await r.json().catch(() => ({}));
  const excluded = new Set(String(env.EXCLUDED_COURIER_IDS || '').split(',').map((x) => x.trim()).filter(Boolean));
  const couriers = (d.data?.available_courier_companies || []).filter(
    (c) => Number(c.rate) > 0 && !excluded.has(String(c.courier_company_id))
  );
  if (!couriers.length) throw new HttpError(400, "Sorry, we can't deliver to this PIN code yet. Please DM the artist on Instagram.");

  // The Shiprocket panel's price = freight `rate` + extra charges the API lists separately
  // (WhatsApp delivery updates, usually ₹5; plus other/coverage/entry tax when present).
  // COD charges are left out because every order is prepaid.
  const fullPrice = (c) =>
    Number(c.rate) +
    Number(c.whatsapp_charges || 0) +
    Number(c.other_charges || 0) +
    Number(c.coverage_charges || 0) +
    Number(c.entry_tax || 0);
  const best = couriers.reduce((a, b) => (fullPrice(b) < fullPrice(a) ? b : a));
  const cost = Math.ceil(Math.round(fullPrice(best) * 100) / 100);
  const quote = {
    charge: cost + Number(env.SHIPPING_MARKUP_INR || 10), // what the buyer pays
    cost, // what Shiprocket charges the shop (owner email only)
    courier: String(best.courier_name || 'Courier'),
    days: best.estimated_delivery_days ? String(best.estimated_delivery_days) : '',
    weightKg: kg,
  };
  shippingQuoteCache.set(key, { at: Date.now(), quote });
  return quote;
}

const basketWeight = (lines) => lines.reduce((s, l) => s + l.weight * l.qty, 0);

// Free delivery once the items total reaches this many rupees (override with FREE_SHIPPING_MIN_INR).
const freeShippingMin = (env) => Number(env.FREE_SHIPPING_MIN_INR || 700);
const withFreeShipping = (quote, itemsTotal, env) =>
  itemsTotal >= freeShippingMin(env) ? { ...quote, charge: 0, free: true } : quote;

async function handleShippingQuote(request, env) {
  const body = await request.json().catch(() => ({}));
  const site = await loadSite(env);
  const lines = priceBasket(body.items, site, env);
  const itemsTotal = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  const quote = withFreeShipping(await quoteShipping(env, String(body.pincode || '').trim(), basketWeight(lines)), itemsTotal, env);
  return respond(env, { itemsTotal, delivery: quote.charge, free: !!quote.free, courier: quote.courier, days: quote.days, total: itemsTotal + quote.charge });
}


// ---------- Router ----------

export default {
  async fetch(request, env) {
    return withCors(await route(request, env), env, request);
  },
};

async function route(request, env) {
  const { pathname } = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(env) });

  try {
    if (request.method === 'GET' && pathname === '/api/health') return respond(env, { ok: true });
    if (request.method !== 'POST') return respond(env, { error: 'Method not allowed' }, 405);
    if (pathname === '/api/shipping-quote') return await handleShippingQuote(request, env);
    return respond(env, { error: 'Not found' }, 404);
  } catch (err) {
    if (err instanceof HttpError) return respond(env, { error: err.message }, err.status);
    console.error(err);
    return respond(env, { error: 'Something went wrong. Please try again or DM us on Instagram.' }, 500);
  }
}
