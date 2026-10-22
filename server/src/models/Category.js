import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Category name is required'], unique: true, trim: true },
    desc: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['Live', 'Hidden'], default: 'Live' },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

export default mongoose.model('Category', categorySchema);
