# The Sneaker Co. — merged project

This project combines the supplied React storefront/admin UI with the Express + MongoDB server API. The project has been reorganized into two apps:

- `server/` — Express API, MongoDB/Mongoose models, email OTP verification, JWT authentication, product image uploads, inventory/admin APIs, orders, coupons, offers, customers, addresses and wallet balance/transaction reads.

## Requirements

- Node.js 20+ (Node 22 LTS recommended)
- npm
- A MongoDB local database or MongoDB Atlas connection string
- SMTP credentials for registration OTP. Ethereal is suitable for development preview only; it does not deliver email to real customers.

## 1. Install the root development helper

From the project root, run `npm install` once. This installs the helper used by `npm run dev` to start both apps together.

## 2. Configure the server

Open a terminal in `server/` and install dependencies:

```bash
npm install
```

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `server/.env` with your own values:

```dotenv
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/sneakerco
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173,http://localhost:5174
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-ethereal-username
SMTP_PASS=your-matching-ethereal-password
EMAIL_FROM=The Sneaker Co. <your-ethereal-username>
NODE_ENV=development
```

Generate a JWT secret locally with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

For MongoDB Atlas, use the connection string from Atlas and URL-encode any special characters in the database user's password. Never commit or share `.env`.

To create or reset your admin account, run this from `server/`:

```bash
npm run create-admin
```

This prompts for the admin name, email, and password. If the email already exists, it requires you to type `PROMOTE` before resetting that account's password and role.

Start the API:

```bash
npm run dev
```

or for a non-watch process:

```bash
npm start
```

The API runs at `http://localhost:5001`. A health endpoint is available at `http://localhost:5001/api/health`.

## 3. Configure and run the client

Open another terminal in `client/`:

```bash
npm install
cp .env.example .env
npm run dev
```

Vite runs the UI at `http://localhost:5173` and proxies `/api` and `/uploads` to `http://localhost:5001`. The dev server uses a strict port so it fails rather than silently switching to an origin that may not be authorized for Google sign-in. If the API runs on another port, update `VITE_PROXY_TARGET` in `client/.env` or adjust `client/vite.config.js`.

Google sign-in requires the same OAuth web client ID in `client/.env` (`VITE_GOOGLE_CLIENT_ID`) and `server/.env` (`GOOGLE_CLIENT_ID`). Add the exact frontend origin (for local development, `http://localhost:5173`) to the OAuth client's authorized JavaScript origins in Google Cloud Console.

## Main routes

Storefront:

- `/` — home
- `/catalog` — sneaker catalogue, filters and sorting
- `/product/:id` — product detail, size/color selection, wishlist and cart
- `/register`, `/verify`, `/signin` — registration, OTP verification and sign in
- `/profile`, `/profile/addresses`, `/profile/wallet`, `/checkout`, `/orders` — customer account features

Admin:

- `/admin/login` — admin sign-in
- `/admin/dashboard` — live sales/order/inventory overview
- `/admin/products` — create, edit, delete, search/filter, stock state and upload up to five product images
- `/admin/orders` — view orders and update order status
- `/admin/customers` — search customers and block/unblock customer accounts
- `/admin/coupons`, `/admin/offers`, `/admin/categories`, `/admin/analytics` — admin management/report pages

The admin account must be created separately using `npm run create-admin`. Public registration always creates a regular customer.

## Product images

Product images are written to `server/uploads/products/` and served from `/uploads/products/...`. The folder is created automatically when the product routes load. The ZIP includes only a `.gitkeep`, not your uploaded image files.

## Important development notes

- Customer registration requires working SMTP credentials. In development, Ethereal emails return a preview link in the API response; the registration UI shows that link on the Verify Account screen.
- Card and UPI checkout use Razorpay in **test mode**. Set one matching `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` pair from the Razorpay test dashboard in `server/.env`, then restart the API. Do not define either key more than once; dotenv uses the first definition. The server captures authorized payments after validating the checkout signature and order amount. Live payments are not enabled, and wallet top-up is a UI placeholder.
- Wallet top-up is a UI placeholder and does not charge a payment method or add funds.
- Returns are described in the order-tracking UI but are not yet a fully automated returns workflow.
- The `npm run seed` command removes existing user/order/product/category/coupon/offer records before inserting demo data. Do not run it against a database with data you want to keep.
- For a production deployment, set `NODE_ENV=production`, configure real transactional email, use HTTPS, restrict CORS origins, set proper rate limiting, and use a hosted image storage service rather than relying on local server disk.

## Security

`.env` files, tokens, and credentials are excluded from this archive. Store secrets only in your local environment. Rotate any credentials that have been exposed, and never paste JWTs, database URIs, or SMTP passwords into chat or source control.


## Frontend styling

The React client uses standard CSS in `client/src/index.css`, `client/src/component-styles.css`, and component-specific stylesheets. Styling dependencies and configuration for utility CSS have been removed.

## Start both applications

After installing dependencies and configuring `server/.env`, run this from the project root:

```bash
npm run dev
```

This starts the Express API and Vite frontend together.
