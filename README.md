# WEPRO diploma store

## Run locally

Requires Node.js 18 or newer. Run `npm start` and open `http://127.0.0.1:4175`.

## Deploy to Netlify

Netlify builds the static site with `npm run build` and publishes `dist`. The browser connects directly to the shared Sandbox Shop API at `https://api.wepro.uz/sandbox-shop`; no database credentials or server functions are needed.

The Sandbox API supports accounts, products, categories, carts, orders, and shared product comments. Accounts and comments are shared through the class sandbox and are automatically deleted after 45 days. The API accepts login by email; registration requires name, surname, phone, email, and password. Use a dummy password for the class sandbox; do not reuse a real password.
