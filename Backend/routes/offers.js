import express from 'express';
import Offer from '../models/Offer.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const offers = await Offer.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(offers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/all', async (req, res) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.json(offers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, imageData, discountLabel, productIds } = req.body;
    if (!name) return res.status(400).json({ error: 'Offer name is required' });
    const offer = await Offer.create({
      name,
      description: description || '',
      imageData: imageData || '',
      discountLabel: discountLabel || '',
      productIds: productIds || [],
      isActive: true,
    });
    res.status(201).json(offer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, imageData, discountLabel, productIds, isActive } = req.body;
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    if (name !== undefined) offer.name = name;
    if (description !== undefined) offer.description = description;
    if (imageData) offer.imageData = imageData;
    if (discountLabel !== undefined) offer.discountLabel = discountLabel;
    if (productIds !== undefined) offer.productIds = productIds;
    if (isActive !== undefined) offer.isActive = isActive;
    await offer.save();
    res.json(offer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    await offer.deleteOne();
    res.json({ message: 'Offer deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
