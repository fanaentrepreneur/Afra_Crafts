import express from 'express';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  const categoriesWithCount = await Promise.all(
    categories.map(async (category) => {
      const count = await Product.countDocuments({ category: category._id });
      return {
        _id: category._id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.imageUrl,
        imageData: category.imageData,
        itemCount: count,
      };
    })
  );
  res.json(categoriesWithCount);
});

router.post('/', async (req, res) => {
  const { name, description, imageUrl, imageData } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required' });
  const total = await Category.countDocuments();
  if (total >= 5) return res.status(400).json({ error: 'Limit reached: maximum 5 categories. Premium option can unlock more.' });

  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const exists = await Category.findOne({ slug });
  if (exists) return res.status(400).json({ error: 'This category already exists' });

  const category = await Category.create({ name, slug, description, imageUrl: imageUrl || '', imageData: imageData || '' });
  res.status(201).json(category);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, imageUrl, imageData } = req.body;
  const slug = name?.toLowerCase().replace(/\s+/g, '-');
  const updated = await Category.findByIdAndUpdate(
    id,
    { name, description, slug, imageUrl: imageUrl || '', imageData: imageData || '' },
    { new: true, runValidators: true }
  );
  if (!updated) return res.status(404).json({ error: 'Category not found' });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const category = await Category.findById(id);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  await Product.deleteMany({ category: id });
  await category.deleteOne();
  res.json({ message: 'Category and its products deleted successfully' });
});

export default router;
