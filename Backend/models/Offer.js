import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  description:   { type: String, default: '' },
  imageData:     { type: String, default: '' },
  discountLabel: { type: String, default: '' },
  productIds:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  isActive:      { type: Boolean, default: true },
  createdAt:     { type: Date, default: Date.now },
});

const Offer = mongoose.model('Offer', offerSchema);
export default Offer;
