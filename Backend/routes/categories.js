import express from 'express';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { uploadImage } from '../utils/cloudinary.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [categories, counts] = await Promise.all([
      Category.find().sort({ name: 1 }),
      Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    ]);
    const countMap = Object.fromEntries(counts.map(c => [c._id.toString(), c.count]));
    res.json(categories.map(cat => ({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.imageUrl,
      imageData: cat.imageData,
      itemCount: countMap[cat._id.toString()] || 0,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, imageData } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });
    if (!imageData) return res.status(400).json({ error: 'Category image is required' });
    const total = await Category.countDocuments();
    if (total >= 5) return res.status(400).json({ error: 'Limit reached: maximum 5 categories. Premium option can unlock more.' });

    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const exists = await Category.findOne({ slug });
    if (exists) return res.status(400).json({ error: 'This category already exists' });

    const imageUrl = await uploadImage(imageData, 'afra-crafts/categories');
    const category = await Category.create({ name, slug, description, imageUrl, imageData: '' });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, imageData } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Category name is required' });
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
    const fields = { name: name.trim(), description, slug };
    if (imageData) {
      fields.imageUrl  = await uploadImage(imageData, 'afra-crafts/categories');
      fields.imageData = '';
    }
    const updated = await Category.findByIdAndUpdate(id, fields, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Category not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    await Product.deleteMany({ category: id });
    await category.deleteOne();
    res.json({ message: 'Category and its products deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
