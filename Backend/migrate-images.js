/**
 * One-time migration script: uploads all existing base64 images to Cloudinary
 * and replaces them with URLs in MongoDB.
 *
 * Run once with:  node migrate-images.js
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import Product  from './models/Product.js';
import Category from './models/Category.js';
import Offer    from './models/Offer.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = async (base64, folder) => {
  if (!base64 || base64.startsWith('http')) return base64 || '';
  const result = await cloudinary.uploader.upload(base64, { folder, resource_type: 'image' });
  return result.secure_url;
};

async function migrateCategories() {
  const cats = await Category.find({});
  let migrated = 0;
  for (const cat of cats) {
    const needsMigration = cat.imageData && cat.imageData.startsWith('data:');
    if (!needsMigration) continue;
    try {
      const url = await upload(cat.imageData, 'afra-crafts/categories');
      await Category.findByIdAndUpdate(cat._id, { imageUrl: url, imageData: '' });
      migrated++;
      console.log(`  ✓ Category "${cat.name}"`);
    } catch (e) {
      console.error(`  ✗ Category "${cat.name}":`, e.message);
    }
  }
  console.log(`Categories: ${migrated}/${cats.length} migrated\n`);
}

async function migrateProducts() {
  const products = await Product.find({});
  let migrated = 0;
  for (const prod of products) {
    const hasBase64 = prod.images?.some(img => img.imageData?.startsWith('data:'))
      || prod.imageData?.startsWith('data:');
    if (!hasBase64) continue;
    try {
      const uploadedImages = await Promise.all(
        (prod.images || []).map(async img => ({
          imageData:   await upload(img.imageData, 'afra-crafts/products'),
          price:       img.price,
          description: img.description || '',
        }))
      );

      // Fallback: if images array was empty but imageData existed
      if (uploadedImages.length === 0 && prod.imageData?.startsWith('data:')) {
        const url = await upload(prod.imageData, 'afra-crafts/products');
        await Product.findByIdAndUpdate(prod._id, { imageUrl: url, imageData: '', subImages: [url] });
      } else {
        await Product.findByIdAndUpdate(prod._id, {
          images:    uploadedImages,
          imageUrl:  uploadedImages[0]?.imageData || '',
          imageData: '',
          subImages: uploadedImages.map(img => img.imageData),
        });
      }
      migrated++;
      console.log(`  ✓ Product "${prod.name}" (${uploadedImages.length} image${uploadedImages.length !== 1 ? 's' : ''})`);
    } catch (e) {
      console.error(`  ✗ Product "${prod.name}":`, e.message);
    }
  }
  console.log(`Products: ${migrated}/${products.length} migrated\n`);
}

async function migrateOffers() {
  const offers = await Offer.find({});
  let migrated = 0;
  for (const offer of offers) {
    const needsMigration = offer.imageData && offer.imageData.startsWith('data:');
    if (!needsMigration) continue;
    try {
      const url = await upload(offer.imageData, 'afra-crafts/offers');
      await Offer.findByIdAndUpdate(offer._id, { imageData: url });
      migrated++;
      console.log(`  ✓ Offer "${offer.name}"`);
    } catch (e) {
      console.error(`  ✗ Offer "${offer.name}":`, e.message);
    }
  }
  console.log(`Offers: ${migrated}/${offers.length} migrated\n`);
}

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.\n');

  console.log('── Migrating Categories ──');
  await migrateCategories();

  console.log('── Migrating Products ──');
  await migrateProducts();

  console.log('── Migrating Offers ──');
  await migrateOffers();

  console.log('Migration complete!');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
