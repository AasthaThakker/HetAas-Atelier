# HetAas Atelier 🌸

Storefront for **HetAas Atelier** — handmade resin treasures crafted in Ahmedabad, Gujarat (bookmarks, earrings, keychains, coasters, pooja thalis & custom pieces).

🔗 **Live site:** https://hetaas-atelier.aasthathakker.com/
📩 **Orders:** via Instagram DM [@hetaas_atelier](https://www.instagram.com/hetaas_atelier)

## What it is

A fast, mobile-first static website — plain **HTML, CSS & JavaScript**, no build step or framework. Works offline as a PWA and is hosted free on GitHub Pages.

> This repo is the real shop. The PayPal + AI-assistant hackathon demo lives in its own repo: [hetaas-paypal-ai-hackathon](https://github.com/AasthaThakker/hetaas-paypal-ai-hackathon). The two are developed separately.

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
