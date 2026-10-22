import mongoose from 'mongoose';
import crypto from 'node:crypto';

const productSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Product name is required'], trim: true },
  sku: { type: String, unique: true, sparse: true, trim: true },
  brand: { type: String, required: [true, 'Brand is required'], trim: true },
  description: { type: String, trim: true, default: '' },
  gender: { type: String, enum: ['men', 'women'], default: 'men' },
  tag: { type: String, trim: true, default: '' },
  price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
  stock: { type: Number, default: 0, min: [0, 'Stock cannot be negative'] },
  sizes: { type: [String], default: [] },
  colors: { type: [String], default: [] },
  images: { type: [String], default: [] },
  published: { type: Boolean, default: true },
}, { timestamps: true, toJSON: { virtuals: true } });

productSchema.pre('validate', function () {
  if (!this.sku) {
    const prefix = (this.name || 'SNEAKER').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 6) || 'SNEAKER';
    this.sku = `${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  }
  if (this.sizes?.length) this.sizes = this.sizes.map((size) => String(size).trim()).filter(Boolean);
  if (this.colors?.length) this.colors = this.colors.map((color) => String(color).trim()).filter(Boolean);
});

productSchema.virtual('status').get(function () {
  if (this.stock === 0) return 'Out of stock';
  if (this.stock <= 10) return 'Low stock';
  return 'Active';
});

export default mongoose.model('Product', productSchema);
