import { Router } from 'express';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

// GET /api/categories  -> storefront (live only)
router.get('/', asyncHandler(async (req, res) => {
  res.json(await Category.find({ status: 'Live' }).sort('name'));
}));

// GET /api/categories/admin/list  -> admin (all, with product counts)
router.get('/admin/list', protect, adminOnly, asyncHandler(async (req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find().sort('name'),
    Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const byId = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  res.json(categories.map((c) => ({ ...c.toJSON(), products: byId[c.id] || 0 })));
}));

router.post('/', protect, adminOnly, asyncHandler(async (req, res) => {
  res.status(201).json(await Category.create(req.body));
}));

router.put('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(category);
}));

router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  if (await Product.exists({ category: req.params.id })) {
    return res.status(409).json({ message: 'Move or delete the products in this category first' });
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json({ message: 'Category deleted' });
}));

export default router;
