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
  const total = await Product.countDocuments();
  console.log(`  Found ${total} products in DB`);
  let migrated = 0;
  const col = mongoose.connection.db.collection('products');
  const ids = await col.find({}, { projection: { _id: 1 } }).toArray();
  console.log(`  Fetched ${ids.length} product IDs`);
  for (const { _id } of ids) {
    const prod = await col.findOne({ _id });
    const hasBase64 = prod.images?.some(img => img.imageData?.startsWith('data:'))
      || prod.imageData?.startsWith('data:')
      || prod.subImages?.some(img => img?.startsWith('data:'));
    if (!hasBase64) {
      console.log(`  – Skipping "${prod.name}" (no base64 found)`);
      continue;
    }
    try {
      // Case 1: images[] array has base64
      if (prod.images?.some(img => img.imageData?.startsWith('data:'))) {
        const uploadedImages = await Promise.all(
          prod.images.map(async img => ({
            imageData:   await upload(img.imageData, 'afra-crafts/products'),
            price:       img.price,
            description: img.description || '',
          }))
        );
        await Product.findByIdAndUpdate(prod._id, {
          images:    uploadedImages,
          imageUrl:  uploadedImages[0]?.imageData || '',
          imageData: '',
          subImages: uploadedImages.map(img => img.imageData),
        });
        migrated++;
        console.log(`  ✓ Product "${prod.name}" via images[] (${uploadedImages.length} images)`);

      // Case 2: only subImages[] has base64
      } else if (prod.subImages?.some(img => img?.startsWith('data:'))) {
        const uploadedSubImages = await Promise.all(
          prod.subImages.map(img => upload(img, 'afra-crafts/products'))
        );
        await Product.findByIdAndUpdate(prod._id, {
          subImages: uploadedSubImages,
          imageUrl:  uploadedSubImages[0] || '',
          imageData: '',
        });
        migrated++;
        console.log(`  ✓ Product "${prod.name}" via subImages[] (${uploadedSubImages.length} images)`);

      // Case 3: only top-level imageData has base64
      } else if (prod.imageData?.startsWith('data:')) {
        const url = await upload(prod.imageData, 'afra-crafts/products');
        await Product.findByIdAndUpdate(prod._id, { imageUrl: url, imageData: '', subImages: [url] });
        migrated++;
        console.log(`  ✓ Product "${prod.name}" via imageData (1 image)`);
      }
    } catch (e) {
      console.error(`  ✗ Product "${prod.name}":`, e.message);
    }
  }
  console.log(`Products: ${migrated}/${total} migrated\n`);
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

  const db = mongoose.connection.db;
  console.log('Database name:', db.databaseName);
  const rawProduct = await db.collection('products').findOne({});
  if (rawProduct) {
    console.log('Sample product:', rawProduct.name);
    console.log('  imageData:', rawProduct.imageData?.substring(0, 50) || '(empty)');
    console.log('  subImages count:', rawProduct.subImages?.length ?? 0);
    console.log('  subImages[0]:', rawProduct.subImages?.[0]?.substring(0, 50) || '(empty)');
    console.log('  images count:', rawProduct.images?.length ?? 0);
    console.log('  images[0].imageData:', rawProduct.images?.[0]?.imageData?.substring(0, 50) || '(empty)');
  }
  console.log();

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
