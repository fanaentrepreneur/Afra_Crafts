import express from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.ids) filter._id = { $in: req.query.ids.split(',') };
  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products);
});

router.post('/', async (req, res) => {
  const { name, images, imageKey, imageUrl, categoryId } = req.body;
  if (!name || !categoryId) {
    return res.status(400).json({ error: 'Name and category are required' });
  }
  if (!Array.isArray(images) || images.length === 0 || !images[0]?.imageData || images[0]?.price === undefined) {
    return res.status(400).json({ error: 'At least one image with price is required' });
  }

  const category = await Category.findById(categoryId);
  if (!category) return res.status(404).json({ error: 'Category not found' });

  const count = await Product.countDocuments({ category: categoryId });
  if (count >= 15) {
    return res.status(400).json({ error: 'Limit reached: maximum 15 products per category.' });
  }

  const validImages = images.filter(img => img?.imageData && img?.price !== undefined);
  const product = await Product.create({
    name,
    price:       validImages[0].price,
    description: validImages[0].description || '',
    imageKey:    imageKey || '',
    imageUrl:    imageUrl || '',
    imageData:   validImages[0].imageData,
    subImages:   validImages.map(img => img.imageData),
    images:      validImages,
    category:     category._id,
    categoryName: category.name,
    categorySlug: category.slug,
  });
  res.status(201).json(product);
});

router.put('/:id', async (req, res) => {
  const { name, imageKey, imageUrl, images } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  if (name !== undefined)     product.name     = name;
  if (imageKey !== undefined) product.imageKey = imageKey;
  if (imageUrl !== undefined) product.imageUrl = imageUrl;
  if (Array.isArray(images)) {
    const valid = images.filter(img => img?.imageData);
    product.images      = valid;
    product.subImages   = valid.map(img => img.imageData);
    product.imageData   = valid[0]?.imageData || '';
    if (valid[0]?.price !== undefined) product.price = valid[0].price;
    if (valid[0]?.description !== undefined) product.description = valid[0].description;
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
