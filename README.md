# Madhav Poojapa Angular Store

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.3.

Responsive Angular storefront and admin workspace based on the Flutter app in `../frontend`.

## Run

```powershell
npm install
npm start
```

Open `http://localhost:4200`. The app uses `https://mkcreation-cv4e.onrender.com` by default, matching the Flutter API configuration. To use a local backend, set the runtime URL in `src/index.html` before the app loads:

```html
<script>window.POOJAPA_API_URL = 'http://localhost:5000';</script>
```

The Express API must be running and configured with its database. See `../README.md` for backend setup and admin account seeding.

## Included

- Madhav Poojapa branding and logo
- Frontend-only English and Hindi interface language selection (saved in the browser)
- Catalog and account details remain in the language supplied by the existing API
- Product and category browsing, search, sorting, and product details
- Customer registration and sign-in with persisted JWT sessions
- Persistent cart, stock-aware quantities, delivery calculation, and cash-on-delivery checkout
- Customer order history and profile
- Admin dashboard metrics, order status updates, and product creation/removal

## API routes

The frontend integrates with `/api/auth`, `/api/categories`, `/api/products`, `/api/orders`, and `/api/admin`. The API base URL can be overridden with `window.POOJAPA_API_URL`.

## Verify

```powershell
npm run build
```

## Deploy to Netlify

Netlify should use `npm run build` as the build command and
`dist/poojapa-angular/browser` as the publish directory. These settings are also
defined in `netlify.toml`.
