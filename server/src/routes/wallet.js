import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);
router.get('/', (req, res) => res.json({ balance: req.user.walletBalance || 0 }));
router.get('/transactions', asyncHandler(async (req, res) => {
  const transactions = [...(req.user.transactions || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((t) => ({ ...t.toJSON(), date: new Date(t.createdAt).toLocaleDateString('en-IN'), id: t.id }));
  res.json({ transactions, balance: req.user.walletBalance || 0 });
}));
export default router;
