# HetAas Atelier 🌸

Storefront for **HetAas Atelier** — handmade resin treasures crafted in Ahmedabad, Gujarat (bookmarks, earrings, keychains, coasters, pooja thalis & custom pieces).

🔗 **Live site:** https://aasthathakker.github.io/HetAas-Atelier/
📩 **Orders:** via Instagram DM [@hetaas_atelier](https://www.instagram.com/hetaas_atelier)

## What it is

A fast, mobile-first static website — plain **HTML, CSS & JavaScript**, no build step or framework. Works offline as a PWA and is hosted free on GitHub Pages.

## Project structure

| File | Purpose |
|------|---------|
| `index.html` | Main page |
| `styles.css` | All styling |
| `app.js` | Renders products, basket, quick-view, checkout |
| **`products.json`** | 🛍️ The product catalogue — edit this to add/change items |
| **`content.json`** | ✏️ Site text — hero, about, FAQs, business info |
| `data.js` | Auto-generated fallback for offline/`file://` preview (don't hand-edit) |
| `sw.js`, `manifest.webmanifest` | PWA (offline support & install) |

## How ordering works

Customers add items to the **Resin Basket** → checkout copies a tidy order summary → opens an Instagram DM to paste and send. All orders are pre-paid; each piece is handcrafted to order (4–6 day curing time).

---

*© HetAas Atelier · Handcrafted Resin Art · Ahmedabad, Gujarat, India*

---

## Online payments, AI concierge & order emails (optional backend)

The site works without a backend (orders go via Instagram DM). To turn on PayPal checkout, the AI chat and owner order emails, deploy the free API Worker in [`worker/`](worker/).

**What it does**
- **HetAas Concierge chat:** answers questions from `products.json` and the FAQs, recommends gifts within a budget (gift finder is inside the chat only), and suggests one add-on. It refuses anything unrelated to the shop before calling the model.
- **PayPal checkout (sandbox):** the basket is priced on the server, so the browser cannot change prices. PayPal collects the delivery address.
- **After payment:** the buyer gets a receipt to copy into Instagram. The owner gets the same receipt by email.
- **Delivery charges (Shiprocket):** when the buyer enters their PIN code, the API asks Shiprocket for the cheapest courier from the pickup PIN code and adds a fixed markup (`SHIPPING_MARKUP_INR`, default ₹10). The charge is a separate shipping line on the PayPal bill and appears in the receipt and owner email. Weights per piece are set in `worker/wrangler.toml`.
- **Agent endpoint:** `POST /mcp` (MCP-style tools: `search_products`, `get_product`, `create_checkout`). See [`llms.txt`](llms.txt).

**Setup**
1. Create a free PayPal Developer account and a sandbox business account. Copy the REST client ID and secret, and create a webhook for `PAYMENT.CAPTURE.COMPLETED` to get its ID.
2. Create a free Gemini API key in Google AI Studio (or a Groq key and adapt `callGemini`).
3. Create a free Resend account and API key for owner emails.
4. In Shiprocket, create an API user (Settings → API) for live delivery rates.
5. In `worker/`, run `npm install`, copy `.dev.vars.example` to `.dev.vars`, and fill in the keys. Run `npx wrangler dev` to test locally.
6. Deploy with `npx wrangler deploy`. Then put the secrets in with `npx wrangler secret put <NAME>` for each key.
7. Set `window.HETAAS_API` in [`config.js`](config.js) to your Worker URL, and replace `REPLACE_WITH_WORKER_URL` in `llms.txt`.

**Notes**
- Instagram can't be filled in automatically without Meta business approval, so the buyer copies the receipt and pastes it into the DM.
- Use a Cloudflare rate-limiting rule on `/api/chat` to protect the free Gemini quota.
- Set `PAYPAL_ENV=live` and real keys only when you go live.
