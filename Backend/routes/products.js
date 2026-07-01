import express from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { uploadImage } from '../utils/cloudinary.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.ids) filter._id = { $in: req.query.ids.split(',') };

    if (req.query.slim === 'true') {
      const products = await Product.find(filter).select('_id name price categoryName').sort({ createdAt: -1 });
      return res.json(products);
    }

    if (req.query.page) {
      const page     = Math.max(1, parseInt(req.query.page) || 1);
      const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 5));
      const total    = await Product.countDocuments(filter);
      const products = await Product.find(filter).select('-imageData').sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize);
      return res.json({ products, total, page, pageSize, hasMore: page * pageSize < total });
    }

    const products = await Product.find(filter).select('-imageData').sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, images, imageKey, imageUrl: bodyImageUrl, categoryId } = req.body;
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

    const uploadedImages = await Promise.all(
      validImages.map(async img => ({
        imageData:   await uploadImage(img.imageData, 'afra-crafts/products'),
        price:       Math.round(Number(img.price)) || 0,
        description: img.description || '',
      }))
    );

    const product = await Product.create({
      name,
      price:        uploadedImages[0].price,
      description:  uploadedImages[0].description,
      imageKey:     imageKey || '',
      imageUrl:     uploadedImages[0].imageData,
      imageData:    '',
      subImages:    uploadedImages.map(img => img.imageData),
      images:       uploadedImages,
      category:     category._id,
      categoryName: category.name,
      categorySlug: category.slug,
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, imageKey, imageUrl: bodyImageUrl, images } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (name !== undefined)     product.name     = name;
    if (imageKey !== undefined) product.imageKey = imageKey;

    if (Array.isArray(images)) {
      const valid = images.filter(img => img?.imageData);

      const uploadedImages = await Promise.all(
        valid.map(async img => ({
          imageData:   await uploadImage(img.imageData, 'afra-crafts/products'),
          price:       Math.round(Number(img.price)) || 0,
          description: img.description || '',
        }))
      );

      product.images    = uploadedImages;
      product.subImages = uploadedImages.map(img => img.imageData);
      product.imageUrl  = uploadedImages[0]?.imageData || '';
      product.imageData = '';
      if (uploadedImages[0]?.price !== undefined) product.price = uploadedImages[0].price;
      if (uploadedImages[0]?.description !== undefined) product.description = uploadedImages[0].description;
    }

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
