import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  price:        { type: Number, required: true, min: 0 },
  description:  { type: String, default: '' },
  imageKey:     { type: String, default: '' },
  imageUrl:     { type: String, default: '' },
  imageData:    { type: String, default: '' },
  subImages:    { type: [String], default: [] },
  images: [{
    imageData:   { type: String, default: '' },
    price:       { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
  }],
  category:     { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  categoryName: { type: String, required: true },
  categorySlug: { type: String, required: true },
  createdAt:    { type: Date, default: Date.now },
});

productSchema.index({ createdAt: -1 });
productSchema.index({ category: 1, createdAt: -1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
