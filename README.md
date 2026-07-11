# Diyla Home

A beautiful e-commerce website for selling furniture, interior decor, and kitchenware.

## Getting Started

Open `index.html` in your web browser to view the site. No build step or server required.

For local development with live reload, you can use any static server:

```bash
python3 -m http.server 8000
# Then visit http://localhost:8000
```

## Features

- Homepage with hero, categories, featured products, testimonials, newsletter
- Shop page with category filters
- Shopping cart with localStorage persistence
- Fully responsive design

## Admin Dashboard

Access the admin panel at `admin/login.html`

**Demo credentials:**
- Email: `admin@diylahome.com`
- Password: `admin123`

**Admin features:**
- Overview with revenue, orders, and category stats
- Add, edit, and delete products
- View and manage orders (status updates)
- Reset products to defaults

Orders are created when customers click "Proceed to Checkout" on the store.


- Products: Edit `js/products.js`
- Branding and colors: Edit `css/styles.css` (`:root` variables)
- Contact info: Update footer in HTML files
