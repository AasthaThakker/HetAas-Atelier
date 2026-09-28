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

## Editing the shop

- **Add / edit / remove a product** → edit `products.json`. Each entry has `name`, `category`, `price`, `image`, `description`, and optional flags like `bestseller` / `customizable`.
- **Change site copy** (hero text, about, FAQs, Instagram handle) → edit `content.json`.
- **Product photos** live in the `images/` folder.

## Run locally

Because the site loads data with `fetch()`, open it through a local server (not by double-clicking the file):

```bash
python -m http.server 8000
```

Then visit **http://localhost:8000**.

## Deploy

Hosted on **GitHub Pages** from the `main` branch. Push to `main` and the live site updates automatically:

```bash
git push origin main
```

## How ordering works

Customers add items to the **Resin Basket** → checkout copies a tidy order summary → opens an Instagram DM to paste and send. All orders are pre-paid; each piece is handcrafted to order (4–6 day curing time).

---

*© HetAas Atelier · Handcrafted Resin Art · Ahmedabad, Gujarat, India*
