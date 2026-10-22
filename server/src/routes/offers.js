import { Router } from 'express';
import Offer from '../models/Offer.js';
import asyncHandler from '../utils/asyncHandler.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

// GET /api/offers/live  -> storefront banners
router.get('/live', asyncHandler(async (req, res) => {
  res.json(await Offer.find({ status: 'Live' }).sort('endsAt'));
}));

// Everything below is admin-only
router.use(protect, adminOnly);

router.get('/', asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const [items, all] = await Promise.all([Offer.find(filter).sort('-createdAt'), Offer.find()]);
  res.json({
    items,
    summary: {
      live: all.filter((o) => o.status === 'Live').length,
      scheduled: all.filter((o) => o.status === 'Scheduled').length,
      revenue: all.reduce((n, o) => n + o.revenue, 0),
    },
  });
}));

router.post('/', asyncHandler(async (req, res) => {
  res.status(201).json(await Offer.create(req.body));
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!offer) return res.status(404).json({ message: 'Offer not found' });
  res.json(offer);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndDelete(req.params.id);
  if (!offer) return res.status(404).json({ message: 'Offer not found' });
  res.json({ message: 'Offer deleted' });
}));

export default router;
