import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a base64 image string to Cloudinary.
 * If the value is already a URL (starts with http), returns it unchanged.
 * If empty, returns ''.
 */
export const uploadImage = async (data, folder = 'afra-crafts') => {
  if (!data) return '';
  if (data.startsWith('http')) return data; // already a Cloudinary URL — keep as-is
  const result = await cloudinary.uploader.upload(data, {
    folder,
    resource_type: 'image',
  });
  return result.secure_url;
};

export default cloudinary;
