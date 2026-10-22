import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Offer name is required'], trim: true },
    detail: { type: String, trim: true, default: '' },
    revenue: { type: Number, default: 0 },
    endsAt: Date,
    status: { type: String, enum: ['Live', 'Scheduled', 'Draft'], default: 'Draft' },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

export default mongoose.model('Offer', offerSchema);
