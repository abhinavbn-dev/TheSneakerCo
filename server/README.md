# The Sneaker Co. server

Express + MongoDB (Mongoose) API for the storefront and the admin panel.

## Run it
1. `cd server && npm install`
2. Copy `.env.example` to `.env` and set `MONGO_URI` and `JWT_SECRET`. To test card/UPI checkout, also set one matching Razorpay test-mode `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` pair from the Razorpay dashboard. Do not define either key more than once; dotenv uses the first definition.
3. `npm run seed` (creates the admin account and sample data; clears the database first)
4. `npm run dev` -> http://localhost:5001/api/health

Admin login after seeding: `admin@sneakerco.com` / `Admin@123`
