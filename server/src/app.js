import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import customerRoutes from './routes/customers.js';
import orderRoutes from './routes/orders.js';
import couponRoutes from './routes/coupons.js';
import offerRoutes from './routes/offers.js';
import statsRoutes from './routes/stats.js';
import userRoutes from './routes/users.js';
import walletRoutes from './routes/wallet.js';
import paymentRoutes from './routes/payments.js';

import { notFound, errorHandler } from './middleware/error.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const allowed = (
  process.env.CLIENT_URL ||
  'http://localhost:5173,http://localhost:5174'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowed }));
app.use(express.json({ limit: '2mb' }));

app.use(
  '/uploads',
  express.static(path.resolve(__dirname, '../uploads'))
);

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/payments', paymentRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
