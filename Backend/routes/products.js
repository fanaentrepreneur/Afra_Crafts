import express from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products);
});

router.post('/', async (req, res) => {
  const { name, price, description, imageKey, imageUrl, imageData, subImages, categoryId } = req.body;
  if (!name || !price || !categoryId) {
    return res.status(400).json({ error: 'Name, price, and category are required' });
  }

  const category = await Category.findById(categoryId);
  if (!category) return res.status(404).json({ error: 'Category not found' });

  const count = await Product.countDocuments({ category: categoryId });
  if (count >= 5) {
    return res.status(400).json({ error: 'Limit reached: maximum 5 products per category. Upgrade to Premium for more.' });
  }

  const filteredSubs = Array.isArray(subImages) ? subImages.filter(Boolean) : [];
  const product = await Product.create({
    name,
    price,
    description: description || '',
    imageKey:   imageKey   || '',
    imageUrl:   imageUrl   || '',
    imageData:  filteredSubs[0] || imageData || '',
    subImages:  filteredSubs,
    category:     category._id,
    categoryName: category.name,
    categorySlug: category.slug,
  });
  res.status(201).json(product);
});

router.put('/:id', async (req, res) => {
  const { name, price, description, imageKey, imageUrl, imageData, subImages } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  if (name !== undefined)        product.name        = name;
  if (price !== undefined)       product.price       = price;
  if (description !== undefined) product.description = description;
  if (imageKey !== undefined)    product.imageKey    = imageKey;
  if (imageUrl !== undefined)    product.imageUrl    = imageUrl;
  if (imageData)                 product.imageData   = imageData;
  if (Array.isArray(subImages)) {
    product.subImages = subImages.filter(Boolean);
    if (product.subImages.length > 0) product.imageData = product.subImages[0];
  }

  await product.save();
  res.json(product);
});

router.delete('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  await product.deleteOne();
  res.json({ message: 'Product deleted successfully' });
});

export default router;
