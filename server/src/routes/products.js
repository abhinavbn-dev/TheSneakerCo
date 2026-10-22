import { Router } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import crypto from 'node:crypto';
import multer from 'multer';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { listing, searchRegex } from '../utils/listing.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../../uploads/products');
fs.mkdirSync(uploadDir, { recursive: true });
const statusFilter = {
  Active: { stock: { $gt: 10 } },
  'Low stock': { stock: { $gt: 0, $lte: 10 } },
  'Out of stock': { stock: 0 },
};
const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().slice(0, 12);
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(png|jpe?g|webp|gif|avif)$/i.test(file.mimetype)) return cb(new Error('Upload JPG, PNG, WebP, GIF or AVIF images only.'));
    cb(null, true);
  },
});

// Public storefront list; legacy products without a published property remain visible.
router.get('/', asyncHandler(async (req, res) => {
  const filter = { $or: [{ published: true }, { published: { $exists: false } }] };
  if (req.query.gender && ['men', 'women', 'unisex'].includes(String(req.query.gender).toLowerCase())) filter.gender = String(req.query.gender).toLowerCase();
  if (req.query.brand) filter.brand = searchRegex(req.query.brand);
  if (req.query.tag) filter.tag = req.query.tag;
  if (req.query.q) filter.$and = [{ $or: [{ name: searchRegex(req.query.q) }, { brand: searchRegex(req.query.q) }, { sku: searchRegex(req.query.q) }] }];
  const data = await listing(Product, filter, req, { sort: '-createdAt' });
  res.json({ ...data, products: data.items });
}));

// Admin inventory list and summary.
router.get('/admin/list', protect, adminOnly, asyncHandler(async (req, res) => {
  const filter = { ...(statusFilter[req.query.status] || {}) };
  if (req.query.q) filter.$or = [{ name: searchRegex(req.query.q) }, { sku: searchRegex(req.query.q) }, { brand: searchRegex(req.query.q) }];
  const data = await listing(Product, filter, req, { sort: '-createdAt' });
  const [totalSkus, lowStock, inventory] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ stock: { $gt: 0, $lte: 10 } }),
    Product.aggregate([{ $group: { _id: null, units: { $sum: '$stock' }, value: { $sum: { $multiply: ['$stock', '$price'] } } } }]),
  ]);
  res.json({ ...data, products: data.items, summary: { totalSkus, lowStock, units: inventory[0]?.units || 0, inventoryValue: inventory[0]?.value || 0 } });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product || product.published === false) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
}));

router.post('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (typeof payload.sizes === 'string') payload.sizes = payload.sizes.split(',').map((v) => v.trim()).filter(Boolean);
  if (typeof payload.colors === 'string') payload.colors = payload.colors.split(',').map((v) => v.trim()).filter(Boolean);
  if (payload.price !== undefined) payload.price = Number(payload.price);
  if (payload.stock !== undefined) payload.stock = Number(payload.stock);
  const product = await Product.create(payload);
  res.status(201).json({ success: true, message: 'Product added successfully', product });
}));

router.put('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (typeof payload.sizes === 'string') payload.sizes = payload.sizes.split(',').map((v) => v.trim()).filter(Boolean);
  if (typeof payload.colors === 'string') payload.colors = payload.colors.split(',').map((v) => v.trim()).filter(Boolean);
  if (payload.price !== undefined) payload.price = Number(payload.price);
  if (payload.stock !== undefined) payload.stock = Number(payload.stock);
  delete payload._id;
  const product = await Product.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ success: true, message: 'Product updated successfully', product });
}));

router.post('/:id/images', protect, adminOnly, imageUpload.array('images', 5), asyncHandler(async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ message: 'Choose at least one image.' });
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const newImages = req.files.map((file) => `/uploads/products/${file.filename}`);
  const replaceExisting = String(req.body.replace || '').toLowerCase() === 'true';
  const previousImages = Array.isArray(product.images) ? [...product.images] : [];
  product.images = replaceExisting ? newImages : [...previousImages, ...newImages].slice(0, 5);
  await product.save();

  if (replaceExisting) {
    for (const image of previousImages) {
      if (typeof image === 'string' && image.startsWith('/uploads/products/')) {
        const filePath = path.resolve(uploadDir, path.basename(image));
        fs.promises.unlink(filePath).catch(() => {});
      }
    }
  }

  res.json({ success: true, message: 'Product images uploaded', product });
}));

router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  for (const image of product.images || []) {
    if (typeof image === 'string' && image.startsWith('/uploads/products/')) {
      const filePath = path.resolve(uploadDir, path.basename(image));
      fs.promises.unlink(filePath).catch(() => {});
    }
  }
  res.json({ success: true, message: 'Product deleted' });
}));

export default router;
